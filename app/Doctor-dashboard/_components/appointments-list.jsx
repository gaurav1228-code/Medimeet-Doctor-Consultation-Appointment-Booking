// app/Doctor-dashboard/_components/appointments-list.jsx
"use client";

import { useEffect, useState } from "react";
import { AppointmentCard } from "@/components/appointment-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Filter, Loader2, RefreshCw } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { getDoctorAppointments } from "@/lib/actions/doctor-appointments";

export default function DoctorAppointmentsList() {
  const {
    loading,
    data,
    fn: fetchAppointments,
  } = useFetch(getDoctorAppointments);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  useEffect(() => {
    if (data?.appointments) {
      const now = new Date();
      
      switch (activeTab) {
        case "upcoming":
          setFilteredAppointments(
            data.appointments.filter(
              (apt) => new Date(apt.start_time) > now && apt.status !== "CANCELLED"
            )
          );
          break;
        case "past":
          setFilteredAppointments(
            data.appointments.filter(
              (apt) => (new Date(apt.start_time) <= now && new Date(apt.end_time) >= now) || apt.status === "COMPLETED"
            )
          );
          break;
        case "all":
          setFilteredAppointments(data.appointments);
          break;
        case "cancelled":
          setFilteredAppointments(
            data.appointments.filter((apt) => apt.status === "CANCELLED")
          );
          break;
        default:
          setFilteredAppointments(data.appointments);
      }
    }
  }, [data?.appointments, activeTab]);

  const appointments = data?.appointments || [];
  const upcomingCount = appointments.filter(
    (apt) => new Date(apt.start_time) > new Date() && apt.status !== "CANCELLED"
  ).length;
  const completedCount = appointments.filter(
    (apt) => new Date(apt.start_time) < new Date() && new Date(apt.end_time) > new Date()
  ).length;
  const cancelledCount = appointments.filter(
    (apt) => apt.status === "CANCELLED"
  ).length;

  // Function to trigger refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-400" />
            Appointments
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Total: {appointments.length}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="border-emerald-900/30"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upcoming" className="flex flex-col items-center py-2">
              <span>Upcoming</span>
              <span className="text-xs text-muted-foreground mt-1">
                {upcomingCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex flex-col items-center py-2">
              <span>Currently</span>
              <span className="text-xs text-muted-foreground mt-1">
                {completedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex flex-col items-center py-2">
              <span>Cancelled</span>
              <span className="text-xs text-muted-foreground mt-1">
                {cancelledCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex flex-col items-center py-2">
              <span>All</span>
              <span className="text-xs text-muted-foreground mt-1">
                {appointments.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-3" />
              <p className="text-muted-foreground">Loading appointments...</p>
            </div>
          ) : (
            <>
              <TabsContent value={activeTab} className="mt-0">
                {filteredAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        userRole="DOCTOR"
                        refetchAppointments={handleRefresh} // Pass refresh function
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      No appointments found
                    </h3>
                    <p className="text-muted-foreground">
                      {activeTab === "upcoming"
                        ? "You don't have any upcoming appointments. Make sure you've set your availability to allow patients to book."
                        : activeTab === "past"
                        ? "No past appointments found."
                        : activeTab === "cancelled"
                        ? "No cancelled appointments found."
                        : "No appointments found."}
                    </p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        
      </CardContent>
    </Card>
  );
}
