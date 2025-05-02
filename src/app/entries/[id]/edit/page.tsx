'use client';

import { fetchEntryByUuid, editEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import { useUser } from '@/hooks/useUser';
import { Mic, MicOff } from 'lucide-react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#>*_~`\-]/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

export default function EntryEditPage() {
  const {} = useUser();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [autosave, setAutosave] = useState(false);
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const id = params.id as string;

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const { data: entry } = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (entry && !content) {
      setContent(entry.content.replace(/\\n/g, '\n'));
    }
  }, [entry, content]);

  useEffect(() => {
    const cookieValue = getCookie('entry-autosave');
    if (cookieValue === 'true') {
      setAutosave(true);
    } else if (cookieValue === 'false') {
      setAutosave(false);
    } else {
      setAutosave(false);
    }
  }, []);

  useEffect(() => {
    if (!autosave) return;
    if (!entry) return;
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(async () => {
      setIsSaving(true);
      const plain = stripMarkdown(content);
      const wc = countWords(plain);
      await editEntry(entry.id, {
        content: content.replace(/\n/g, '\\n'),
        wordCount: wc,
      });
      queryClient.invalidateQueries({ queryKey: [`entry-${id}`] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setIsSaving(false);
    }, 2000);
    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, autosave]);

  // Effect to append transcript to content when it changes
  useEffect(() => {
    if (transcript) {
      setContent((prevContent) => prevContent + ' ' + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entry) return;
    setIsSaving(true);
    const plain = stripMarkdown(content);
    const wc = countWords(plain);
    await editEntry(entry.id, {
      content: content.replace(/\n/g, '\\n'),
      wordCount: wc,
    });
    queryClient.invalidateQueries({ queryKey: [`entry-${id}`] });
    queryClient.invalidateQueries({ queryKey: ['entries'] });
    setIsSaving(false);
    router.push(`/entries/${id}`);
  }

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
      });
    }
  };

  // Remove the problematic useEffect that's causing duplicate transcriptions
  // useEffect(() => {
  //   if (listening) {
  //     SpeechRecognition.stopListening();
  //   } else {
  //     SpeechRecognition.startListening({
  //       continuous: true,
  //       interimResults: true,
  //       language: 'en-US',
  //     });
  //   }
  // }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="text-center mt-4">
        Browser doesn&apos;t support speech recognition.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16 pb-16 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 h-[85vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {autosave !== undefined && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newValue = !autosave;
                      setAutosave(newValue);
                      setCookie('entry-autosave', newValue ? 'true' : 'false');
                    }}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00778a] ${
                      autosave ? 'bg-[#01C269]' : 'bg-gray-300'
                    }`}
                    type="button"
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                        autosave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <label
                    className="select-none cursor-pointer text-[#003243] hover:text-[#01C269] transition-colors duration-200"
                    onClick={() => {
                      const newValue = !autosave;
                      setAutosave(newValue);
                      setCookie('entry-autosave', newValue ? 'true' : 'false');
                    }}
                  >
                    Autosave
                  </label>
                  {autosave && (
                    <span className="ml-2 text-sm text-gray-500">
                      {isSaving ? 'Saving...' : 'Autosave enabled'}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#01C269] text-white rounded-lg shadow-sm hover:bg-[#01A050] hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer flex items-center"
            >
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Saving...
                </>
              ) : (
                'Done'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
            {/* Editor */}
            <div className="w-full h-full">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#01C269] focus:border-transparent whitespace-pre-wrap bg-[#1E4959] text-white border-0 overflow-auto"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>

            {/* Preview */}
            <div className="w-full h-full border border-gray-200 rounded-lg shadow-sm p-4 overflow-y-auto prose prose-lg bg-white">
              <MarkdownRenderer content={content} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {entry && <span>{countWords(stripMarkdown(content))} words</span>}
            </div>

            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-full ${
                listening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-[#01C269] hover:bg-[#01A050]'
              } text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center`}
              title={listening ? 'Stop recording' : 'Start voice to text'}
            >
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
