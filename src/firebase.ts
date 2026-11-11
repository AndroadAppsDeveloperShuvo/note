import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SalesSession, DariEntry } from './types/poultry';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test Firestore Connection
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firebase is offline or checking connection.');
    }
  }
}

// Error Handling Helper per Skill guidelines
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Sync Sessions with Firestore Real-time
export function subscribeSessions(
  onUpdate: (sessions: SalesSession[]) => void
) {
  const sessionsRef = collection(db, 'sessions');

  return onSnapshot(
    sessionsRef,
    async (snapshot) => {
      const sessionsList: SalesSession[] = [];

      for (const sessionDoc of snapshot.docs) {
        const data = sessionDoc.data() as SalesSession;
        // Fetch sub-collection entries for each session
        const entriesRef = collection(db, 'sessions', sessionDoc.id, 'entries');

        try {
          const entriesSnap = await getDocs(entriesRef);
          const entries: DariEntry[] = entriesSnap.docs.map(
            (d) => d.data() as DariEntry
          );
          // Sort entries by timestamp
          entries.sort((a, b) => a.timestamp - b.timestamp);

          sessionsList.push({
            ...data,
            entries,
          });
        } catch (e) {
          sessionsList.push({
            ...data,
            entries: data.entries || [],
          });
        }
      }

      // Sort sessions by createdAt descending
      sessionsList.sort((a, b) => b.createdAt - a.createdAt);
      if (sessionsList.length > 0) {
        onUpdate(sessionsList);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sessions');
    }
  );
}

// Save or Update Session in Firestore
export async function saveSessionToFirestore(session: SalesSession) {
  const path = `sessions/${session.id}`;
  try {
    const sessionDocRef = doc(db, 'sessions', session.id);
    const { entries, ...sessionMeta } = session;

    // Save session metadata
    await setDoc(sessionDocRef, sessionMeta, { merge: true });

    // Save each entry to subcollection
    for (const entry of entries) {
      const entryRef = doc(db, 'sessions', session.id, 'entries', entry.id);
      await setDoc(entryRef, entry, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Entry from Firestore
export async function deleteEntryFromFirestore(sessionId: string, entryId: string) {
  const path = `sessions/${sessionId}/entries/${entryId}`;
  try {
    const entryRef = doc(db, 'sessions', sessionId, 'entries', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Delete Session from Firestore
export async function deleteSessionFromFirestore(sessionId: string) {
  const path = `sessions/${sessionId}`;
  try {
    const sessionDocRef = doc(db, 'sessions', sessionId);
    await deleteDoc(sessionDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
