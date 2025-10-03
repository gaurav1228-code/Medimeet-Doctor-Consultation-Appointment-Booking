// components/appointment-card.jsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Video, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { updateAppointmentStatus } from "@/lib/actions/doctor-appointments";

export function AppointmentCard({ appointment, userRole, refetchAppointments }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  const handleJoinVideo = () => {
    const roomId = `appointment-${appointment.id}`;
    const url = `/video-call?roomId=${roomId}&appointmentId=${appointment.id}`;
    const win = window.open(
      url,
      `video-call-${appointment.id}`,
      "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no"
    );
    if (!win) {
      // Fallback if popup blocked
      window.location.href = url;
    }
  };

  const isJoinWindowOpen = () => {
    const now = new Date();
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    return (start.getTime() - now.getTime() <= 30 * 60 * 1000) && now <= end; // 30m before start until end
  };

  const handleStatusUpdate = async (newStatus) => {
    if (loading) return;
    
    setLoading(true);
    setAction(newStatus);
    
    try {
      const result = await updateAppointmentStatus(appointment.id, newStatus);
      
      if (result.success) {
        await refetchAppointments?.();
      } else {
        console.error('Failed to update appointment:', result.error);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-900/20 text-green-400';
      case 'CANCELLED':
        return 'bg-red-900/20 text-red-400';
      case 'SCHEDULED':
        return 'bg-blue-900/20 text-blue-400';
      default:
        return 'bg-gray-900/20 text-gray-400';
    }
  };

  return (
    <Card className="border-emerald-900/20">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-4 w-4 text-emerald-400" />
              <span className="text-white font-medium">
                {appointment.patient?.name || 'Patient'}
              </span>
              <Badge variant="outline" className={getStatusVariant(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
            
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

          <div className="flex gap-2">
            {appointment.status === 'SCHEDULED' && (
              <Button
                size="sm"
                onClick={handleJoinVideo}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!isJoinWindowOpen()}
              >
                <Video className="h-4 w-4 mr-1" />
                {isJoinWindowOpen() ? 'Join Video Room' : 'Available 30m before start'}
              </Button>
            )}

            {userRole === 'DOCTOR' && appointment.status === 'SCHEDULED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading && action === 'COMPLETED' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Complete
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  disabled={loading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10"
                >
                  {loading && action === 'CANCELLED' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
