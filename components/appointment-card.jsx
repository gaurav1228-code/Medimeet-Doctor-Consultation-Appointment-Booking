// components/appointment-card.jsx - UPDATED
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CreditCard,
  FileText,
  ExternalLink,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  cancelAppointment,
  addAppointmentNotes,
  shareMedicalHistory,
} from "@/lib/actions/appointment-actions";
import { createClient } from "@supabase/supabase-js";
import { getPatientMedicalHistoryForDoctor } from "@/lib/actions/medical-history";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date()); // Add current time state
  const router = useRouter();

  // UseFetch hooks for server actions
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch medical documents when dialog opens for doctors
  useEffect(() => {
    if (open && userRole === "DOCTOR" && appointment.patient_id) {
      fetchMedicalDocuments();
    }
  }, [open, userRole, appointment.patient_id]);
  
const fetchMedicalDocuments = async () => {
  try {
    setLoadingMedicalHistory(true);
    
    // Use server action instead of direct Supabase call
    const result = await getPatientMedicalHistoryForDoctor(appointment.patient_id);
    
    if (result.success) {
      setMedicalDocuments(result.documents || []);
      
      // Show informational message based on appointment status
      if (result.appointmentStatus && result.appointmentStatus !== 'SCHEDULED') {
        toast.info(`Viewing medical history from ${result.appointmentStatus.toLowerCase()} appointment`);
      }
    } else {
      console.error("Error fetching medical documents:", result.error);
      
      // Show more specific error messages
      if (result.error.includes('No appointment history')) {
        toast.error("No appointment history with this patient");
      } else if (result.error.includes('Doctor access required')) {
        toast.error("Doctor access required to view medical history");
      } else {
        toast.error("Failed to load medical history");
      }
    }
  } catch (error) {
    console.error("Error fetching medical documents:", error);
    toast.error("Failed to load medical history");
  } finally {
    setLoadingMedicalHistory(false);
  }
};

  // Format date and time
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format time only
  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (cancelLoading) return;

    const confirmationMessage =
      userRole === "DOCTOR"
        ? "Are you sure you want to cancel this appointment? The credits will be refunded to the patient and deducted from your account."
        : "Are you sure you want to cancel this appointment? Your credits will be refunded.";

    if (window.confirm(confirmationMessage)) {
      await submitCancel(appointment.id);
    }
  };

  // Handle save notes (doctor only)
  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "DOCTOR") return;

    await submitNotes(appointment.id, notes);
  };

  // Video call function
  const handleJoinVideoCall = () => {
    setAction("video");
    const appointmentId = appointment.id;

    const videoCallUrl = `/video-call/hms-page?appointmentId=${appointmentId}`;

    console.log("Opening 100ms video call for appointment:", appointmentId);

    const newWindow = window.open(
      videoCallUrl,
      `video-call-${appointmentId}`,
      "width=1280,height=800,menubar=no,toolbar=no,location=no,status=no"
    );

    if (newWindow) {
      toast.success(`Joining video consultation...`);
      setTimeout(() => newWindow?.focus(), 500);
    } else {
      toast.error("Please allow pop-ups. Opening in same tab...");
      window.location.href = videoCallUrl;
    }

    setAction(null);
  };

  // Handle successful operations
  useEffect(() => {
    if (cancelData?.success) {
      toast.success(`Appointment cancelled successfully`);
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [cancelData, refetchAppointments, router]);

  useEffect(() => {
    if (notesData?.success) {
      toast.success("Notes saved successfully");
      setAction(null);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [notesData, refetchAppointments, router]);

  // UPDATED: Determine if appointment is active (within 3 minutes of start time until end time)
  const isAppointmentActive = () => {
    const now = currentTime;
    const appointmentTime = new Date(appointment.start_time);
    const appointmentEndTime = new Date(appointment.end_time);

    // Can join 3 minutes before start until end time
    const threeMinutesBefore = new Date(appointmentTime.getTime() - 3 * 60 * 1000);
    const canJoinEarly = now >= threeMinutesBefore;
    const isDuringAppointment = now >= appointmentTime && now <= appointmentEndTime;
    const isBeforeEndTime = now <= appointmentEndTime;

    return (canJoinEarly && isBeforeEndTime) || isDuringAppointment;
  };

  // Determine other party information based on user role
  const otherParty =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;
  const otherPartyLabel = userRole === "DOCTOR" ? "Patient" : "Doctor";
  const otherPartyIcon =
    userRole === "DOCTOR" ? (
      <User className="h-4 w-4" />
    ) : (
      <Stethoscope className="h-4 w-4" />
    );

  const getStatusVariant = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-900/20 border-green-900/30 text-green-400";
      case "CANCELLED":
        return "bg-red-900/20 border-red-900/30 text-red-400";
      case "SCHEDULED":
        return "bg-blue-900/20 border-blue-900/30 text-blue-400";
      default:
        return "bg-gray-900/20 border-gray-900/30 text-gray-400";
    }
  };

  // Show credit information for doctors
  const showCreditInfo =
    userRole === "DOCTOR" && appointment.status === "SCHEDULED";

  // Add Medical History Section to the Dialog
  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);

  const renderMedicalHistorySection = () => {
    if (userRole !== "DOCTOR") return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Patient Medical History
          </h4>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-900/30 text-blue-400 hover:bg-blue-900/20"
            onClick={() => setOpenMedicalDialog(true)}
          >
            <FileText className="h-4 w-4 mr-1" />
            View Documents
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Appointment Card */}
      <Card className="border-emerald-900/20 hover:border-emerald-700/30 transition-all">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted/20 rounded-full p-2 mt-1">
                {otherPartyIcon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-white">
                    {userRole === "DOCTOR"
                      ? otherParty?.name || "Patient"
                      : `Dr. ${otherParty?.name || "Doctor"}`}
                  </h3>
                  <Badge
                    variant="outline"
                    className={getStatusVariant(appointment.status)}
                  >
                    {appointment.status}
                  </Badge>
                  {showCreditInfo && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />2 Credits Earned
                    </Badge>
                  )}
                </div>

                {userRole === "DOCTOR" && otherParty?.email && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {otherParty.email}
                  </p>
                )}
                {userRole === "PATIENT" && otherParty?.specialty && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {otherParty.specialty}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(appointment.start_time), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(appointment.start_time), "h:mm a")} -
                    {format(new Date(appointment.end_time), "h:mm a")}
                  </div>
                </div>

                {appointment.patient_description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {appointment.patient_description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 self-end md:self-start">
              <div className="flex gap-2 flex-wrap">
                {/* View Details Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-900/30"
                  onClick={() => setOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-w-screen-2xl w-[90vw] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === "SCHEDULED"
                ? "Manage your upcoming appointment"
                : "View appointment information"}
            </DialogDescription>
          </DialogHeader>

          {/* Arrange main content in responsive 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
            {/* Left Side */}
            <div className="space-y-6">
              {/* Other Party Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {otherPartyLabel}
                </h4>
                <div className="flex items-center gap-3">
                  <div className="bg-muted/20 rounded-full p-2">
                    {otherPartyIcon}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {userRole === "DOCTOR"
                        ? otherParty?.name || "Patient"
                        : `Dr. ${otherParty?.name || "Doctor"}`}
                    </p>
                    {userRole === "DOCTOR" && otherParty?.email && (
                      <p className="text-muted-foreground text-sm">
                        {otherParty.email}
                      </p>
                    )}
                    {userRole === "PATIENT" && otherParty?.specialty && (
                      <p className="text-muted-foreground text-sm">
                        {otherParty.specialty}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment Time */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Scheduled Time
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <p className="text-white">
                      {formatDateTime(appointment.start_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-400" />
                    <p className="text-white">
                      {formatTime(appointment.start_time)} -{" "}
                      {formatTime(appointment.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Credit Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getStatusVariant(appointment.status)}
                  >
                    {appointment.status}
                  </Badge>
                  {showCreditInfo && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />2 Credits Earned
                    </Badge>
                  )}
                </div>
                {showCreditInfo && (
                  <p className="text-xs text-muted-foreground">
                    Credits were added to your account when this appointment was
                    booked
                  </p>
                )}
              </div>

              {/* Patient Description */}
              {appointment.patient_description && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {userRole === "DOCTOR"
                      ? "Patient Description"
                      : "Your Description"}
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/20 border border-emerald-900/20">
                    <p className="text-white whitespace-pre-line">
                      {appointment.patient_description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side */}
            <div className="space-y-3">
              {/* Medical History Section - ADD THIS */}
              {renderMedicalHistorySection()}
              {/* Video Call */}
              {appointment.status === "SCHEDULED" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Video Consultation
                  </h4>
                  <Button
                    className=" bg-emerald-600 hover:bg-emerald-700"
                    disabled={!isAppointmentActive() || action === "video"}
                    onClick={handleJoinVideoCall}
                  >
                    {action === "video" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining Room...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        {isAppointmentActive()
                          ? "Join Video Room"
                          : "Video room available 3 minutes before appointment"}
                      </>
                    )}
                  </Button>
                  {!isAppointmentActive() && (
                    <p className="text-xs text-muted-foreground">
                      Available from {format(new Date(new Date(appointment.start_time).getTime() - 3 * 60 * 1000), "h:mm a")} to {formatTime(appointment.end_time)}
                    </p>
                  )}
                </div>
              )}

              {/* Doctor Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Doctor Notes
                  </h4>
                  {userRole === "DOCTOR" &&
                    appointment.status !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAction(action === "notes" ? null : "notes")
                        }
                        className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        {appointment.notes ? "Edit" : "Add"} Notes
                      </Button>
                    )}
                </div>

                {userRole === "DOCTOR" && action === "notes" ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter your clinical notes here..."
                      className="bg-background border-emerald-900/20 min-h-[100px] resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAction(null);
                          setNotes(appointment.notes || "");
                        }}
                        className="border-emerald-900/30"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={notesLoading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {notesLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Notes"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/20 border border-emerald-900/20 min-h-[80px]">
                    {appointment.notes ? (
                      <p className="text-white whitespace-pre-line">
                        {appointment.notes}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        No notes added yet
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Cancellation Warning */}
              {appointment.status === "SCHEDULED" && (
                <div className="p-4 bg-amber-900/20 border border-amber-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-400 mb-2">
                    Cancellation Policy
                  </h4>
                  <p className="text-xs text-amber-300">
                    {userRole === "DOCTOR"
                      ? "If cancelled, 2 credits will be refunded to the patient and deducted from your account."
                      : "If cancelled, your 2 credits will be refunded. Cancellations must be made at least 1 hour before the appointment."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 pt-4">
            <div className="flex gap-2 flex-wrap">
              {appointment.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Medical History Dialog */}
      <Dialog open={openMedicalDialog} onOpenChange={setOpenMedicalDialog}>
        <DialogContent className="!max-w-4xl !max-h-3xl w-[90vw] h-[75vh] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Patient Medical History
            </DialogTitle>
            <DialogDescription>
              Documents shared by the patient for medical review.
            </DialogDescription>
          </DialogHeader>

          {loadingMedicalHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mr-2" />
              <span className="text-muted-foreground">
                Loading medical history...
              </span>
            </div>
          ) : medicalDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
              {medicalDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 bg-muted/20 max-h-28 rounded-lg border border-emerald-900/10 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize truncate">
                        {doc.document_type} •{" "}
                        {format(new Date(doc.upload_date), "MMM d, yyyy")}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        window.open(doc.google_drive_url, "_blank")
                      }
                      title="View Document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = doc.google_drive_url;
                        link.target = "_blank";
                        link.click();
                      }}
                      title="Download Document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No medical documents available</p>
            </div>
          )}

          <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-900/30 mt-4">
            <p className="text-xs text-blue-300">
              <strong>Note:</strong> Please maintain patient confidentiality
              when reviewing these medical records.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
