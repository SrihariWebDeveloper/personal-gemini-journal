export interface JournalMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalAnalysis {
  summary: string;
  mood: string;
  topics: string[];
  insights: string[];
  nextAction: string;
}

export interface JournalEntry {
  id?: string;
  title: string;
  messages: JournalMessage[];
  summary: string;
  mood: string;
  topics: string[];
  insights: string[];
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
