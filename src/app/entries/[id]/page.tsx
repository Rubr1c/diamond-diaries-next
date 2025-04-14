'use client';

import { fetchEntryByUuid } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

export default function EntryPage() {
  const params = useParams();

  const id = params.id as string;
  const { data: entry } = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  console.log(entry);

  return (
    <div className="mt-20 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold">{entry?.title}</h1>
      <p>Entry ID: {entry?.publicId}</p>
      <div className="prose prose-lg w-full">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-3xl font-bold" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-2xl font-bold" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-bold" {...props} />
            ),
            p: ({ node, ...props }) => <p className="text-lg" {...props} />,
            li: ({ node, ...props }) => <li className="text-lg" {...props} />,
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold" {...props} />
            ),
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            a: ({ node, ...props }) => (
              <a className="text-blue-500 hover:underline" {...props} />
            ),
            code: ({ node, ...props }) => (
              <code className="bg-gray-200 p-1 rounded" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic"
                {...props}
              />
            ),
            img: ({ node, ...props }) => (
              <img className="max-w-72 h-auto" {...props} />
            ),
            table: ({ node, ...props }) => (
              <table
                className="min-w-full border-collapse border border-gray-300"
                {...props}
              />
            ),
            th: ({ node, ...props }) => (
              <th className="border border-gray-300 px-4 py-2" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-gray-300 px-4 py-2" {...props} />
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-gray-200" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody className="bg-white" {...props} />
            ),
            tfoot: ({ node, ...props }) => (
              <tfoot className="bg-gray-200" {...props} />
            ),
            hr: ({ node, ...props }) => (
              <hr className="border-t-2 border-gray-300 my-4" {...props} />
            ),
          }}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {entry?.content.replace(/\\n/g, '\n')}
        </ReactMarkdown>
      </div>
    </div>
  );
}
