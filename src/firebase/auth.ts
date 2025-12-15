import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth"

import type { User } from "firebase/auth"

import { auth, googleProvider } from "./firebase"

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const signInWithGoogle = () =>
  signInWithRedirect(auth, googleProvider)

export const getGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth)
    return result?.user || null
  } catch (err) {
    console.error("Google redirect error:", err)
    return null
  }
}

export const logout = () =>
  signOut(auth)

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) =>
  onAuthStateChanged(auth, callback)
