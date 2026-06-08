import * as SecureStore from 'expo-secure-store'

type TokenCache = {
  getToken: (key: string) => Promise<string | null | undefined>
  saveToken: (key: string, token: string) => Promise<void>
  clearToken?: (key: string) => void
}

/**
 * Securely persists the Clerk session token on-device so users stay signed in
 * across app restarts. Uses the iOS Keychain / Android Keystore via SecureStore.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      // ignore write errors
    }
  },
}
