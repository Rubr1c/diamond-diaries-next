'use client';

import { fetchEntryByUuid, editEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

export default function EntryPage() {
  const params = useParams();
  const queryClient = useQueryClient();

  const id = params.id as string;
  const { data: entry } = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  async function handleFavoriteToggle() {
    if (!entry) return;

    await editEntry(entry.id, { isFavorite: !entry.isFavorite });
    // Invalidate both the specific entry query and the entries list
    queryClient.invalidateQueries({ queryKey: [`entry-${id}`] });
    queryClient.invalidateQueries({ queryKey: ['entries'] });
  }

  return (
    <div className="mt-20 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold">{entry?.title}</h1>
      <div className="prose prose-lg w-full">
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
            ul: ({ ...props }) => <ul className="list-disc pl-5" {...props} />,
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
              <code className="bg-gray-200 p-1 rounded" {...props} />
            ),
            blockquote: ({ ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic"
                {...props}
              />
            ),
            img: ({ ...props }) => (
              <img className="max-w-72 h-auto" {...props} />
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
            tbody: ({ ...props }) => <tbody className="bg-white" {...props} />,
            tfoot: ({ ...props }) => (
              <tfoot className="bg-gray-200" {...props} />
            ),
            hr: ({ ...props }) => (
              <hr className="border-t-2 border-gray-300 my-4" {...props} />
            ),
          }}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {entry?.content.replace(/\\n/g, '\n')}
        </ReactMarkdown>
      </div>

      {/* Favorite Button Section */}
      <div className="flex justify-center mt-8 mb-8">
        <button
          onClick={handleFavoriteToggle}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
        >
          {entry?.isFavorite ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
          <span>
            {entry?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </span>
        </button>
      </div>
      <p className="text-gray-600 text-sm mt-2">{entry?.wordCount} words</p>
    </div>
  );
}
