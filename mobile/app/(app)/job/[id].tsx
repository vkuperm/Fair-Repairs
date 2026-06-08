import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { Button, Card, ErrorText, Field, Heading, Screen, Subtle, colors } from '../../../components/ui'
import { useApi } from '../../../lib/api'

type Bid = {
  id: string
  amount: number
  estimatedDays: number
  notes: string | null
  status: string
  shop: { id: string; name: string; rating: number; reviewCount: number; city: string }
}
type Job = {
  id: string
  title: string
  description: string
  status: string
  carYear: number
  carMake: string
  carModel: string
  category: string
  city: string
  state: string
  bids: Bid[]
}

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const api = useApi()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [role, setRole] = useState<'CUSTOMER' | 'SHOP' | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [bid, setBid] = useState({ amount: '', estimatedDays: '', notes: '' })

  const load = async () => {
    try {
      const [me, j] = await Promise.all([api.get('/me'), api.get<Job>(`/jobs/${id}`)])
      setRole(me.role)
      setJob(j)
    } catch (e: any) {
      setError(e?.message ?? 'Could not load job')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const acceptBid = async (bidId: string) => {
    setBusy(true)
    setError('')
    try {
      await api.post(`/bids/${bidId}/accept`)
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Could not accept bid')
    } finally {
      setBusy(false)
    }
  }

  const placeBid = async () => {
    setBusy(true)
    setError('')
    try {
      await api.post('/bids', {
        jobId: id,
        amount: Number(bid.amount),
        estimatedDays: Number(bid.estimatedDays),
        notes: bid.notes || undefined,
      })
      router.replace('/browse')
    } catch (e: any) {
      setError(e?.message ?? 'Could not place bid')
    } finally {
      setBusy(false)
    }
  }

  if (error && !job) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
        <Button title="Back" variant="outline" onPress={() => router.back()} />
      </Screen>
    )
  }
  if (!job) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <Screen>
      <Heading>{job.title}</Heading>
      <Subtle>
        {job.carYear} {job.carMake} {job.carModel} · {job.category.replace('_', ' ')} · {job.city}, {job.state}
      </Subtle>
      <Card>
        <Text style={{ color: colors.text }}>{job.description}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>Status: {job.status.replace('_', ' ')}</Text>
      </Card>

      <ErrorText>{error}</ErrorText>

      {role === 'SHOP' ? (
        <Card>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>Place your bid</Text>
          <Field label="Amount ($)" value={bid.amount} onChangeText={(v) => setBid((b) => ({ ...b, amount: v }))} keyboardType="number-pad" />
          <Field label="Estimated days" value={bid.estimatedDays} onChangeText={(v) => setBid((b) => ({ ...b, estimatedDays: v }))} keyboardType="number-pad" />
          <Field label="Notes (optional)" value={bid.notes} onChangeText={(v) => setBid((b) => ({ ...b, notes: v }))} multiline />
          <Button title="Submit Bid" onPress={placeBid} loading={busy} />
        </Card>
      ) : (
        <>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>Bids ({job.bids.length})</Text>
          {job.bids.length === 0 ? (
            <Subtle>No bids yet. Shops will respond soon.</Subtle>
          ) : (
            job.bids.map((b) => (
              <Card key={b.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700' }}>{b.shop.name}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800' }}>${b.amount.toLocaleString()}</Text>
                </View>
                <Subtle>
                  {'★'.repeat(Math.round(b.shop.rating))}{'☆'.repeat(5 - Math.round(b.shop.rating))} ({b.shop.reviewCount}) · {b.estimatedDays} days · {b.shop.city}
                </Subtle>
                {b.notes ? <Text style={{ color: colors.text }}>{b.notes}</Text> : null}
                {b.status === 'ACCEPTED' ? (
                  <Text style={{ color: colors.success, fontWeight: '700' }}>✓ Accepted</Text>
                ) : job.status === 'BIDDING' ? (
                  <Button title="Accept Bid" onPress={() => acceptBid(b.id)} loading={busy} />
                ) : null}
              </Card>
            ))
          )}
        </>
      )}

      <Button title="Back" variant="outline" onPress={() => router.back()} />
    </Screen>
  )
}
