// app/api/debug/routes/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const routes = {
    patientDashboard: '/Patient-dashboard',
    patientAppointments: '/Patient-dashboard/Yourappointments', 
    patientMedicalHistory: '/Patient-dashboard/medical-history',
    patientSpeciality: '/Patient-dashboard/speciality'
  };

  return NextResponse.json({ 
    message: 'Available routes',
    routes,
    timestamp: new Date().toISOString()
  });
}