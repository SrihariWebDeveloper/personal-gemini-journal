import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Support runtime environment variable override for public client config
const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || 'AIzaSyCQNrw7zIkhU7b0_XrIi9F9rqV9KUkB0bI',
};

// Initialize Firebase client app singleton
const app = !getApps().length ? initializeApp(resolvedFirebaseConfig) : getApp();

// Firebase Auth client
export const auth = getAuth(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cloud Firestore client with the provisioned database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate Connection to Firestore on initial boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export default app;
