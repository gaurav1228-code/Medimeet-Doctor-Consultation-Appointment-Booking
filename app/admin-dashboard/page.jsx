// app/admin-dashboard/page.jsx - FIXED API CALLS
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, User, CreditCard } from "lucide-react";
import PendingDoctors from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { Patients } from "./components/patients";
import { getUserData } from "@/lib/server-actions";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@/lib/constants";
import { PendingPayouts } from "./components/pending-payouts";
import { getPendingPayouts } from "@/lib/actions/admin";

// Combined data fetching function with error handling
async function getAdminData() {
  try {
    console.log('🔄 Fetching admin data...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const [pendingDoctorsRes, verifiedDoctorsRes, patientsRes, pendingPayoutsRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin?type=pending-doctors`, {
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/admin?type=verified-doctors`, {
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/admin?type=patients`, {
        cache: 'no-store',
      }),
      getPendingPayouts()
    ]);

    const [pendingDoctorsData, verifiedDoctorsData, patientsData] = await Promise.all([
      pendingDoctorsRes.ok ? pendingDoctorsRes.json() : { doctors: [] },
      verifiedDoctorsRes.ok ? verifiedDoctorsRes.json() : { doctors: [] },
      patientsRes.ok ? patientsRes.json() : { patients: [] }
    ]);

    console.log('✅ Admin data fetched');

    return {
      pendingDoctors: pendingDoctorsData.doctors || [],
      verifiedDoctors: verifiedDoctorsData.doctors || [],
      patients: patientsData.patients || [],
      pendingPayouts: pendingPayoutsRes.success ? pendingPayoutsRes.payouts : []
    };
  } catch (error) {
    console.error("❌ Error fetching admin data:", error);
    return {
      pendingDoctors: [],
      verifiedDoctors: [],
      patients: [],
      pendingPayouts: []
    };
  }
}

const AdminDashboard = async () => {
  const userData = await getUserData();

  if (!userData) {
    redirect("/");
  }

  if (userData.role !== USER_ROLES.ADMIN) {
    redirect("/");
  }

  const { pendingDoctors, verifiedDoctors, patients, pendingPayouts } = await getAdminData();

  return (
    <div className="container mx-auto px-4 pt-26">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage doctor verifications</p>
      </div>

      <Tabs defaultValue="pending" className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <TabsList className="md:col-span-1 bg-muted/30 border h-24 md:h-60 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
          <TabsTrigger value="pending" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Pending Verification</span>
          </TabsTrigger>
          <TabsTrigger value="doctors" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <Users className="h-4 w-4 mr-2" />
            <span>All Doctors</span>
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <User className="h-4 w-4 mr-2" />
            <span>All Patients</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <CreditCard className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Payouts</span>
          </TabsTrigger>
        </TabsList>

        <div className="md:col-span-3">
          <TabsContent value="pending">
            <PendingDoctors doctors={pendingDoctors} />
          </TabsContent>

          <TabsContent value="doctors">
            <VerifiedDoctors doctors={verifiedDoctors} />
          </TabsContent>

          <TabsContent value="patients">
            <Patients patients={patients} />
          </TabsContent>

          <TabsContent value="payouts" className="border-none p-0">
            <PendingPayouts payouts={pendingPayouts} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;