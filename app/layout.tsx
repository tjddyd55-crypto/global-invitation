import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
