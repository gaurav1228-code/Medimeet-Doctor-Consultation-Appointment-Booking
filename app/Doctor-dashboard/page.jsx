// app/Doctor-dashboard/page.jsx 
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from '@/lib/server-actions';
import DoctorAppointmentsList from './_components/appointments-list';
import AvailabilitySettings from './_components/availability-settings';
import { DoctorEarnings } from './_components/doctor-earnings';
import { Calendar, Clock, Coins } from 'lucide-react';

export default async function DoctorDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  if (user.verification_status !== "VERIFIED") {
    redirect("/Doctor-dashboard/verification");
  }

  return (
    <div className="container mx-auto px-4 pt-26">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Manage your practice and appointments</p>
      </div>

      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <DoctorAppointmentsList />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilitySettings />
        </TabsContent>

        <TabsContent value="earnings">
          <DoctorEarnings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
