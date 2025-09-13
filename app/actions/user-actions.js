// app/actions/user-actions.js
'use server';

import { createClient } from '@supabase/supabase-js'

// Use service role key for server actions (more secure)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Add this to your .env.local
)

export async function getSupabaseUser(clerkUserId) {
  if (!clerkUserId) return null

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      console.error('Error fetching user from Supabase:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in getSupabaseUser:', error)
    return null
  }
}

export async function updateSupabaseUser(clerkUserId, updates) {
  if (!clerkUserId) return null

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user in Supabase:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in updateSupabaseUser:', error)
    return null
  }
}