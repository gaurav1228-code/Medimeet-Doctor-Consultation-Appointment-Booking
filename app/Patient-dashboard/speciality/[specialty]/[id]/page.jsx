// app/Patient-dashboard/speciality/[specialty]/[id]/page.jsx
import { PageHeader } from "@/components/PageHeader";
import { createServerClient } from "@/lib/supabase-client";
import { getDoctorAvailabilityForPatient } from "@/lib/server-actions";
import DoctorProfile from "./_components/doctor-profile";
import { Stethoscope } from "lucide-react";

async function getDoctorById(id) {
  try {
    const supabase = createServerClient();

    const { data: doctor, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("role", "DOCTOR")
      .eq("verification_status", "VERIFIED")
      .single();

    if (error) {
      console.error('❌ Error fetching doctor:', error);
      throw error;
    }
    return doctor;
  } catch (error) {
    console.error("❌ Error fetching doctor:", error);
    return null;
  }
}

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;

  console.log('🔄 Loading doctor profile page for doctor ID:', id);

  try {
    // Fetch data in parallel
    const [doctor, availableDays] = await Promise.all([
      getDoctorById(id),
      getDoctorAvailabilityForPatient(id, 4), 
    ]);

    console.log('✅ Doctor data:', doctor);
    console.log('✅ Available days:', availableDays);

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
      <div className="container mx-auto px-4 pt-26">
        <PageHeader
          icon={null}
          title={null}
          backLink={`/Patient-dashboard/speciality/${encodeURIComponent(
            doctor.specialty
          )}`}
          backLabel={`Back to ${doctor.specialty}`}
        />

        <DoctorProfile doctor={doctor} availableDays={availableDays || []} />
      </div>
    );
  } catch (error) {
    console.error('❌ Error in DoctorProfilePage:', error);
    return (
      <div className="container mx-auto px-4 pt-26">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white">Error Loading Doctor Profile</h1>
          <p className="text-muted-foreground">
            There was an error loading the doctor profile. Please try again.
          </p>
        </div>
      </div>
    );
  }
}
