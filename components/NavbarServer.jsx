// components/NavbarServer.jsx
import { getSupabaseUser } from '@/app/actions/user-actions'
import NavbarClient from './NavbarClient'
import { auth } from '@clerk/nextjs/server'

export default async function NavbarServer() {
  const { userId } = auth()
  
  let supabaseUser = null
  let credits = 0
  let userRole = null
  let showRoleButton = false

  if (userId) {
    supabaseUser = await getSupabaseUser(userId)
    
    if (supabaseUser) {
      userRole = supabaseUser.role
      credits = supabaseUser.credits || 0
      showRoleButton = userRole === 'UNASSIGNED' || !userRole
    } else {
      showRoleButton = true
    }
  }

  return (
    <NavbarClient
      userId={userId}
      initialSupabaseUser={supabaseUser}
      initialCredits={credits}
      initialUserRole={userRole}
      initialShowRoleButton={showRoleButton}
    />
  )
}