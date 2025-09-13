// lib/supabase-client.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Client-side function to get user data
export async function getSupabaseUserClient(clerkUserId) {
  if (!clerkUserId) return null

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      console.error('Error fetching user from Supabase (client):', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in getSupabaseUserClient:', error)
    return null
  }
}

// Client-side function to update user
export async function updateSupabaseUserClient(clerkUserId, updates) {
  if (!clerkUserId) return null

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user in Supabase (client):', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in updateSupabaseUserClient:', error)
    return null
  }
}