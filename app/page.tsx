"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { initializeDemoData } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Initialize demo data when app starts
    initializeDemoData()
    
    if (!isAuthenticated) {
      router.push("/login")
    } else if (user) {
      // Redirect based on role
      switch (user.role) {
        case "admin":
          router.push("/admin")
          break
        case "agent":
          router.push("/agent")
          break
        case "customer":
          router.push("/customer")
          break
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
