import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    OPEN:        'bg-green-100 text-green-800',
    BIDDING:     'bg-amber-100 text-amber-800',
    ACCEPTED:    'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED:   'bg-emerald-100 text-emerald-800',
    CANCELLED:   'bg-red-100 text-red-800',
    EXPIRED:     'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function stars(rating: number) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}
