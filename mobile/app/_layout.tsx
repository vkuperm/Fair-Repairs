import { ClerkProvider } from '@clerk/clerk-expo'
import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { tokenCache } from '../lib/cache'
import { CLERK_PUBLISHABLE_KEY } from '../lib/config'

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Slot />
      </SafeAreaProvider>
    </ClerkProvider>
  )
}
