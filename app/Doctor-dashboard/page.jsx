// app/Doctor-dashboard/page.jsx 
import { Calendar, Clock, Coins } from 'lucide-react';
import { redirect } from 'next/navigation';
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AvailabilitySettings from './_components/availability-settings';


const DoctorDashboard =async () => {
  const user = await getCurrentUser();

  const [appointmentsData,availabilityData]=await Promise.all([
    getDoctorAppointments(),
    getDoctorAvailability(),
  ]);

  if(user?.verificationStatus !== "VERIFIED"){
    redirect("/Doctor-dashboard/verification")
  }
  return (
    <div>
      <Tabs
        defaultValue="earnings"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-14 md:h-40 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
          <TabsTrigger value="earnings"  className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <Coins className="h-4 w-4 mr-2" />
            <span>Earnings</span>
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span>Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full">
            <Clock className="h-4 w-4 mr-2" />
            <span>Availability</span>
          </TabsTrigger>
        </TabsList>

        <div className="md:col-span-3">
        <TabsContent value="earnings">
        </TabsContent>
        
        <TabsContent value="appointments">
        </TabsContent>

         <TabsContent value="availability">    
          <AvailabilitySettings slots={availabilityData.slots || []}/>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default DoctorDashboard
