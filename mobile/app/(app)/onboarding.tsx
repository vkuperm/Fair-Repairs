import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Button, Card, ErrorText, Field, Heading, Screen, Subtle, colors } from '../../components/ui'
import { useApi } from '../../lib/api'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const api = useApi()

  const [role, setRole] = useState<'CUSTOMER' | 'SHOP'>('CUSTOMER')
  const [name, setName] = useState(user?.fullName ?? '')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      await api.post('/onboarding', { role, name, phone: phone || undefined })
      // Refresh Clerk session so publicMetadata.role is current, then route by role.
      await user?.reload()
      router.replace(role === 'SHOP' ? '/shop' : '/customer')
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <Text style={{ fontSize: 40 }}>👋</Text>
        <Heading>Welcome to Fair-Repairs!</Heading>
        <Subtle>Tell us a bit about yourself to get started.</Subtle>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 }}>
          {(['CUSTOMER', 'SHOP'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 9,
                alignItems: 'center',
                backgroundColor: role === r ? '#fff' : 'transparent',
              }}
            >
              <Text style={{ fontWeight: '700', color: role === r ? colors.primary : colors.muted }}>
                {r === 'CUSTOMER' ? '🚗 Car Owner' : '🔧 Repair Shop'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ErrorText>{error}</ErrorText>
        <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="(555) 555-5555"
        />
        <Button
          title={`Continue as ${role === 'SHOP' ? 'Repair Shop' : 'Car Owner'}`}
          onPress={submit}
          loading={loading}
          disabled={!name.trim()}
        />
      </Card>
    </Screen>
  )
}
