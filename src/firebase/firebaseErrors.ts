// src/firebase/firebaseErrors.ts
export const firebaseErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "This email is already registered.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password. Try again.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/popup-closed-by-user": "The popup was closed before completing sign-in.",

}

export function getFirebaseErrorMessage(code: string): string {
  return firebaseErrorMessages[code] || "An unexpected error occurred."
}
