// app/Doctor-dashboard/_components/availability-settings.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Clock, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

const AvailabilitySettings = () => {
  const [showForm, setShowForm] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  // Fetch current availability
  const fetchSlots = async () => {
    try {
      setFetching(true);
      console.log('🔄 Fetching availability slots...');
      
      const response = await fetch('/api/doctor/availability');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch availability');
      }

      console.log('✅ Slots fetched:', result.slots);
      setSlots(result.slots || []);
    } catch (error) {
      console.error('❌ Error fetching slots:', error);
      toast.error('Failed to load availability');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const onSubmit = async (data) => {
    if (loading) return;

    console.log('🚀 Form submitted:', data);
    setLoading(true);

    try {
      // Create proper time strings in UTC
      const startTimeUTC = new Date();
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      startTimeUTC.setUTCHours(startHours, startMinutes, 0, 0);

      const endTimeUTC = new Date();
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      endTimeUTC.setUTCHours(endHours, endMinutes, 0, 0);

      const formData = new FormData();
      formData.append('startTime', startTimeUTC.toISOString());
      formData.append('endTime', endTimeUTC.toISOString());

      console.log('📤 Sending to API:', {
        startTime: startTimeUTC.toISOString(),
        endTime: endTimeUTC.toISOString()
      });

      const response = await fetch('/api/doctor/availability', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save availability');
      }

      console.log('✅ API response:', result);
      toast.success(`Availability set! Created ${result.slotsCount} time slots.`);
      
      setShowForm(false);
      reset();
      await fetchSlots(); // Refresh the list
      
    } catch (error) {
      console.error('❌ Error saving availability:', error);
      toast.error(error.message || 'Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeString = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  if (fetching) {
    return (
      <Card className="border-emerald-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mr-2" />
            <span>Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-emerald-400" />
          Availability Settings
        </CardTitle>
        <CardDescription>
          Set your daily availability for patient appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showForm ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">
                Current Availability
              </h3>
              {slots.length === 0 ? (
                <p className="text-muted-foreground">
                  You haven't set any availability slots yet. Add your
                  availability to start accepting appointments.
                </p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center p-3 rounded-md bg-muted/20 border border-emerald-900/20"
                    >
                      <div className="bg-emerald-900/20 p-2 rounded-full mr-3">
                        <Clock className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {formatTimeString(slot.start_time)} -{" "}
                          {formatTimeString(slot.end_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slot.status} • {format(new Date(slot.start_time), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Set Availability Time
            </Button>
          </>
        ) : (
          <form
            className="space-y-4 p-4 border border-emerald-900/20 rounded-md"
            onSubmit={handleSubmit(onSubmit)}
          >
            <h3 className="text-lg font-medium text-white">Add Availability</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime", {
                    required: "Start time is required",
                  })}
                  className="bg-background border-emerald-900/20"
                />
                {errors.startTime && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime", {
                    required: "End time is required",
                    validate: (value) => {
                      const start = watch("startTime");
                      if (start && value && start >= value) {
                        return "End time must be after start time";
                      }
                      return true;
                    }
                  })}
                  className="bg-background border-emerald-900/20"
                />
                {errors.endTime && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                disabled={loading}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Availability"
                )}
              </Button>
            </div>
          </form>
        )}
        
        <div className="mt-6 p-4 bg-muted/10 border border-emerald-900/10 rounded-md">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-emerald-400" />
            How Availability Works
          </h4>
          <p className="text-muted-foreground text-sm">
            Setting your daily availability allows patients to book appointments
            during those hours. The same availability applies to all days for the next 3 days.
            You can update your availability at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;
