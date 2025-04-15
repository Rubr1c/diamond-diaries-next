'use client';

import { fetchEntryByUuid, editEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function EntryEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const id = params.id as string;

  const { data: entry } = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (entry && !content) {
      setContent(entry.content.replace(/\\n/g, '\n')); // Replace any escaped newlines with actual newlines
    }
  }, [entry, content]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entry) return;

    await editEntry(entry.id, { content: content.replace(/\n/g, '\\n') }); // Convert newlines to escaped newlines for storage
    queryClient.invalidateQueries({ queryKey: [`entry-${id}`] });
    router.push(`/entries/${id}`);
  }

  return (
    <div className="mt-20 max-w-[90%] mx-auto px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => (
                  <h1 className="text-3xl font-bold" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-2xl font-bold" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-xl font-bold" {...props} />
                ),
                p: ({ ...props }) => <p className="text-lg" {...props} />,
                li: ({ ...props }) => <li className="text-lg" {...props} />,
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-5" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-5" {...props} />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-bold" {...props} />
                ),
                em: ({ ...props }) => <em className="italic" {...props} />,
                a: ({ ...props }) => (
                  <a className="text-blue-500 hover:underline" {...props} />
                ),
                code: ({ ...props }) => (
                  <code
                    className="bg-gray-200 p-1 rounded text-sm break-words whitespace-pre-wrap max-w-full overflow-x-auto"
                    {...props}
                  />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-4 border-gray-300 pl-4 italic"
                    {...props}
                  />
                ),
                img: ({ ...props }) => (
                  <img
                    className="max-w-[500px] max-h-[400px] h-auto object-contain mx-auto"
                    {...props}
                  />
                ),
                table: ({ ...props }) => (
                  <table
                    className="min-w-full border-collapse border border-gray-300"
                    {...props}
                  />
                ),
                th: ({ ...props }) => (
                  <th className="border border-gray-300 px-4 py-2" {...props} />
                ),
                td: ({ ...props }) => (
                  <td className="border border-gray-300 px-4 py-2" {...props} />
                ),
                thead: ({ ...props }) => (
                  <thead className="bg-gray-200" {...props} />
                ),
                tbody: ({ ...props }) => (
                  <tbody className="bg-white" {...props} />
                ),
                tfoot: ({ ...props }) => (
                  <tfoot className="bg-gray-200" {...props} />
                ),
                hr: ({ ...props }) => (
                  <hr className="border-t-2 border-gray-300 my-4" {...props} />
                ),
                pre: ({ ...props }) => (
                  <pre
                    className="bg-gray-200 p-4 rounded-lg text-sm overflow-x-auto max-w-full my-4"
                    {...props}
                  />
                ),
              }}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {content}
            </ReactMarkdown>
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
