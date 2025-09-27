// app/Patient-dashboard/speciality/[specialty]/[id]/page.jsx
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@supabase/supabase-js";
import {
  User,
  Calendar,
  Clock,
  Medal,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getDoctorById(id) {
  try {
    const { data: doctor, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("role", "DOCTOR")
      .eq("verification_status", "VERIFIED")
      .single();
    if (error) throw error;
    return doctor;
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return null;
  }
}

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;
  const doctor = await getDoctorById(id);

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 pt-26">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white">Doctor Not Found</h1>
          <p className="text-muted-foreground">
            The requested doctor profile could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Left column - Doctor Photo and Quick Info (fixed on scroll) */}
        <div className="md:grid-cols-1">
          <div className="md:sticky md:top-24">
            <Card className="border-emerald-900/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 mb-4 bg-emerald-900/20 rounded-full overflow-hidden">
                    {doctor.imageUrl ? (
                      <Image
                        src={doctor.imageUrl}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center">
                        <User className="w-16 h-16 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  <h2 className="mb-1 text-xl font-bold text-white">
                    {doctor.name}
                  </h2>
                  <Badge
                    variant="outline"
                    className="mb-4 bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                  >
                    {doctor.specialty}
                  </Badge>

                  <div className="flex items-center justify-center mb-2">
                    <Medal className="h-4 w-4 text-emerald-400 mr-2" />
                    <span className="text-muted-foreground">
                      {doctor.experience} years experience
                    </span>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>

         {/* Right column - Doctor Details and Booking Section */}
        <div className="md:grid-cols-2 space-y-6">
          <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">
              About {doctor.name}
            </CardTitle>
            <CardDescription>
              Professional background and expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 className="text-white font-medium">Description</h3>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {doctor.description}
              </p>
            </div>

            <Separator className="bg-emerald-900/20" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <h3 className="text-white font-medium">Availability</h3>
              </div>
              {totalSlots > 0 ? (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-emerald-400 mr-2" />
                  <p className="text-muted-foreground">
                    {totalSlots} time slots available for booking over the next
                    4 days
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No available slots for the next 4 days. Please check back
                    later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>



















      <div className="container mx-auto px-4 pt-26">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            icon={<Stethoscope />}
            title={doctor.name}
            backLink={`/Patient-dashboard/speciality/${encodeURIComponent(
              doctor.specialty
            )}`}
            backLabel={`Back to ${doctor.specialty}`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctor Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-emerald-900/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-10 w-10 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white">
                          {doctor.name}
                        </h2>
                        <Badge className="bg-emerald-900/20 text-emerald-400">
                          Verified
                        </Badge>
                      </div>
                      <p className="text-lg text-emerald-400 mb-1">
                        {doctor.specialty}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {doctor.experience} years of experience
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Online Consultations
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Available Today
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About Section */}
              <Card className="border-emerald-900/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    About Dr. {doctor.name.split(" ")[0]}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {doctor.description ||
                      `Dr. ${doctor.name} is a qualified ${doctor.specialty} with ${doctor.experience} years of experience.`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Booking Sidebar */}
            <div className="space-y-6">
              <Card className="border-emerald-900/20 sticky top-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Book Appointment
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Consultation Fee
                      </span>
                      <span className="text-white font-semibold">
                        2 Credits
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="text-white">30 minutes</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>

                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    You'll be able to choose a time slot after clicking Book Now
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
