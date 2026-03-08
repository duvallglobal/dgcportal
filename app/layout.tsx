import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant, Montserrat } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const cormorant = Cormorant({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'DGC Client Portal',
  description: 'Client portal for DGC.today digital services agency',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${montserrat.variable} font-sans antialiased`}>
        <ClerkProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  )
}
