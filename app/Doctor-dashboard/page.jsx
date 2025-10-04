// app/Doctor-dashboard/page.jsx
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/server-actions";

import AvailabilitySettings from "./_components/availability-settings";

import { Calendar, Clock, Coins, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import DoctorAppointmentsList from "./_components/appointments-list";
import { DoctorEarnings } from "./_components/doctor-earnings";


export default async function DoctorDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  if (user.verification_status !== "VERIFIED") {
    redirect("/Doctor-dashboard/verification");
  }

  return (
    <div className="container mx-auto px-4 pt-26">
      <div className="mb-6">
        <PageHeader
          icon={<Stethoscope />}
          title="Doctor Dashboard"
          showBackButton={false}
        />
      </div>

      <Tabs
        defaultValue="appointments"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-14 md:h-40 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
          <TabsTrigger
            value="appointments"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger
            value="availability"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <Clock className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger
            value="earnings"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <Coins className="h-4 w-4" />
            Earnings
          </TabsTrigger>
        </TabsList>

        <div className="md:col-span-3">
          <TabsContent value="appointments">
            <DoctorAppointmentsList/>
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilitySettings/>
          </TabsContent>

          <TabsContent value="earnings">
            <DoctorEarnings/>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
