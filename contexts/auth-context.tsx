"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { STORAGE_KEYS } from "@/lib/auth"
import { normalizePhoneNumber } from "@/lib/phone-utils"

export type UserRole = "admin" | "agent" | "customer"

export interface User {
  id: string
  phone: string
  name: string
  role: UserRole
  createdAt: string
  password?: string
  isActive?: boolean
}

interface AuthContextType {
  user: User | null
  login: (phone: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for testing
const DEMO_USERS: User[] = [
  {
    id: "admin-1",
    phone: "09127831399",
    name: "مدیر سیستم",
    role: "admin",
    createdAt: new Date().toISOString(),
    password: "refah1361",
    isActive: true,
  },
  {
    id: "agent-1",
    phone: "0987654321",
    name: "علی احمدی",
    role: "agent",
    createdAt: new Date().toISOString(),
    password: "agent123",
    isActive: true,
  },
  {
    id: "customer-1",
    phone: "5555555555",
    name: "محمد رضایی",
    role: "customer",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("loan-app-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (phone: string, password: string): Promise<boolean> => {
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log("[v0] Login attempt:", { phone, normalizedPhone, password })

    const usersData = localStorage.getItem(STORAGE_KEYS.USERS)
    console.log("[v0] Users data from localStorage:", usersData)

    if (!usersData) {
      console.log("[v0] No users data found in localStorage")
      return false
    }

    const users: User[] = JSON.parse(usersData)
    console.log("[v0] Parsed users:", users)

    const foundUser = users.find((u) => normalizePhoneNumber(u.phone) === normalizedPhone)
    console.log("[v0] Found user:", foundUser)

    if (foundUser) {
      console.log("[v0] Checking password:", {
        inputPassword: password,
        storedPassword: foundUser.password,
        isDemo123: password === "demo123",
        matchesStored: password === foundUser.password,
      })

      if (password === "demo123" || password === foundUser.password) {
        // Check if user is active (only for agents, admins and customers are always allowed)
        if (foundUser.role === "agent" && foundUser.isActive === false) {
          console.log("[v0] Agent is deactivated, denying login")
          return false
        }

        console.log("[v0] Login successful")
        setUser(foundUser)
        localStorage.setItem("loan-app-user", JSON.stringify(foundUser))
        return true
      } else {
        console.log("[v0] Password mismatch")
      }
    } else {
      console.log("[v0] User not found")
    }

    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("loan-app-user")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
