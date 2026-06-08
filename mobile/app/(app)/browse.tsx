import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Card, Heading, Screen, Subtle, colors } from '../../components/ui'
import { useApi } from '../../lib/api'

type OpenJob = {
  id: string
  title: string
  carYear: number
  carMake: string
  carModel: string
  category: string
  city: string
  state: string
  customer: { name: string }
  bids: { id: string }[]
}

export default function Browse() {
  const api = useApi()
  const router = useRouter()
  const [jobs, setJobs] = useState<OpenJob[] | null>(null)

  useFocusEffect(
    useCallback(() => {
      api.get<OpenJob[]>('/jobs/open').then(setJobs).catch(() => setJobs([]))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  return (
    <Screen>
      <Heading>Browse Open Jobs</Heading>
      <Subtle>Find repair jobs and place competitive bids.</Subtle>

      {!jobs ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : jobs.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Subtle>No open jobs right now. Check back soon!</Subtle>
        </Card>
      ) : (
        jobs.map((job) => (
          <Pressable key={job.id} onPress={() => router.push(`/job/${job.id}`)}>
            <Card>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>{job.title}</Text>
              <Subtle>
                {job.carYear} {job.carMake} {job.carModel} · {job.category.replace('_', ' ')}
              </Subtle>
              <Subtle>{job.city}, {job.state} · {job.bids.length} bids so far</Subtle>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  )
}
