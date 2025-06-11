"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatAPI } from '../../components/ChatAPIProvider';
import { fetchApi } from '../../utils/apiClient';
import ChatInput from './ChatInput';
import MessageList from './MessageList';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
  timestamp?: number;
}

interface Source {
  title: string;
  url: string;
  snippet?: string;
}

// Define the structure of chat stream content
interface ChatStreamContent {
  chatId?: string;
  content?: string;
  done?: boolean;
  sources?: Source[];
}

interface ChatInterfaceProps {
  initialQuery: string | null;
  chatId: string | null;
  onChatIdChange: (chatId: string) => void;
}

export default function ChatInterface({ initialQuery, chatId, onChatIdChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, lastMessage, isLoading: isSending, startEventStream } = useChatAPI();

  // Effect to start streaming for a specific chat when chatId changes
  useEffect(() => {
    if (chatId) {
      startEventStream(chatId);
    }
  }, [chatId, startEventStream]);

  // Handle sending messages with useCallback to avoid dependency issues in useEffect
  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    // Add user message to the chat
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Prepare chat API message
    const chatRequest = {
      chatId: chatId || '',
      messages: messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      options: {
        temperature: 0.7,
        maxTokens: 2000
      }
    };

    // Send via REST API
    try {
      sendMessage({
        type: 'chat_request',
        payload: chatRequest
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Error: Not connected to server',
        timestamp: Date.now()
      }]);
      setIsTyping(false);
    }
  }, [chatId, messages, sendMessage]);

  // Handle the initial query if present
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, messages.length, handleSendMessage]);

  // Handle incoming messages from the ChatAPI
  useEffect(() => {
    if (!lastMessage) return;

    try {
      if (lastMessage.type === 'chat_stream') {
        // Type assertion to properly type the content
        const content = lastMessage.payload as ChatStreamContent;

        if (content) {
          if (content.chatId && !chatId) {
            console.log("New chat created with ID:", content.chatId);
            onChatIdChange(content.chatId);
          }

          // Handle streaming response
          if (!content.done) {
            setIsTyping(true);
            setCurrentResponse(prev => prev + (content.content || ''));
          } else {
            // Message is complete
            setIsTyping(false);
            const finalMessage: ChatMessage = {
              role: 'assistant',
              content: currentResponse + (content.content || ''),
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, finalMessage]);
            setCurrentResponse('');

            // Set sources if available
            if (content.sources && content.sources.length > 0) {
              setSources(content.sources);
            }
          }
        }
      } else if (lastMessage.type === 'error') {
        console.error('Received error:', lastMessage.payload);
        setIsTyping(false);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Error: ${(lastMessage.payload as { error?: string })?.error || 'Something went wrong'}`,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }, [lastMessage, chatId, currentResponse, onChatIdChange]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentResponse]);

  // Load chat history if we have a chatId
  useEffect(() => {
    if (chatId && messages.length === 0) {
      const loadChatHistory = async () => {
        setIsLoading(true);
        try {
          const response = await fetchApi(`/api/user/chat/${chatId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.messages && Array.isArray(data.messages)) {
              setMessages(data.messages);
            }
            if (data.sources) {
              setSources(data.sources);
            }
          } else {
            console.error('Failed to load chat history');
            setMessages([{
              role: 'system',
              content: 'Failed to load chat history. Please try again or start a new chat.',
              timestamp: Date.now()
            }]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          setMessages([{
            role: 'system',
            content: 'Error loading chat history. Please try again or start a new chat.',
            timestamp: Date.now()
          }]);
        } finally {
          setIsLoading(false);
        }
      };

      loadChatHistory();
    }
  }, [chatId, messages.length]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-300">Loading chat history...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Connection status indicator */}
          {isSending && (
            <div className="bg-blue-800/30 text-blue-300 py-2 px-4 mb-2 rounded-md text-sm flex items-center space-x-2">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span>Sending message...</span>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-grow overflow-auto mb-4 pr-1">
            <MessageList
              messages={messages}
              currentResponse={currentResponse}
              isTyping={isTyping}
              sources={sources}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="mt-auto">
            <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
          </div>
        </>
      )}
    </div>
  );
}
