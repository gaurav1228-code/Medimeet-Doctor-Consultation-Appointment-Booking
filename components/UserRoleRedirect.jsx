// components/UserRoleRedirect.jsx
import { getUserData } from '@/lib/server-actions';
import { redirect } from 'next/navigation';
import { USER_ROLES, VERIFICATION_STATUS } from '@/lib/constants';

export default async function UserRoleRedirect() {
  const userData = await getUserData();
  
  if (!userData) {
    redirect('/');
  }

  if (userData.role === USER_ROLES.PATIENT) {
    redirect('/Patient-dashboard');
  } else if (userData.role === USER_ROLES.DOCTOR) {
    if (userData.verification_status === VERIFICATION_STATUS.VERIFIED) {
      redirect('/Doctor-dashboard');
    } else {
      redirect('/Doctor-dashboard/verification');
    }
  } else if (userData.role === USER_ROLES.ADMIN) {
    redirect('/admin');
  }

  // If no specific role or UNASSIGNED, stay on current page
  return null;
}
