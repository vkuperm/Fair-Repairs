import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Button, Card, ErrorText, Field, Heading, Screen, Subtle, colors } from '../components/ui'

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [stage, setStage] = useState<'form' | 'verify'>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      await signUp.create({ emailAddress: email, password, firstName, lastName })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStage('verify')
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async () => {
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        router.replace('/(app)')
      } else {
        setError('Invalid code, please try again.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <Text style={{ fontSize: 40 }}>🔧</Text>
        <Heading>{stage === 'form' ? 'Create your account' : 'Verify your email'}</Heading>
        <Subtle>
          {stage === 'form'
            ? 'Join Fair-Repairs and start saving on auto repairs'
            : `Enter the code sent to ${email}`}
        </Subtle>
      </View>

      <Card>
        <ErrorText>{error}</ErrorText>
        {stage === 'form' ? (
          <>
            <Field label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <Field label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
            <Button title="Continue" onPress={onSubmit} loading={loading} />
          </>
        ) : (
          <>
            <Field
              label="Verification code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="123456"
            />
            <Button title="Verify & Continue" onPress={onVerify} loading={loading} />
          </>
        )}
      </Card>

      {stage === 'form' && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Subtle>Already have an account?</Subtle>
          <Link href="/sign-in" style={{ color: colors.primary, fontWeight: '700' }}>
            Sign in
          </Link>
        </View>
      )}
    </Screen>
  )
}
