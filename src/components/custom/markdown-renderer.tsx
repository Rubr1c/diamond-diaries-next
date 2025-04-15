import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ ...props }) => <h1 className="text-3xl font-bold" {...props} />,
        h2: ({ ...props }) => <h2 className="text-2xl font-bold" {...props} />,
        h3: ({ ...props }) => <h3 className="text-xl font-bold" {...props} />,
        p: ({ ...props }) => <p className="text-lg" {...props} />,
        li: ({ ...props }) => <li className="text-lg" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-5" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-5" {...props} />,
        strong: ({ ...props }) => <strong className="font-bold" {...props} />,
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
        thead: ({ ...props }) => <thead className="bg-gray-200" {...props} />,
        tbody: ({ ...props }) => <tbody className="bg-white" {...props} />,
        tfoot: ({ ...props }) => <tfoot className="bg-gray-200" {...props} />,
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
  );
}
