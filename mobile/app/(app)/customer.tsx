import { useClerk } from '@clerk/clerk-expo'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Button, Card, Heading, Screen, Subtle, colors } from '../../components/ui'
import { useApi } from '../../lib/api'

type Job = {
  id: string
  title: string
  status: string
  carYear: number
  carMake: string
  carModel: string
  category: string
  city: string
  state: string
  bids: { id: string; amount: number }[]
}

export default function CustomerDashboard() {
  const api = useApi()
  const { signOut } = useClerk()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[] | null>(null)

  useFocusEffect(
    useCallback(() => {
      api.get<Job[]>('/jobs').then(setJobs).catch(() => setJobs([]))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Heading>My Repair Jobs</Heading>
          <Subtle>Get bids from local shops</Subtle>
        </View>
        <Pressable onPress={() => signOut()}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>

      <Button title="+ Post New Job" onPress={() => router.push('/post-job')} />

      {!jobs ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : jobs.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 40 }}>🔧</Text>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>No jobs yet</Text>
          <Subtle>Post your first repair job to get bids.</Subtle>
        </Card>
      ) : (
        jobs.map((job) => {
          const min = job.bids.length ? Math.min(...job.bids.map((b) => b.amount)) : null
          return (
            <Pressable key={job.id} onPress={() => router.push(`/job/${job.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', fontSize: 16, flex: 1 }}>{job.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{job.status.replace('_', ' ')}</Text>
                </View>
                <Subtle>
                  {job.carYear} {job.carMake} {job.carModel} · {job.category.replace('_', ' ')} · {job.city}, {job.state}
                </Subtle>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {job.bids.length} {job.bids.length === 1 ? 'bid' : 'bids'}
                  {min != null ? `  ·  from $${min.toLocaleString()}` : ''}
                </Text>
              </Card>
            </Pressable>
          )
        })
      )}
    </Screen>
  )
}
