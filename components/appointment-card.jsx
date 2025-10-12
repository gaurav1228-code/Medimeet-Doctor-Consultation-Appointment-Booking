// components/appointment-card.jsx
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
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  cancelAppointment,
  completeAppointment,
  addAppointmentNotes,
} from "@/lib/actions/appointment-actions";

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null); // 'cancel', 'notes', 'video', or 'complete'
  const [notes, setNotes] = useState(appointment.notes || "");
  const router = useRouter();

  // UseFetch hooks for server actions
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: completeLoading,
    fn: submitComplete,
    data: completeData,
  } = useFetch(completeAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);

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

  // Check if appointment can be marked as completed
  const canMarkCompleted = () => {
    if (userRole !== "DOCTOR" || appointment.status !== "SCHEDULED") {
      return false;
    }
    const now = new Date();
    const appointmentEndTime = new Date(appointment.end_time);
    return now >= appointmentEndTime;
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (cancelLoading) return;

    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      await submitCancel(appointment.id);
    }
  };

  // Handle mark as completed
  const handleMarkCompleted = async () => {
    if (completeLoading) return;

    // Check if appointment end time has passed
    const now = new Date();
    const appointmentEndTime = new Date(appointment.end_time);

    if (now < appointmentEndTime) {
      alert(
        "Cannot mark appointment as completed before the scheduled end time."
      );
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to mark this appointment as completed? This action cannot be undone."
      )
    ) {
      await submitComplete(appointment.id);
    }
  };

  // Handle save notes (doctor only)
  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "DOCTOR") return;

    await submitNotes(appointment.id, notes);
  };

// In your appointment-card.jsx - Update the video call function
const handleJoinVideoCall = () => {
  setAction("video");
  const appointmentId = appointment.id;
  
  // Just pass the appointment ID - the API will handle room creation
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
      const action =
        cancelData.action === "COMPLETED" ? "completed" : "cancelled";
      toast.success(`Appointment ${action} successfully`);
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [cancelData, refetchAppointments, router]);

  useEffect(() => {
    if (completeData?.success) {
      toast.success("Appointment marked as completed");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [completeData, refetchAppointments, router]);

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

  // Determine if appointment is active (within 30 minutes of start time)
  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.start_time);
    const appointmentEndTime = new Date(appointment.end_time);

    // Can join 30 minutes before start until end time
    const canJoinEarly =
      appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000;
    const isDuringAppointment =
      now >= appointmentTime && now <= appointmentEndTime;

    return canJoinEarly || isDuringAppointment;
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
                {/* Complete Button - Doctor only */}
                {canMarkCompleted() && (
                  <Button
                    size="sm"
                    onClick={handleMarkCompleted}
                    disabled={completeLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {completeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Complete
                  </Button>
                )}

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

              {/* Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <Badge
                  variant="outline"
                  className={getStatusVariant(appointment.status)}
                >
                  {appointment.status}
                </Badge>
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
            <div className="space-y-6">
              {/* Video Call */}

              {appointment.status === "SCHEDULED" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Video Consultation
                  </h4>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
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
                          : "Video room available 30 minutes before appointment"}
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>• Both doctor and patient join the same room</p>
                    <p>
                      • Share the room ID if needed:{" "}
                      <strong>appointment-{appointment.id}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Simple peer-to-peer video call
                  </p>
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
    </>
  );
}
