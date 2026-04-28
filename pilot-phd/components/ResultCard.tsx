"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ResultCardProps {
  label?: string;
  content: string;
  showCopy?: boolean;
}

export default function ResultCard({
  label,
  content,
  showCopy = true,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </span>
        )}
        {showCopy && (
          <button
            onClick={handleCopy}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                </svg>
                Copy
              </>
            )}
          </button>
        )}
      </div>

      <div className="prose prose-sm prose-gray max-w-none text-gray-700 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
