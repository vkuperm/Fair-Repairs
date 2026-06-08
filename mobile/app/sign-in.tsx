import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, Card, ErrorText, Field, Heading, Screen, Subtle, colors } from '../components/ui'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSignIn = async () => {
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      const attempt = await signIn.create({ identifier: email, password })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.replace('/(app)')
      } else {
        setError('Additional verification required.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <Text style={{ fontSize: 40 }}>🔧</Text>
        <Heading>Welcome back</Heading>
        <Subtle>Sign in to your Fair-Repairs account</Subtle>
      </View>
      <Card>
        <ErrorText>{error}</ErrorText>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button title="Sign In" onPress={onSignIn} loading={loading} />
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        <Subtle>Don't have an account?</Subtle>
        <Link href="/sign-up" style={{ color: colors.primary, fontWeight: '700' }}>
          Sign up
        </Link>
      </View>
    </Screen>
  )
}
