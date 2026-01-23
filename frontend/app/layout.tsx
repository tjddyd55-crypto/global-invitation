import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/src/components/ClientLayout'

export const metadata: Metadata = {
  title: 'Global Invitation',
  description: 'Create and share digital invitations for weddings, events, and special occasions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
