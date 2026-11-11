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
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firebase connection check offline.');
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
        const entriesRef = collection(db, 'sessions', sessionDoc.id, 'entries');

        try {
          const entriesSnap = await getDocs(entriesRef);
          const entries: DariEntry[] = entriesSnap.docs.map(
            (d) => d.data() as DariEntry
          );
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

// Ultra-fast non-blocking single entry write to Firestore
export function saveSingleEntryToFirestore(sessionId: string, entry: DariEntry) {
  const entryRef = doc(db, 'sessions', sessionId, 'entries', entry.id);
  setDoc(entryRef, entry, { merge: true }).catch((error) => {
    handleFirestoreError(error, OperationType.WRITE, `sessions/${sessionId}/entries/${entry.id}`);
  });
}

// Save Session Metadata asynchronously
export function saveSessionMetaToFirestore(session: SalesSession) {
  const sessionDocRef = doc(db, 'sessions', session.id);
  const { entries, ...sessionMeta } = session;
  setDoc(sessionDocRef, sessionMeta, { merge: true }).catch((error) => {
    handleFirestoreError(error, OperationType.WRITE, `sessions/${session.id}`);
  });
}

// Delete Entry from Firestore
export function deleteEntryFromFirestore(sessionId: string, entryId: string) {
  const entryRef = doc(db, 'sessions', sessionId, 'entries', entryId);
  deleteDoc(entryRef).catch((error) => {
    handleFirestoreError(error, OperationType.DELETE, `sessions/${sessionId}/entries/${entryId}`);
  });
}

// Delete Session from Firestore
export function deleteSessionFromFirestore(sessionId: string) {
  const sessionDocRef = doc(db, 'sessions', sessionId);
  deleteDoc(sessionDocRef).catch((error) => {
    handleFirestoreError(error, OperationType.DELETE, `sessions/${sessionId}`);
  });
}
