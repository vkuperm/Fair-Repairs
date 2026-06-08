import { useAuth } from '@clerk/clerk-expo'
import { useCallback } from 'react'
import { API_URL } from './config'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Returns a `request` function bound to the current Clerk session.
 * Every call attaches a fresh Clerk token as a Bearer header, which the
 * Hono API verifies with @clerk/backend.
 */
export function useApi() {
  const { getToken } = useAuth()

  const request = useCallback(
    async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/v1${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      })

      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`)
      }
      return data as T
    },
    [getToken],
  )

  return {
    get: <T = any>(path: string) => request<T>(path),
    post: <T = any>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T = any>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  }
}
