import type { Metadata } from "next"
import { Sora, DM_Sans } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/ThemeProvider"
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css"

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })

export const metadata: Metadata = {
  title: "SankalpHub — Production Intelligence Platform",
  description: "A unified operating platform for manufacturing quality, inspection workflows, and supply chain visibility.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${dmSans.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-YLHER20GW0" />
    </html>
  )
}
