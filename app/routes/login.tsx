import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <SignIn routing="hash" signUpUrl="/register" fallbackRedirectUrl="/" />
    </div>
  )
}
