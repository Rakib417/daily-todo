import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

// Data model: users/{uid}/todos/{todoId}
//   { title, done, date: "YYYY-MM-DD", createdAt }
// We subscribe to the whole collection once and filter by date in the client —
// simple and plenty fast for a personal todo app, and it powers the chart too.

function todosCol(uid) {
  return collection(db, 'users', uid, 'todos')
}

export function subscribeTodos(uid, onChange, onError) {
  const q = query(todosCol(uid), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    // `serverTimestamps: 'estimate'` gives pending local writes an estimated
    // createdAt instead of null, so a freshly-added task sorts into its final
    // position immediately rather than jumping from top to bottom.
    (snap) =>
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))),
    onError,
  )
}

export function addTodo(uid, title, dateKey) {
  return addDoc(todosCol(uid), {
    title,
    date: dateKey,
    done: false,
    createdAt: serverTimestamp(),
  })
}

export function setDone(uid, id, done) {
  return updateDoc(doc(db, 'users', uid, 'todos', id), { done })
}

export function removeTodo(uid, id) {
  return deleteDoc(doc(db, 'users', uid, 'todos', id))
}
