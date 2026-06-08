import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import Navbar from '~/components/Navbar'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Fair-Repairs — Find the best repair deal' },
      { name: 'description', content: 'Post your car repair job free. Get bids from local shops. Save up to 40%.' },
    ],
    links: [{ rel: 'stylesheet', href: '/app.css' }],
  }),
  component: RootComponent,
})

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-[Inter,sans-serif]">
        {/* ClerkProvider must live inside <body>, not wrap <html>, or TanStack Start
            can't inject the client entry <Scripts/> and the app never hydrates. */}
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <Navbar />
          <Outlet />
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
