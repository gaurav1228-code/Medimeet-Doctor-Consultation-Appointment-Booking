// app/admin-dashboard/page.jsx - FIXED API CALLS
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, User, CreditCard } from "lucide-react";
import PendingDoctors from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { Patients } from "./components/patients";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@/lib/constants";
import { PendingPayouts } from "./components/pending-payouts";
import { getPendingPayouts } from "@/lib/actions/admin";
import { createServerClient } from "@/lib/supabase-client";
import { currentUser } from "@clerk/nextjs/server";

// Server-side data fetching for admin dashboard
async function getAdminData() {
  try {
    console.log('🔄 Fetching admin data server-side...');
    
    const supabase = createServerClient();
    
    const [
      pendingDoctorsResult,
      verifiedDoctorsResult, 
      patientsResult,
      payoutsResult
    ] = await Promise.all([
      // Pending doctors
      supabase
        .from('users')
        .select('*')
        .eq('role', 'DOCTOR')
        .eq('verification_status', 'PENDING')
        .order('created_at', { ascending: true }),
      
      // Verified doctors
      supabase
        .from('users')
        .select('*')
        .eq('role', 'DOCTOR')
        .in('verification_status', ['VERIFIED', 'REJECTED'])
        .order('created_at', { ascending: false }),
      
      // Patients
      supabase
        .from('users')
        .select('*')
        .eq('role', 'PATIENT')
        .order('created_at', { ascending: false }),
      
      // Payouts
      getPendingPayouts()
    ]);

    console.log('✅ Admin data fetched successfully');

    return {
      pendingDoctors: pendingDoctorsResult.data || [],
      verifiedDoctors: verifiedDoctorsResult.data || [],
      patients: patientsResult.data || [],
      pendingPayouts: payoutsResult.success ? payoutsResult.payouts : []
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
  // Get user from Clerk
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is admin using Clerk metadata
  const userRole = user.unsafeMetadata?.role;
  
  if (userRole !== USER_ROLES.ADMIN) {
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
