import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import Sidebar from "./sidebar"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mc-Connect Dashboard",
  description: "Dashboard for Mc-Connect",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          <main className="flex-1 p-5 lg:p-5 pt-16 lg:pt-8 bg-slate-50">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
  
