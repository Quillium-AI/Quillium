# Chat Interface Implementation Guide

## Overview

This document provides step-by-step instructions for implementing a Perplexity-like chat interface in the Quillium frontend. The implementation will integrate with the existing WebSocket handlers and REST API endpoints to create a modern, animated chat experience with markdown-rendered AI responses and clickable source references.

## UI Reference Screenshots

Refer to these screenshots for UI implementation guidance:

1. **Initial Search Screen**: `Screenshot 2025-06-02 102329.png` - Shows the centered search interface with quality profile selector
2. **Chat Interface Overview**: `Screenshot 2025-06-02 102510.png` - Shows the overall chat layout with sidebar and sources
3. **Sources Display**: `Screenshot 2025-06-02 102616.png` - Shows how sources are displayed below the title
4. **Source Hover**: `Screenshot 2025-06-02 102649.png` - Shows tooltip display when hovering over a source reference
5. **Streaming Response**: `Screenshot 2025-06-02 102657.png` - Shows how the AI response streams in
6. **Minimized Title**: `Screenshot 2025-06-02 102755.png` - Shows how the title minimizes on scroll
7. **Source Button**: `Screenshot 2025-06-02 102800.png` - Shows the source reference button styling
8. **Multiple Messages**: `Screenshot 2025-06-02 102842.png` - Shows multiple message exchanges in the chat
9. **Code Block Rendering**: `Screenshot 2025-06-02 103142.png` - Shows syntax highlighting in code blocks
10. **Quality Profile Selection**: `Screenshot 2025-06-02 103149.png` - Shows the quality profile selector dropdown

## Frontend Architecture

The chat interface will be built using the existing Next.js/React frontend and will consist of multiple focused components following the project's preference for smaller, maintainable components.

## Component Structure

### 1. ChatInterface (Main Container)
- Serves as the main container component
- Manages overall state and coordinates child components
- Handles layout transitions between centered search and active chat modes

### 2. ChatHeader
- Displays chat title
- Minimizes on scroll
- Includes logout/delete account buttons

### 3. ChatMessageProcessor
- Handles WebSocket message processing
- Manages streaming responses and updates

### 4. ChatSidebar
- Displays sources in a tab-based UI (see `Screenshot 2025-06-02 102616.png`)
- Simple, clean interface for source display with hover effects (see `Screenshot 2025-06-02 102649.png`)

### 5. MessageList
- Renders chat messages with markdown
- Handles source reference detection and formatting

### 6. ChatInput
- Provides user input area
- Includes quality profile picker
- Manages animations when transitioning from centered to docked position

### 7. LogoutDialog & DeleteAccountDialog
- Confirmation dialogs for user actions

## Implementation Instructions

**IMPORTANT**: Before implementing, carefully examine the existing frontend codebase structure to maintain consistency. Follow the existing patterns for component structure, styling, and state management. Use the existing WebSocketProvider as a foundation.

### Step 1: Create WebSocket Service

Create a dedicated WebSocket service class to manage connections, reconnection, message handling, and sending chat requests. Extend the existing WebSocketProvider.

```typescript
// app/services/WebSocketChatService.ts
import { WebSocketMessage } from '../components/WebSocketProvider';
import { useWebSocket } from '../components/WebSocketProvider';

export class WebSocketChatService {
  private sendMessageFn: (message: WebSocketMessage) => void;
  
  constructor(sendMessage: (message: WebSocketMessage) => void) {
    this.sendMessageFn = sendMessage;
  }
  
  sendChatRequest(chatId: string | null, messages: any[], options: any) {
    this.sendMessageFn({
      type: 'chat_request',
      payload: {
        chatId,
        messages,
        options
      }
    });
  }
}

export function useWebSocketChat() {
  const { sendMessage, lastMessage, isConnected } = useWebSocket();
  const chatService = new WebSocketChatService(sendMessage);
  
  return {
    chatService,
    lastMessage,
    isConnected
  };
}
```

### Step 2: Create Chat Models

Define TypeScript interfaces for chat data structures.

```typescript
// app/models/ChatTypes.ts
export interface ChatMessage {
  role: string;
  content: string;
  messageNumber: number;
}

export interface ChatSource {
  url: string;
  title: string;
  description: string;
  messageNumber: number;
  id: string;
}

export interface ChatContent {
  id: string;
  title: string;
  messages: ChatMessage[];
  sources: ChatSource[];
}

export interface QualityProfile {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}
```

### Step 3: Create Chat API Service

Implement a service for REST API interactions with chat endpoints.

