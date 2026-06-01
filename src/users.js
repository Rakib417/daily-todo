import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

// Profile doc: users/{uid} = { email, displayName, notify, tz, updatedAt }
// The scheduled email function reads these to know who to email and where.

export async function ensureProfile(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName || '',
      notify: true,
      tz,
      updatedAt: Date.now(),
    })
    return { notify: true }
  }
  // Keep email/tz fresh in case they changed.
  await updateDoc(ref, { email: user.email, tz, updatedAt: Date.now() })
  return snap.data()
}

export function setNotify(uid, notify) {
  return updateDoc(doc(db, 'users', uid), { notify, updatedAt: Date.now() })
}
