// app/Doctor-dashboard/verification/page.jsx 
import { Stethoscope } from "lucide-react";
import VerificationStatusCard from "@/components/VerificationStatusCard";
import { getUserData } from '@/lib/server-actions';
import { redirect } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

async function VerificationPage() {
  const userData = await getUserData();
  
  // Redirect if user is not a doctor
  if (!userData) {
    redirect('/');
  }

  if (userData.role !== USER_ROLES.DOCTOR) {
    redirect('/');
  }

  // Check if doctor is fully verified (all documents verified)
  const isFullyVerified = userData.verification_status === 'VERIFIED' && 
                         userData.aadhaar_verified && 
                         userData.pan_verified && 
                         userData.medical_license_verified;

  if (isFullyVerified) {
    redirect('/Doctor-dashboard');
  }

  return (
    <>
      
      <div className="container mx-auto px-4 pt-26">
        <div className="max-w-2xl mx-auto">
          <VerificationStatusCard 
            verificationStatus={userData?.verification_status}
            aadhaarVerified={userData?.aadhaar_verified}
            panVerified={userData?.pan_verified}
            medicalLicenseVerified={userData?.medical_license_verified}
          />
        </div>
      </div>
    </>
  );
}

export default VerificationPage;
