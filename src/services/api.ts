import { auth } from '../firebase/config';
import { JournalAnalysis } from '../types';

export interface ChatResponse {
  role: 'model';
  content: string;
  timestamp: string;
}

export interface AnalyzeResponse {
  analysis: JournalAnalysis;
  timestamp: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated. Please sign in to continue.');
  }

  const token = await currentUser.getIdToken();
  if (!token) {
    throw new Error('Failed to retrieve Firebase authentication token.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Send messages to secure backend for multi-turn conversation with Gemini
 */
export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'model'; content: string }>
): Promise<ChatResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/journal/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send completed conversation to secure backend for structured Gemini analysis
 */
export async function analyzeSession(
  messages: Array<{ role: 'user' | 'model'; content: string }>
): Promise<AnalyzeResponse> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/journal/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Analysis request failed' }));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}
