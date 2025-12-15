import { useState, useEffect } from "react"
import {
  Page,
  Block,
  List,
  ListInput,
  Button,
  BlockFooter
} from "konsta/react"

import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  getGoogleRedirectResult
} from "../firebase/auth"

import { getFirebaseErrorMessage } from "../firebase/firebaseErrors"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const handleRedirect = async () => {
      const googleUser = await getGoogleRedirectResult()
      if (googleUser) {
        setUser(googleUser)
        console.log("Logged in via Google:", googleUser)
      }
    }
    handleRedirect()
  }, [])

  const handleEmailAuth = async () => {
    setLoading(true)
    setError(null)

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <Block strongIos className="p-6 rounded-2xl text-center">
          <h1 className="text-xl">Welcome, {user.email}</h1>
        </Block>
      </Page>
    )
  }

  return (
    <Page className="flex flex-col justify-center min-h-screen px-2">
      <Block strongIos className="mx-auto rounded-2xl p-6 w-full max-w-xs md:max-w-md mb-0">
        <h1 className="text-2xl text-center mb-4">{isLogin ? "Login" : "Sign Up"}</h1>
        <List>
          <ListInput
            label="Email"
            type="email"
            placeholder="Enter email"
            value={email}
            onInput={(e) => setEmail(e.target.value)}
          />
          <ListInput
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
          />
          {!isLogin && (
            <ListInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.target.value)}
            />
          )}
        </List>

        {error && <BlockFooter className="text-red-500">{error}</BlockFooter>}

        <Button
          roundedIos
          large
          className="mt-4"
          disabled={loading}
          onClick={handleEmailAuth}
        >
          {isLogin ? "Login" : "Create Account"}
        </Button>

        <Button
          roundedIos
          large
          outline
          className="mt-2"
          onClick={signInWithGoogle}
        >
          Continue with Google
        </Button>
      </Block>

      <BlockFooter className="mx-auto max-w-xs md:max-w-md mt-4 text-center">
        {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
        <span
          className="text-primary cursor-pointer ml-1"
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
            setPassword("")
            setConfirmPassword("")
          }}
        >
          {isLogin ? "Sign up" : "Login"}
        </span>
      </BlockFooter>
    </Page>
  )
}
