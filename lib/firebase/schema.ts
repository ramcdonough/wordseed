/**
 * Firestore data model
 *
 * /users/{userId}/words/{wordId}         ← one document per word
 * /users/{userId}/collections/{id}       ← one document per collection
 * /users/{userId}/stats/{date}           ← daily stats keyed by YYYY-MM-DD
 *
 * Security rules (paste into Firebase Console → Firestore → Rules):
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId}/{document=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */

import { collection, doc } from 'firebase/firestore'
import { db } from './client'

export const userDoc   = (uid: string) => doc(db, 'users', uid)
export const wordsCol  = (uid: string) => collection(db, 'users', uid, 'words')
export const wordDoc   = (uid: string, id: string) => doc(db, 'users', uid, 'words', id)
export const colsCol   = (uid: string) => collection(db, 'users', uid, 'collections')
export const colDoc    = (uid: string, id: string) => doc(db, 'users', uid, 'collections', id)
export const statsCol  = (uid: string) => collection(db, 'users', uid, 'stats')
export const statDoc   = (uid: string, date: string) => doc(db, 'users', uid, 'stats', date)
