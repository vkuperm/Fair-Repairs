import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button, Card, ErrorText, Field, Heading, Screen, Subtle } from '../../components/ui'
import { useApi } from '../../lib/api'

export default function ShopSetup() {
  const api = useApi()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', address: '', city: '', state: '', zipCode: '', phone: '' })
  const [existing, setExisting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/shops/me').then((shop) => {
      if (shop) {
        setExisting(true)
        setForm({
          name: shop.name ?? '', description: shop.description ?? '', address: shop.address ?? '',
          city: shop.city ?? '', state: shop.state ?? '', zipCode: shop.zipCode ?? '', phone: shop.phone ?? '',
        })
      }
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      if (existing) await api.put('/shops', form)
      else await api.post('/shops', form)
      router.replace('/shop')
    } catch (e: any) {
      setError(e?.message ?? 'Could not save shop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Heading>{existing ? 'Edit Shop Profile' : 'Set Up Your Shop'}</Heading>
      <Subtle>Complete your profile to start receiving job requests.</Subtle>
      <Card>
        <ErrorText>{error}</ErrorText>
        <Field label="Shop Name" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
        <Field label="About (optional)" value={form.description} onChangeText={set('description')} multiline />
        <Field label="Street Address" value={form.address} onChangeText={set('address')} autoCapitalize="words" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}><Field label="City" value={form.city} onChangeText={set('city')} autoCapitalize="words" /></View>
          <View style={{ flex: 1 }}><Field label="State" value={form.state} onChangeText={set('state')} autoCapitalize="characters" maxLength={2} /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="ZIP" value={form.zipCode} onChangeText={set('zipCode')} keyboardType="number-pad" /></View>
          <View style={{ flex: 2 }}><Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" /></View>
        </View>
        <Button title={existing ? 'Save Changes' : '🚀 Launch My Shop'} onPress={submit} loading={loading} />
      </Card>
    </Screen>
  )
}
