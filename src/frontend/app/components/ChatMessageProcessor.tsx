"use client";

import { useEffect, useCallback } from 'react';

import { Message, Source } from './ChatInterface';

interface ChatResponseMessage {
  content: string;
  msgNum: number;
}

interface ChatResponse {
  message?: ChatResponseMessage;
  sources?: Source[];

  chatId?: string;
}

interface ChatStreamData {
  content: string;
  msgNum: number;
  done: boolean;
  chatId?: string;
  sources?: Source[];

}

interface ChatMessageProcessorProps {
  lastMessage: { type: string; content: Record<string, unknown> } | null;
  chatId: string | null;
  setChatId: (chatId: string | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSources: (sources: Source[]) => void;

}

/**
 * Component that processes incoming WebSocket messages
 */
export default function ChatMessageProcessor({
  lastMessage,
  chatId,
  setChatId,
  setMessages,
  setIsLoading,
  setSources
}: ChatMessageProcessorProps) {
  /**
   * Handle a regular chat response
   */
  const handleChatResponse = useCallback((response: ChatResponse) => {
    setIsLoading(false);

    // Update messages with the assistant's response
    if (response.message && typeof response.message.content === 'string' && typeof response.message.msgNum === 'number') {
      const newMessage: Message = {
        content: response.message.content,
        role: 'assistant',
        msgNum: response.message.msgNum,
        sources: response.sources || [],

      };
      setMessages(prev => [...prev, newMessage]);
    }

    // Update sources
    if (response.sources) {
      setSources(response.sources);
    }



    // Save chat ID for future messages
    if (response.chatId && !chatId) {
      setChatId(response.chatId);
    }
  }, [setMessages, setSources, setChatId, chatId, setIsLoading]);

  /**
   * Handle a streaming chat response
   */
  const handleChatStream = useCallback((streamData: ChatStreamData) => {
    // Debug streaming timing
    console.log('Received stream data at:', new Date().toISOString(), streamData.done ? '(FINAL)' : '');

    setMessages(prev => {
      // Find the existing assistant message or create a new one
      const lastAssistantMsgIndex = prev.findLastIndex(m => m.role === 'assistant');

      if (lastAssistantMsgIndex >= 0) {
        // Update existing assistant message
        const updatedMessages = [...prev];
        const newContent = updatedMessages[lastAssistantMsgIndex].content + (streamData.content || '');


        if (streamData.done) {

        }
        
        // Update the message content
        updatedMessages[lastAssistantMsgIndex] = {
          ...updatedMessages[lastAssistantMsgIndex],
          content: newContent
        };
        
        return updatedMessages;
      } else {
        // Create a new assistant message
        return [...prev, {
          content: streamData.content || '',
          role: 'assistant' as const,
          msgNum: streamData.msgNum || 0
        }];
      }
    });

    // Update sources if available
    if (streamData.sources) {
      setSources(streamData.sources);
    }

    // Update chat ID if available
    if (streamData.chatId && !chatId) {
      setChatId(streamData.chatId);
    }

    // Mark loading as complete when done
    if (streamData.done) {
      setIsLoading(false);
    }
  }, [setMessages, setSources, setChatId, chatId, setIsLoading]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'chat_response') {
      // Handle regular chat responses
      handleChatResponse(lastMessage.content as unknown as ChatResponse);
    } else if (lastMessage.type === 'chat_stream') {
      // Handle streaming responses
      handleChatStream(lastMessage.content as unknown as ChatStreamData);
    }
  }, [lastMessage, handleChatResponse, handleChatStream]);

  return null; // This component doesn't render anything
}