```typescript
// app/services/ChatApiService.ts
import { fetchApi } from '../utils/apiClient';
import { ChatContent } from '../models/ChatTypes';

export class ChatApiService {
  async createChat(title: string): Promise<ChatContent> {
    const response = await fetchApi('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create chat');
    }
    
    return response.json();
  }
  
  async getChat(chatId: string): Promise<ChatContent> {
    const response = await fetchApi(`/api/chats/${chatId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get chat');
    }
    
    return response.json();
  }
  
  async deleteChat(chatId: string): Promise<void> {
    const response = await fetchApi(`/api/chats/${chatId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
  }
}
```

### Step 4: Create Utility Functions

#### Markdown Utility

```typescript
// app/utils/markdownUtils.ts
import React from 'react';

// Function to detect source references like [1], [2], etc. and make them clickable
export function processMarkdownWithSources(markdown: string, onSourceClick: (sourceId: number) => void) {
  // This would use regex to find source references and wrap them in custom components
  const sourcePattern = /\[(\d+)\]/g;
  
  // Replace source references with clickable elements
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = sourcePattern.exec(markdown)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(markdown.substring(lastIndex, match.index));
    }
    
    // Add the source reference as a clickable element
    const sourceNumber = parseInt(match[1]);
    parts.push(
      `<button class="source-reference" data-source-id="${sourceNumber}">[${sourceNumber}]</button>`
    );
    
    lastIndex = sourcePattern.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < markdown.length) {
    parts.push(markdown.substring(lastIndex));
  }
  
  return parts.join('');
}
```

#### Source Formatting

```typescript
// app/utils/sourceFormatting.ts
import { ChatSource } from '../models/ChatTypes';

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch (error) {
    return url;
  }
}

// Format sources for display
export function formatSources(sources: ChatSource[]): {
  domain: string;
  title: string;
  description: string;
  url: string;
  id: string;
}[] {
  return sources.map(source => ({
    domain: extractDomain(source.url),
    title: source.title,
    description: source.description,
    url: source.url,
    id: source.id
  }));
}
```

#### Question Extractor

```typescript
// app/utils/questionExtractor.ts

// You can add other utility functions here as needed
```

### Step 5: Implement Core Components

#### ChatInterface

```typescript
// app/components/chat/ChatInterface.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useWebSocketChat } from '../../services/WebSocketChatService';
import { ChatApiService } from '../../services/ChatApiService';
import { ChatContent, ChatMessage, ChatSource, QualityProfile } from '../../models/ChatTypes';
import ChatHeader from './ChatHeader';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export default function ChatInterface() {
  // State for the chat content
  const [chatContent, setChatContent] = useState<ChatContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Services
  const { chatService, lastMessage, isConnected } = useWebSocketChat();
  const chatApiService = new ChatApiService();
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'chat_stream_response') {
      const { chatId, content, done, sources } = lastMessage.payload;
      
      // Update the streaming message content
      setStreamingMessage(prev => prev + content);
      
      // When the stream is complete
      if (done) {
        
        // Update the chat content with the new message and sources
        if (chatContent) {
          setChatContent(prevContent => {
            if (!prevContent) return null;
            
            const newMessageNumber = prevContent.messages.length + 1;
            const newMessage: ChatMessage = {
              role: 'assistant',
              content: streamingMessage + content,
              messageNumber: newMessageNumber
            };
            
            return {
              ...prevContent,
              messages: [...prevContent.messages, newMessage],
              sources: sources || []
            };
          });
        }
        
        // Reset streaming state
        setStreamingMessage('');
        setIsLoading(false);
      }
    } else if (lastMessage?.type === 'error') {
      setError(lastMessage.payload.message);
      setIsLoading(false);
    }
  }, [lastMessage]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatContent?.messages, streamingMessage]);
  
  // Handle new search/query
  const handleSearch = async (query: string, profileId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new chat or use existing one
      let currentChat = chatContent;
      
      if (!currentChat) {
        // Create a new chat
        currentChat = await chatApiService.createChat(query);
        setChatContent(currentChat);
      }
      
      // Add user message to chat
      const newMessageNumber = currentChat.messages.length + 1;
      const userMessage: ChatMessage = {
        role: 'user',
        content: query,
        messageNumber: newMessageNumber
      };
      
      setChatContent(prev => {
        if (!prev) return currentChat;
        return {
          ...prev,
          messages: [...prev.messages, userMessage]
        };
      });
      
      // Show the chat interface (hide centered search)
      setShowSearch(false);
      
      // Send chat request via WebSocket
      chatService.sendChatRequest(
        currentChat.id,
        [...currentChat.messages, userMessage],
        { qualityProfile: profileId }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };
  

  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {showSearch ? (
        // Centered search view
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <ChatInput 
              onSearch={handleSearch} 
              centered={true} 
            />
          </div>
        </div>
      ) : (
        // Chat interface view
        <div className="flex-grow flex flex-col lg:flex-row">
          {/* Main chat area */}
          <div className="flex-grow flex flex-col h-screen">
            {/* Chat header with title */}
            <ChatHeader 
              title={chatContent?.title || 'New Chat'} 
            />
            
            {/* Messages list */}
            <div className="flex-grow overflow-y-auto p-4">
              <MessageList 
                messages={chatContent?.messages || []} 
                streamingMessage={isLoading ? streamingMessage : ''} 
                sources={chatContent?.sources || []} 
              />
              <div ref={messagesEndRef} />
              
              {/* Error display */}
              {error && (
                <div className="p-4 my-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  {error}
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div className="p-4 border-t border-gray-800">
              <ChatInput 
                onSearch={handleSearch} 
                centered={false} 
                isLoading={isLoading} 
              />
            </div>
          </div>
          
          {/* Sidebar with sources */}
          <ChatSidebar 
            sources={chatContent?.sources || []} 
          />
        </div>
      )}
    </div>
  );
}
```

### Step 6: Implement Remaining Components

For brevity, I'll provide high-level structure of the remaining components:

#### ChatHeader Component
- Displays the chat title
- Minimizes on scroll
- Contains user action buttons (logout, delete account)

#### MessageList Component
- Renders the list of messages with proper styling
- Uses React Markdown for rendering
- Includes custom renderer for source references

#### ChatInput Component
- Handles user input with animations
- Includes quality profile selector
- Manages transitions between centered and docked states

#### ChatSidebar Component
- Displays sources with simple tabs UI (as shown in `Screenshot 2025-06-02 102616.png`)
- Use the same styling pattern as seen in the existing Sidebar.tsx component

## Integration with Existing Code

1. **WebSocket Integration**: Extend the existing WebSocketProvider.tsx (located at `app/components/WebSocketProvider.tsx`) to handle chat-specific message types. The current implementation uses Socket.io with message type discrimination, so follow this pattern for chat messages.

2. **Component Integration**: Add the ChatInterface component to the HomePage.tsx as a conditional render, replacing the SearchBox when a chat is active. Follow the component structure in `app/components/HomePage.tsx`, maintaining the same clean UI with gradient backgrounds and blur effects.

3. **API Routes**: Create the necessary API routes in `app/api/` directory to proxy requests to the backend endpoints defined in `src/backend/internal/api/restapi/routes.go`. Follow the pattern in existing API routes, using the fetchApi utility from `app/utils/apiClient.ts`.

4. **Styling**: Use the same styling patterns as seen in existing components like SearchBox.tsx and Sidebar.tsx, using Tailwind CSS classes. Use the CSS variables `--primary` and `--secondary` for gradient effects as seen in the existing components.

## Styling Guidelines

1. Use Tailwind CSS classes consistent with the existing design system
2. Use existing color variables (--primary, --secondary)
3. Ensure all transitions are smooth with proper animations
4. Make the interface responsive for all device sizes

## Implementation Details

### Chat Animation Transitions

Implement smooth transitions between states as shown in the screenshots:

1. **Initial to Active Transition**: When user submits a query, the search box should smoothly move down from center position to the bottom of the screen (see transition from `Screenshot 2025-06-02 102329.png` to `Screenshot 2025-06-02 102510.png`)

2. **Title Minimization**: The chat title should minimize on scroll as shown in `Screenshot 2025-06-02 102755.png`, with a subtle animation

3. **Streaming Effect**: Text should stream in gradually with a typing-like effect as shown in `Screenshot 2025-06-02 102657.png`

4. **Source References**: Source references like [1] should be detected in markdown and rendered as interactive buttons (see `Screenshot 2025-06-02 102800.png`)

### Markdown Rendering

1. Use react-markdown with remark-gfm for GitHub-flavored markdown
2. Add custom renderer for source references
3. Use react-syntax-highlighter for code blocks as shown in `Screenshot 2025-06-02 103142.png`

### Testing

1. Test the WebSocket connection and message handling
2. Test the streaming response rendering
3. Verify source reference detection and clickability
4. Test responsive behavior across device sizes

## Final Steps

1. Implement proper error handling throughout the components
2. Add loading states and indicators
3. Ensure accessibility compliance
4. Add documentation for all components and services
