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

const AvailabilitySettings = () => {
  const [showForm, setShowForm] = useState(false);
  const [availability, setAvailability] = useState([]);
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
  const fetchAvailability = async () => {
    try {
      setFetching(true);
      console.log("🔄 Fetching availability...");

      const response = await fetch("/api/doctor/availability");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch availability");
      }

      console.log("✅ Availability fetched:", result.availability);
      setAvailability(result.availability || []);
    } catch (error) {
      console.error("❌ Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const onSubmit = async (data) => {
    if (loading) return;

    console.log("🚀 Form submitted:", data);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("startTime", data.startTime);
      formData.append("endTime", data.endTime);

      console.log("📤 Sending to API:", {
        startTime: data.startTime,
        endTime: data.endTime
      });

      const response = await fetch("/api/doctor/availability", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save availability");
      }

      console.log("✅ API response:", result);
      toast.success(
        `Availability set! Created availability for ${result.availability?.length || 0} days.`
      );

      setShowForm(false);
      reset();
      await fetchAvailability(); // Refresh the list
    } catch (error) {
      console.error("❌ Error saving availability:", error);
      toast.error(error.message || "Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return "Invalid time";
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      console.error("Error formatting time:", e);
      return "Invalid time";
    }
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
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
          Set your daily availability for patient appointments (Times shown in IST)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showForm ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">
                Current Availability
              </h3>
              {availability.length === 0 ? (
                <p className="text-muted-foreground">
                  You haven't set any availability yet. Add your availability to start accepting appointments.
                </p>
              ) : (
                <div className="space-y-4">
                  {availability.map((slot) => (
                    <div key={slot.id} className="p-4 border border-emerald-900/20 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-white mb-2">
                            {formatDateDisplay(slot.date)}
                          </h4>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {formatTimeDisplay(slot.start_time)} - {formatTimeDisplay(slot.end_time)}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          slot.status === 'ACTIVE' 
                            ? 'bg-emerald-900/20 text-emerald-400' 
                            : 'bg-gray-900/20 text-gray-400'
                        }`}>
                          {slot.status}
                        </div>
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
            <h3 className="text-lg font-medium text-white">
              Add Availability (IST)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time (IST)</Label>
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
                <Label htmlFor="endTime">End Time (IST)</Label>
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
                    },
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
            • Times are stored and displayed in Indian Standard Time (IST)
            <br />
            • Setting your availability creates slots for the next 3 days
            <br />
            • Patients can book 30-minute appointments during these time slots
            <br />
            • You can update your availability at any time
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;
