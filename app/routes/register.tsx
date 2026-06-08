import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'

export const Route = createFileRoute('/register')({ component: Register })

function Register() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <SignUp routing="hash" signInUrl="/login" forceRedirectUrl="/onboarding" />
    </div>
  )
}
