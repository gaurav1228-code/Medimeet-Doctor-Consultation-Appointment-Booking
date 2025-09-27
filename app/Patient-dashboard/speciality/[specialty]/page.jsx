// app/Patient-dashboard/speciality/[specialty]/page.jsx
import { PageHeader } from '@/components/PageHeader';
import { DoctorCard } from '@/components/DoctorCard';
import { createClient } from '@supabase/supabase-js';
import { Stethoscope } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getDoctorsBySpecialty(specialty) {
  try {
    const { data: doctors, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'DOCTOR')
      .eq('verification_status', 'VERIFIED')
      .eq('specialty', decodeURIComponent(specialty))
      .order('name');

    if (error) throw error;
    return doctors || [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

export default async function DoctorsPage({ params }) {
  const { specialty } = await params;
  const decodedSpecialty = decodeURIComponent(specialty);
  const doctors = await getDoctorsBySpecialty(specialty);

  return (
    <div className="container mx-auto px-4 pt-26">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          icon={<Stethoscope />}
          title={decodedSpecialty}
          backLink="/Patient-dashboard/speciality"
          backLabel="All Specialities"
        />
        
        {doctors && doctors.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <h3 className='mb-2 text-xl font-medium text-white'>No doctors available</h3>
            <p className='text-muted-foreground'>
              There are currently no verified doctors in this speciality. 
              Please check back later or choose another speciality.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}