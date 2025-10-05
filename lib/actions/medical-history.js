// lib/actions/medical-history.js - UPDATED
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getMedicalDocuments() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get patient ID
    const { data: patientData, error: patientError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'PATIENT')
      .single();

    if (patientError || !patientData) {
      return { success: false, error: 'Patient not found' };
    }

    // Get medical documents for the patient
    const { data: documents, error } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', patientData.id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching medical documents:', error);
      return { success: false, error: 'Failed to fetch medical documents' };
    }

    return { success: true, documents: documents || [] };
  } catch (error) {
    console.error('Error in getMedicalDocuments:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function addMedicalDocument(formData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const title = formData.get('title');
    const description = formData.get('description');
    const document_type = formData.get('document_type');
    const google_drive_url = formData.get('google_drive_url');

    // Get patient ID
    const { data: patientData, error: patientError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'PATIENT')
      .single();

    if (patientError || !patientData) {
      return { success: false, error: 'Patient not found' };
    }

    // Convert to direct download link if it's a view link
    let finalUrl = google_drive_url;
    if (google_drive_url.includes("/file/d/")) {
      const fileId = google_drive_url.match(/\/file\/d\/([^\/]+)/)?.[1];
      if (fileId) {
        finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    // Insert medical document
    const { error: insertError } = await supabase
      .from('medical_documents')
      .insert({
        patient_id: patientData.id,
        title,
        description,
        document_type,
        google_drive_url: finalUrl,
        upload_date: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting medical document:', insertError);
      return { success: false, error: 'Failed to add medical document: ' + insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in addMedicalDocument:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function deleteMedicalDocument(documentId) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get patient ID to verify ownership
    const { data: patientData, error: patientError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'PATIENT')
      .single();

    if (patientError || !patientData) {
      return { success: false, error: 'Patient not found' };
    }

    const { error } = await supabase
      .from('medical_documents')
      .delete()
      .eq('id', documentId)
      .eq('patient_id', patientData.id);

    if (error) {
      console.error('Error deleting medical document:', error);
      return { success: false, error: 'Failed to delete document' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteMedicalDocument:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getPatientMedicalHistoryForDoctor(patientId) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the user is a doctor
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor access required' };
    }

    // Check if the doctor has ANY appointment with this patient (past or present)
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, status, start_time')
      .eq('doctor_id', doctorData.id)
      .eq('patient_id', patientId)
      .order('start_time', { ascending: false })
      .limit(1);

    if (appointmentsError) {
      console.error('Error checking appointments:', appointmentsError);
      return { success: false, error: 'Failed to verify appointment access' };
    }

    // Allow access if doctor has any appointment with this patient
    if (!appointments || appointments.length === 0) {
      return { success: false, error: 'No appointment history with this patient' };
    }

    // Get medical documents for the patient
    const { data: documents, error } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching medical documents:', error);
      return { success: false, error: 'Failed to fetch medical history' };
    }

    return { 
      success: true, 
      documents: documents || [],
      appointmentStatus: appointments[0].status,
      lastAppointment: appointments[0].start_time
    };
  } catch (error) {
    console.error('Error in getPatientMedicalHistoryForDoctor:', error);
    return { success: false, error: 'Internal server error' };
  }
}