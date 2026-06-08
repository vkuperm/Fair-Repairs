import Constants from 'expo-constants'
import { Platform } from 'react-native'

const extra = (Constants.expoConfig?.extra ?? {}) as {
  clerkPublishableKey?: string
  apiUrl?: string
}

export const CLERK_PUBLISHABLE_KEY = extra.clerkPublishableKey ?? ''

/**
 * Base URL for the Hono API.
 * - On a physical device / Android emulator, `localhost` points at the device
 *   itself, not your dev machine. In dev we rewrite it to the Metro host's LAN
 *   IP so the device can reach the API running on your computer.
 * - In production this should be your deployed API URL (set via app config).
 */
function resolveApiUrl(): string {
  const configured = extra.apiUrl ?? 'http://localhost:4000'

  if (__DEV__ && configured.includes('localhost')) {
    // hostUri looks like "192.168.1.20:8081" — borrow the LAN IP from Metro.
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost
    const lanIp = hostUri?.split(':')[0]
    if (lanIp && lanIp !== 'localhost') {
      return configured.replace('localhost', lanIp)
    }
    // Android emulator reaches the host machine via 10.0.2.2
    if (Platform.OS === 'android') return configured.replace('localhost', '10.0.2.2')
  }
  return configured
}

export const API_URL = resolveApiUrl()
