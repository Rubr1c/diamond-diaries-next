'use client';

import { fetchEntryByUuid, editEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import { useUser } from '@/hooks/useUser';

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

  return (
    <div className="mt-20 max-w-[90%] mx-auto px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center mb-2 gap-2">
          {autosave !== undefined && (
            <>
              <input
                type="checkbox"
                id="autosave-toggle"
                checked={autosave}
                onChange={() => {
                  setAutosave((prev) => {
                    const newValue = !prev;
                    setCookie('entry-autosave', newValue ? 'true' : 'false');
                    return newValue;
                  });
                }}
                className="mr-2"
              />
              <label
                htmlFor="autosave-toggle"
                className="select-none cursor-pointer"
              >
                Autosave
              </label>
              {autosave && (
                <span className="ml-2 text-sm text-gray-500">
                  {isSaving ? 'Saving...' : 'Autosave enabled'}
                </span>
              )}
            </>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="w-full">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent whitespace-pre-wrap"
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>

          {/* Preview */}
          <div className="w-full border rounded-lg shadow-sm p-4 overflow-y-auto prose prose-lg">
            <MarkdownRenderer content={content} />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
