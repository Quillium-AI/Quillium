"use client";

import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
import { useAuth } from './AuthProvider';

// Types for WebSocket messages
type Message = {
  content: string;
  role: 'user' | 'assistant';
  msgNum: number;
  sources?: Source[];
  relatedQuestions?: string[];
};

type Source = {
  title: string;
  url: string;
  description: string;
  msgNum: number;
};



export default function ChatInterface() {
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const { handleLogout, isLoggingOut, isDeletingAccount, error } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [qualityProfile, setQualityProfile] = useState('balanced');
  const [sources, setSources] = useState<Source[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Define proper types for WebSocket responses
  type ChatResponseMessage = {
    content: string;
    msgNum: number;
  };

  type ChatResponse = {
    message?: ChatResponseMessage;
    sources?: Source[];
    relatedQuestions?: { questions: string[] };
    chatId?: string;
  };

  type ChatStreamData = {
    content: string;
    msgNum: number;
    done: boolean;
    chatId?: string;
    sources?: Source[];
    relatedQuestions?: { questions: string[] };
  };

  // Process incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('Received WebSocket message type:', lastMessage.type);
    console.log('Message content:', lastMessage.content);

    if (lastMessage.type === 'chat_response') {
      const response = lastMessage.content as ChatResponse;
      setIsLoading(false);

      // Update messages with the assistant's response
      if (response.message && typeof response.message.content === 'string' && typeof response.message.msgNum === 'number') {
        const newMessage: Message = {
          content: response.message.content,
          role: 'assistant',
          msgNum: response.message.msgNum,
          sources: response.sources || [],
          relatedQuestions: response.relatedQuestions?.questions || []
        };
        setMessages(prev => [...prev, newMessage]);
      }

      // Update sources and related questions
      if (response.sources) {
        setSources(response.sources);
      }

      if (response.relatedQuestions?.questions) {
        setRelatedQuestions(response.relatedQuestions.questions);
      }

      // Save chat ID for future messages
      if (response.chatId && !chatId) {
        setChatId(response.chatId);
      }
    } else if (lastMessage.type === 'chat_stream') {
      // Handle streaming response
      const streamData = lastMessage.content as ChatStreamData;

      if (typeof streamData.content === 'string') {
        // Update messages with the new content chunk
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            // Update the last message content
            const updatedMessages = [...prev];
            updatedMessages[prev.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + streamData.content
            };
            return updatedMessages;
          } else {
            // Create a new assistant message
            const newMessage: Message = {
              content: streamData.content,
              role: 'assistant',
              msgNum: typeof streamData.msgNum === 'number' ? streamData.msgNum : prev.length + 1
            };
            return [...prev, newMessage];
          }
        });

        // If this is the final chunk (done=true), update sources and related questions
        if (streamData.done === true) {
          console.log('Final stream chunk received with sources:', streamData.sources);
          console.log('Final stream chunk received with related questions:', streamData.relatedQuestions);

          // Update sources if available
          if (streamData.sources && Array.isArray(streamData.sources)) {
            setSources(streamData.sources);
          }

          // Update related questions if available
          if (streamData.relatedQuestions && streamData.relatedQuestions.questions) {
            setRelatedQuestions(streamData.relatedQuestions.questions);
          }

          // Save chat ID for future messages if available
          if (streamData.chatId && !chatId) {
            setChatId(streamData.chatId);
          }

          // Mark loading as complete when done
          if (streamData.done) {
            setIsLoading(false);
          }
        }
      }
    }
  }, [lastMessage, chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !isConnected || isLoading) return;

    // Add user message to the chat
    const newMessage: Message = {
      content: inputValue,
      role: 'user',
      msgNum: messages.length + 1
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    // Prepare chat request
    // First, create a new array with all existing messages plus the new one
    const allMessages = [...messages, newMessage];

    const chatRequest = {
      type: 'chat_request',
      content: {
        messages: allMessages,  // Include the full messages array
        message: inputValue,    // Keep this for backward compatibility
        chatId: chatId,
        options: {
          qualityProfile: qualityProfile,
          temperature: 0.7,
          maxTokens: 1000,
          disableStreaming: false
        }
      }
    };

    // Send message to WebSocket
    sendMessage(chatRequest);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Quillium Chat Test</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-2">Quality:</span>
              <select
                value={qualityProfile}
                onChange={(e) => setQualityProfile(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1"
              >
                <option value="speed">Speed</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut || isDeletingAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Chat Container */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Chat Area */}
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto max-h-[60vh]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400">Start a conversation by sending a message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                            : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                      >
                        <div className="flex items-center mb-1">
                          <span className="font-semibold">
                            {msg.role === 'user' ? 'You' : 'Assistant'} (#{msg.msgNum})
                          </span>
                        </div>
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.content }}></div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={2}
                  disabled={isLoading || !isConnected}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim() || !isConnected}
                  className="ml-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar for Sources and Related Questions */}
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
                      onClick={() => {
                        setInputValue(question);
                      }}
                      className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition duration-200 text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
