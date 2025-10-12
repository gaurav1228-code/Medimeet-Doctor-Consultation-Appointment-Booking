// app/Patient-dashboard/Yourappointments/page.jsx - UPDATED
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-actions";
import { PageHeader } from "@/components/PageHeader";
import { AppointmentCard } from "@/components/appointment-card";
import { getPatientAppointments } from "@/lib/actions/patient-appointments";

export default async function PatientAppointmentsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  let appointments = [];
  let error = null;

  try {
    const result = await getPatientAppointments();
    
    if (result.success) {
      appointments = result.appointments || [];
    } else {
      error = result.error;
      console.error('Error fetching appointments:', result.error);
    }
    
  } catch (err) {
    console.error('Error in appointments page:', err);
    error = err.message;
  }

  return (
    <div className="container mx-auto px-4 pt-26 py-8">
      <div className="mb-6">
        <PageHeader
          icon={<Calendar />}
          title="My Appointments"
          backLink="/Patient-dashboard"
          backLabel="Back to Dashboard"
        />
      </div>

      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            Your Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Error loading appointments: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Retry
              </button>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="PATIENT"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium text-white mb-2">
                No appointments scheduled
              </h3>
              <p className="text-muted-foreground">
                You don&apos;t have any appointments scheduled yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
