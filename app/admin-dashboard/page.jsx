// app/admin-dashboard/page.jsx
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, User } from "lucide-react";
import PendingDoctors from './components/pending-doctors';
import { VerifiedDoctors } from './components/verified-doctors';
import { Patients } from './components/patients';
import { getUserData } from '@/lib/server-actions';
import { redirect } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { getPendingDoctors, getVerifiedDoctors, getAllPatients } from '@/lib/admin-data';

const AdminDashboard = async () => {
  // Check if user is admin
  const userData = await getUserData();
  
  console.log('🔍 Admin Dashboard - User data:', userData);
  
  if (!userData) {
    console.log('❌ No user data, redirecting to home');
    redirect('/');
  }

  if (userData.role !== USER_ROLES.ADMIN) {
    console.log('❌ User is not admin, redirecting to home. User role:', userData.role);
    redirect('/');
  }

  console.log('✅ User is admin, loading dashboard...');

  // Fetch data directly from Supabase on the server
  const [pendingDoctors, verifiedDoctors, patients] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
    getAllPatients()
  ]);

  console.log('📊 Data loaded:', {
    pendingDoctors: pendingDoctors.length,
    verifiedDoctors: verifiedDoctors.length,
    patients: patients.length
  });

  return (
    <div className="container mx-auto px-4 pt-26">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage doctor verifications</p>
      </div>

      <Tabs
        defaultValue="pending"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-14 md:h-40 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
          <TabsTrigger value="pending"  className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Pending Verification</span>
          </TabsTrigger>
          <TabsTrigger
            value="doctors"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            <span>All Doctors</span>
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <User className="h-4 w-4 mr-2" />
            <span>All Patients</span>
          </TabsTrigger>
        </TabsList>

        <div className="md:col-span-3">
        <TabsContent value="pending">
          <PendingDoctors doctors={pendingDoctors}/>
        </TabsContent>
        
        <TabsContent value="doctors">
          <VerifiedDoctors doctors={verifiedDoctors}/>
        </TabsContent>

         <TabsContent value="patients">
          <Patients patients={patients}/>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
