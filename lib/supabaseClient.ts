"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  // eslint-disable-next-line no-console
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL is not set")
}

if (!supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")


