import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
  onImageClick?: (src: string) => void;
}

export default function MarkdownRenderer({ content, onImageClick }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none prose-sm font-space">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const codeStr = String(children).replace(/\n$/, "");
            if (match) {
              return (
                <div className="rounded-lg overflow-hidden border border-white/10 my-3">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 border-b border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-space font-semibold">
                      {match[1]}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: "13px",
                      background: "#0f172a",
                    }}
                  >
                    {codeStr}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code
                className="bg-slate-800/80 text-sm text-blue-300 px-1.5 py-0.5 rounded border border-white/10 font-space"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1 text-slate-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-300">{children}</ol>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-blue-500/30 pl-4 my-3 text-slate-400 italic">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold text-white mt-6 mb-3 font-space">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold text-white mt-5 mb-2 font-space">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-white mt-4 mb-2 font-space">{children}</h3>;
          },
          p({ children }) {
            return <p className="text-sm text-slate-300 leading-relaxed my-2 font-space">{children}</p>;
          },
          hr() {
            return <hr className="border-white/10 my-6" />;
          },
          img({ src, alt }) {
            const imgSrc = String(src ?? "");
            return (
              <img
                src={imgSrc}
                alt={alt ?? ""}
                onClick={() => onImageClick?.(imgSrc)}
                className="rounded-lg max-w-full my-3 border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
              />
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-white/10 px-3 py-2 text-left text-slate-300 font-semibold bg-slate-800/50">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="border border-white/10 px-3 py-2 text-slate-400">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
