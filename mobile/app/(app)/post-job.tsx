import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Button, Card, ErrorText, Field, Heading, Screen, Subtle, colors } from '../../components/ui'
import { useApi } from '../../lib/api'

const CATEGORIES = ['ENGINE','TRANSMISSION','BRAKES','SUSPENSION','ELECTRICAL','AC_HEATING','EXHAUST','TIRES','BODY_PAINT','OIL_CHANGE','DIAGNOSTICS','OTHER'] as const

export default function PostJob() {
  const api = useApi()
  const router = useRouter()
  const [form, setForm] = useState({ title: '', description: '', carMake: '', carModel: '', carYear: '', zipCode: '', city: '', state: '' })
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('ENGINE')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      await api.post('/jobs', {
        ...form,
        carYear: Number(form.carYear),
        category,
      })
      router.replace('/customer')
    } catch (e: any) {
      setError(e?.message ?? 'Could not post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Heading>Post a Repair Job</Heading>
      <Subtle>Describe your issue and get competitive bids.</Subtle>
      <Card>
        <ErrorText>{error}</ErrorText>
        <Field label="Title" value={form.title} onChangeText={set('title')} placeholder="e.g. Brakes squealing badly" />
        <Field label="Description" value={form.description} onChangeText={set('description')} multiline placeholder="Describe the problem…" />

        <Text style={{ fontWeight: '600', color: colors.text }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: category === c ? colors.primary : '#f1f5f9',
              }}
            >
              <Text style={{ color: category === c ? '#fff' : colors.muted, fontWeight: '600', fontSize: 13 }}>
                {c.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Make" value={form.carMake} onChangeText={set('carMake')} autoCapitalize="words" /></View>
          <View style={{ flex: 1 }}><Field label="Model" value={form.carModel} onChangeText={set('carModel')} autoCapitalize="words" /></View>
          <View style={{ flex: 1 }}><Field label="Year" value={form.carYear} onChangeText={set('carYear')} keyboardType="number-pad" maxLength={4} /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}><Field label="City" value={form.city} onChangeText={set('city')} autoCapitalize="words" /></View>
          <View style={{ flex: 1 }}><Field label="State" value={form.state} onChangeText={set('state')} autoCapitalize="characters" maxLength={2} /></View>
          <View style={{ flex: 1 }}><Field label="ZIP" value={form.zipCode} onChangeText={set('zipCode')} keyboardType="number-pad" /></View>
        </View>

        <Button title="Post Job" onPress={submit} loading={loading} />
      </Card>
    </Screen>
  )
}
