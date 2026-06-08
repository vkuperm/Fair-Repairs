import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { Button, colors } from '../components/ui'
import { useApi } from '../lib/api'

type MeResponse = { onboarded: boolean; role: 'CUSTOMER' | 'SHOP' | null }

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()
  const api = useApi()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      setMe(await api.get<MeResponse>('/me'))
    } catch (e: any) {
      setError(e?.message ?? 'Could not reach the server')
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  // Still booting Clerk
  if (!isLoaded) return <Spinner />
  // Not signed in → auth flow
  if (!isSignedIn) return <Redirect href="/sign-in" />

  // Signed in → resolve onboarding/role from the API
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40 }}>📡</Text>
        <Text style={{ color: colors.danger, textAlign: 'center', fontSize: 16 }}>{error}</Text>
        <Button title="Retry" onPress={load} variant="outline" />
      </View>
    )
  }
  if (!me) return <Spinner />
  if (!me.onboarded) return <Redirect href="/onboarding" />
  if (me.role === 'SHOP') return <Redirect href="/shop" />
  return <Redirect href="/customer" />
}

function Spinner() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )
}

const styles = {
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24, gap: 16 } as const,
}
