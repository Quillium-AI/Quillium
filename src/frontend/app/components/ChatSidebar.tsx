"use client";

import { Source } from './ChatInterface';

interface ChatSidebarProps {
  sources: Source[];
  relatedQuestions: string[];
  onQuestionClick: (question: string) => void;
}

/**
 * Sidebar component that displays sources and related questions
 */
export default function ChatSidebar({ sources, relatedQuestions, onQuestionClick }: ChatSidebarProps) {
  // Debug related questions
  console.log('ChatSidebar received relatedQuestions:', relatedQuestions);
  return (
    <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-6">
      {/* Sources */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">Sources</h2>
        {sources.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No sources available</p>
        ) : (
          <div className="space-y-3 max-h-[30vh] overflow-y-auto">
            {sources.map((source, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h3 className="font-medium text-indigo-500 dark:text-indigo-300">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {source.title}
                  </a>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{source.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Message #{source.msgNum}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Questions */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">Related Questions</h2>
        {relatedQuestions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No related questions available</p>
        ) : (
          <div className="space-y-2 max-h-[30vh] overflow-y-auto">
            {relatedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition duration-200 text-sm"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
