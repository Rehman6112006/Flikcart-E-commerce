
import type { Metadata } from 'next'
import './globals.css'
import { ClientLayout } from './ClientLayout'

export const metadata: Metadata = {
  title: 'FlikCart - Best Deals Online',
  description: 'Shop Smart, Live Better - Your one-stop shop for premium products at amazing prices',
}

// System font stack matching Inter's clean sans-serif look
const interClassName = 'font-sans'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><rect x='5' y='5' width='50' height='50' rx='12' fill='%232563EB'/><path d='M15 20 L18 20 L20 35 L40 35 L42 25 L22 25' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/><circle cx='24' cy='42' r='3' fill='white'/><circle cx='38' cy='42' r='3' fill='white'/></svg>" />
      </head>
      <body className={interClassName}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}


