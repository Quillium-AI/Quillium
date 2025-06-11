import { fetchApi } from './apiClient';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ChatSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface ChatData {
  id: string;
  title: string;
  messages: ChatMessage[];
  sources?: ChatSource[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches all chats for the current user
 */
export async function fetchUserChats(): Promise<ChatData[]> {
  try {
    const response = await fetchApi('/api/user/chats');
    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }
    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
}

/**
 * Fetches a specific chat by ID
 */
export async function fetchChatById(chatId: string): Promise<ChatData | null> {
  try {
    // For getting a specific chat, we still need to use the websocket connection
    // The backend doesn't have a REST endpoint for getting a single chat by ID
    // This would be handled by the WebSocket interface
    const response = await fetchApi(`/api/user/chat/${chatId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chat: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching chat ${chatId}:`, error);
    return null;
  }
}

/**
 * Deletes a chat by ID
 */
export async function deleteChat(chatId: string): Promise<boolean> {
  try {
    const response = await fetchApi('/api/user/chat/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId }),
    });
    return response.ok;
  } catch (error) {
    console.error(`Error deleting chat ${chatId}:`, error);
    return false;
  }
}

/**
 * Creates a new chat
 */
export async function createChat(title: string, firstMessage: string): Promise<ChatData | null> {
  try {
    const response = await fetchApi('/api/user/chat/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        firstMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating chat:', error);
    return null;
  }
}

/**
 * Updates the title of a chat
 */
export async function updateChatTitle(chatId: string, title: string): Promise<boolean> {
  try {
    // Since there's no specific endpoint for updating title in routes.go,
    // this would likely be handled by the WebSocket interface or a custom endpoint
    const response = await fetchApi(`/api/user/chat/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, title }),
    });
    return response.ok;
  } catch (error) {
    console.error(`Error updating chat ${chatId} title:`, error);
    return false;
  }
}

/**
 * Formats a timestamp into a readable relative time string
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
