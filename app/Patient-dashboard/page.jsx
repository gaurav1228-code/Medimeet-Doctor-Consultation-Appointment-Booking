// app/Patient-dashboard/page.jsx
import { getUserData } from "@/lib/server-actions";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, CreditCard, User, Clock, FileText  } from "lucide-react";
import { APPOINTMENT_CREDIT_COST } from "@/lib/constants";
import Link from "next/link";
import { getPatientStats } from "@/lib/actions/patient-stats";

async function PatientDashboard() {
  const userData = await getUserData();

  if (!userData || userData.role !== "PATIENT") {
    redirect("/");
  }

  const { stats } = await getPatientStats();

  return (
    <div className="pt-28 px-6 min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, {userData.name?.split(" ")[0] || "Patient"}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your healthcare journey from your dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Available Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {stats.availableCredits}
              </div>
              <p className="text-xs text-muted-foreground">
                Each appointment costs {APPOINTMENT_CREDIT_COST} credits
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.upcomingAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled consultations
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                All time consultations
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <User className="h-4 w-4 mr-2" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.completedAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                Finished consultations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/Patient-dashboard/speciality">
              <Card className="border-emerald-900/40 hover:border-emerald-800/40 transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <Stethoscope className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">
                    Find Doctors
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browse available doctors by speciality
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/Patient-dashboard/Yourappointments">
              <Card className="border-emerald-900/40 hover:border-emerald-800/40 transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <Calendar className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">
                    My Appointments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage appointments
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/Patient-dashboard/medical-history">
              <Card className="border-emerald-900/40 hover:border-emerald-800/40 transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <FileText className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">
                    Medical History
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload and manage medical documents
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/Pricing">
              <Card className="border-emerald-900/40 hover:border-emerald-800/40 transition-all duration-300 cursor-pointer h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <CreditCard className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">Buy Credits</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchase consultation credits
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Credits Running Low Warning */}
        {stats.availableCredits < APPOINTMENT_CREDIT_COST && (
          <Card className="mb-8 border-orange-900/40 bg-orange-950/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-orange-400 mr-3" />
                <div>
                  <h3 className="font-semibold text-orange-400">
                    Credits Running Low
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have {stats.availableCredits} credits remaining. Each
                    appointment costs {APPOINTMENT_CREDIT_COST} credits.
                    Consider purchasing more to continue booking appointments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
