/**
 * Server-side Firestore helper
 * Uses Admin SDK in production (with credentials) and Client SDK in development
 */

import { getAdminFirestore } from './firebaseAdmin';
import { getDb } from './firebase';
import { collection, getDocs, getDoc, doc, writeBatch } from 'firebase/firestore';

/**
 * Helper to check if we're using Admin SDK
 */
export function isUsingAdminSDK(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT;
}

/**
 * Get all documents from a collection
 */
export async function getCollectionDocs(collectionName: string) {
  if (isUsingAdminSDK()) {
    // Admin SDK
    const db = getAdminFirestore();
    const snapshot = await db.collection(collectionName).get();
    return {
      empty: snapshot.empty,
      docs: snapshot.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data(),
        exists: doc.exists,
      })),
    };
  } else {
    // Client SDK
    const db = getDb();
    const snapshot = await getDocs(collection(db, collectionName));
    return {
      empty: snapshot.empty,
      docs: snapshot.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data(),
        exists: doc.exists,
      })),
    };
  }
}

/**
 * Get a single document
 */
export async function getDocument(collectionName: string, docId: string) {
  if (isUsingAdminSDK()) {
    // Admin SDK
    const db = getAdminFirestore();
    const docSnap = await db.collection(collectionName).doc(docId).get();
    return {
      exists: docSnap.exists,
      id: docSnap.id,
      data: () => docSnap.data(),
    };
  } else {
    // Client SDK
    const db = getDb();
    const docSnap = await getDoc(doc(db, collectionName, docId));
    return {
      exists: docSnap.exists(),
      id: docSnap.id,
      data: () => docSnap.data(),
    };
  }
}

/**
 * Set multiple documents in a batch
 */
export async function batchSetDocuments(
  collectionName: string,
  documents: Array<{ id: string; data: any }>
) {
  if (isUsingAdminSDK()) {
    // Admin SDK
    const db = getAdminFirestore();
    const batch = db.batch();
    for (const { id, data } of documents) {
      batch.set(db.collection(collectionName).doc(id), data);
    }
    await batch.commit();
  } else {
    // Client SDK
    const db = getDb();
    const batch = writeBatch(db);
    for (const { id, data } of documents) {
      batch.set(doc(db, collectionName, id), data);
    }
    await batch.commit();
  }
}

/**
 * Add a new document to a collection (auto-generates ID)
 */
export async function addDocument(collectionName: string, data: any): Promise<string> {
  if (isUsingAdminSDK()) {
    // Admin SDK
    const db = getAdminFirestore();
    const docRef = await db.collection(collectionName).add(data);
    return docRef.id;
  } else {
    // Client SDK
    const db = getDb();
    const { addDoc, collection } = await import('firebase/firestore');
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: any
): Promise<void> {
  if (isUsingAdminSDK()) {
    // Admin SDK
    const db = getAdminFirestore();
    await db.collection(collectionName).doc(docId).update(data);
  } else {
    // Client SDK
    const db = getDb();
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, collectionName, docId), data);
  }
}

/**
 * Query documents with where clauses
 */
export async function queryDocuments(
  collectionName: string,
  whereConditions: Array<{ field: string; operator: any; value: any }>,
  limitCount?: number
) {
  if (isUsingAdminSDK()) {
    // Admin SDK
    const db = getAdminFirestore();
    let query: any = db.collection(collectionName);

    for (const condition of whereConditions) {
      query = query.where(condition.field, condition.operator, condition.value);
    }

    if (limitCount) {
      query = query.limit(limitCount);
    }

    const snapshot = await query.get();
    return {
      empty: snapshot.empty,
      docs: snapshot.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data(),
        exists: doc.exists,
      })),
    };
  } else {
    // Client SDK
    const db = getDb();
    const { query, collection, where, limit, getDocs } = await import('firebase/firestore');

    const constraints: any[] = whereConditions.map(c =>
      where(c.field, c.operator, c.value)
    );

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return {
      empty: snapshot.empty,
      docs: snapshot.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data(),
        exists: doc.exists,
      })),
    };
  }
}