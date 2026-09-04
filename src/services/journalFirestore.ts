import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { JournalEntry } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips all undefined properties recursively before passing data to Firestore SDK.
 */
export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Save a new journal entry to the user's isolated Firestore subcollection:
 * users/{uid}/journalEntries/{entryId}
 */
export async function saveJournalEntry(
  uid: string,
  entry: Omit<JournalEntry, 'id'>
): Promise<string> {
  if (!uid) {
    throw new Error('User UID is required to save journal entry.');
  }

  const path = `users/${uid}/journalEntries`;
  const userEntriesRef = collection(db, 'users', uid, 'journalEntries');
  const now = new Date().toISOString();

  // Strict undefined stripping to avoid Firestore serialization errors
  const sanitizedData = sanitizeForFirestore({
    ...entry,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  });

  try {
    const docRef = await addDoc(userEntriesRef, sanitizedData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Retrieve all journal entries for the authenticated user, ordered by creation date descending
 */
export async function getUserJournalEntries(uid: string): Promise<JournalEntry[]> {
  if (!uid) {
    throw new Error('User UID is required to fetch journal entries.');
  }

  const path = `users/${uid}/journalEntries`;
  const userEntriesRef = collection(db, 'users', uid, 'journalEntries');
  
  try {
    const q = query(userEntriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<JournalEntry, 'id'>),
    }));
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : '';
    // If it's a permission error, escalate immediately through handleFirestoreError
    if (errMsg.includes('permission') || errMsg.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.LIST, path);
    }

    // If composite index is missing or building, fall back to unindexed query then sort in memory
    console.warn('[Firestore] Falling back to client-side sort if index unavailable:', err);
    try {
      const snapshot = await getDocs(userEntriesRef);
      const entries = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<JournalEntry, 'id'>),
      }));
      return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, path);
    }
  }
}

/**
 * Get a specific journal entry by ID for the authenticated user
 */
export async function getJournalEntryById(
  uid: string,
  entryId: string
): Promise<JournalEntry | null> {
  if (!uid || !entryId) {
    return null;
  }

  const path = `users/${uid}/journalEntries/${entryId}`;
  const docRef = doc(db, 'users', uid, 'journalEntries', entryId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...(docSnap.data() as Omit<JournalEntry, 'id'>),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Delete a user's journal entry
 */
export async function deleteJournalEntry(uid: string, entryId: string): Promise<void> {
  if (!uid || !entryId) {
    throw new Error('Invalid UID or entry ID for deletion.');
  }

  const path = `users/${uid}/journalEntries/${entryId}`;
  const docRef = doc(db, 'users', uid, 'journalEntries', entryId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Update the title of a journal entry
 */
export async function updateJournalEntryTitle(
  uid: string,
  entryId: string,
  title: string
): Promise<void> {
  if (!uid || !entryId) {
    throw new Error('Invalid UID or entry ID.');
  }

  const path = `users/${uid}/journalEntries/${entryId}`;
  const docRef = doc(db, 'users', uid, 'journalEntries', entryId);

  try {
    await updateDoc(docRef, {
      title,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
