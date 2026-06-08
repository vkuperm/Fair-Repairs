import { useClerk } from '@clerk/clerk-expo'
import { Redirect, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Button, Card, Heading, Screen, Subtle, colors } from '../../components/ui'
import { useApi } from '../../lib/api'

type Shop = {
  id: string
  name: string
  rating: number
  reviewCount: number
  verified: boolean
  bids: { id: string; status: string }[]
}

export default function ShopDashboard() {
  const api = useApi()
  const { signOut } = useClerk()
  const router = useRouter()
  const [state, setState] = useState<{ loading: boolean; shop: Shop | null }>({ loading: true, shop: null })

  useFocusEffect(
    useCallback(() => {
      api
        .get<Shop | null>('/shops/me')
        .then((shop) => setState({ loading: false, shop }))
        .catch(() => setState({ loading: false, shop: null }))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  if (state.loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }
  if (!state.shop) return <Redirect href="/shop-setup" />

  const shop = state.shop
  const active = shop.bids.filter((b) => b.status === 'PENDING').length
  const accepted = shop.bids.filter((b) => b.status === 'ACCEPTED').length

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Heading>{shop.name}</Heading>
          <Subtle>
            {'★'.repeat(Math.round(shop.rating))}{'☆'.repeat(5 - Math.round(shop.rating))}  {shop.rating.toFixed(1)} ({shop.reviewCount})
          </Subtle>
        </View>
        <Pressable onPress={() => signOut()}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat label="Active Bids" value={active} />
        <Stat label="Accepted" value={accepted} />
        <Stat label="Reviews" value={shop.reviewCount} />
      </View>

      <Button title="Browse Open Jobs" onPress={() => router.push('/browse')} />
      <Button title="Edit Shop Profile" variant="outline" onPress={() => router.push('/shop-setup')} />
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>{value}</Text>
      <Subtle>{label}</Subtle>
    </Card>
  )
}
