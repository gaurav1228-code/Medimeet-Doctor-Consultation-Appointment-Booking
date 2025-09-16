// app/RoleSelector/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useClientActions } from "@/lib/client-actions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SPECIALTIES } from "@/lib/specialities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const doctorFormSchema = z.object({
  speciality: z.string().min(1, "Speciality is required"),
  experience: z
    .number()
    .min(1, "Experience must be at least 1 year")
    .max(70, "Experience must be less than 70 years"),
  credentialURL: z
    .string()
    .url("Please enter valid URL")
    .min(1, "Credential URL is required"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
});

export default function RoleSelectorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("choose-role");
  const [redirecting, setRedirecting] = useState(false);
  const { user, isLoaded } = useUser();
  const { updateUserRole } = useClientActions();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      speciality: "",
      experience: undefined,
      credentialURL: "",
      description: "",
    },
  });

  const specialityValue = watch("speciality");

  // Check if user already has a role and redirect
  useEffect(() => {
    if (isLoaded && user && !redirecting) {
      const userRole = user.unsafeMetadata?.role;
      
      if (userRole === "PATIENT") {
        setRedirecting(true);
        router.replace("/Patient-dashboard");
      } else if (userRole === "DOCTOR") {
        setRedirecting(true);
        router.replace("/Doctor-dashboard");
      } else if (userRole === "ADMIN") {
        setRedirecting(true);
        router.replace("/admin");
      }
    }
  }, [user, isLoaded, router, redirecting]);

  const handleRoleSelect = async (role) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      console.log("🔄 Starting role selection for:", role);

      // Update Clerk metadata first
      await user.update({
        unsafeMetadata: {
          role: role,
          onboardingCompleted: true,
        },
      });

      console.log("✅ Clerk metadata updated");

      // Then update role using client action
      const result = await updateUserRole(role);

      console.log("📊 Role update result:", result);

      if (result.success) {
        console.log("✅ Role update successful, redirecting...");
        // Use router.replace instead of window.location for smoother navigation
        setRedirecting(true);
        router.replace(role === "PATIENT" ? "/Patient-dashboard" : "/Doctor-dashboard");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error updating role:", error);
      alert("Error updating role. Please try again.");

      // Revert Clerk metadata if update fails
      try {
        await user.update({
          unsafeMetadata: {
            role: "UNASSIGNED",
            onboardingCompleted: false,
          },
        });
      } catch (revertError) {
        console.error("❌ Failed to revert Clerk metadata:", revertError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSubmit = async (data) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      console.log("🔄 Submitting doctor profile:", data);

      // First update Clerk metadata
      await user.update({
        unsafeMetadata: {
          role: "DOCTOR",
          onboardingCompleted: true,
        },
      });

      console.log("✅ Clerk metadata updated");

      // Update Supabase with doctor details
      const response = await fetch("/api/update-doctor-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "DOCTOR",
          specialty: data.speciality,
          experience: data.experience,
          credential_url: data.credentialURL,
          description: data.description,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(
          "Non-JSON response from doctor profile API:",
          text.substring(0, 200)
        );
        throw new Error(
          "Server returned non-JSON response. Please check the API endpoint."
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `Failed to update doctor profile: ${response.status}`
        );
      }

      console.log("✅ Doctor profile updated successfully");

      // Use router.replace for smoother navigation
      setRedirecting(true);
      router.replace("/Doctor-dashboard");
    } catch (error) {
      console.error("❌ Error submitting doctor profile:", error);
      alert("Error submitting doctor profile. Please try again.");

      // Revert Clerk metadata if update fails
      try {
        await user.update({
          unsafeMetadata: {
            role: "UNASSIGNED",
            onboardingCompleted: false,
          },
        });
      } catch (revertError) {
        console.error("❌ Failed to revert Clerk metadata:", revertError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl mb-2 font-bold text-white">
            Welcome to MediMeet
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us how you want to use the platform
          </p>
        </div>

        {step === "choose-role" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all">
              <CardContent className="py-6 flex flex-col items-center text-center">
                <div className="mb-4 p-4 bg-emerald-900/20 rounded-full">
                  <User className="h-8 w-8 text-emerald-400" />
                </div>
                <CardTitle className="mb-2 text-xl font-semibold text-white">
                  Join as a Patient
                </CardTitle>
                <CardDescription className="mb-4">
                  Book appointments, consult with doctors, and manage your
                  healthcare journey
                </CardDescription>
                <Button
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleRoleSelect("PATIENT")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue as a Patient"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all">
              <CardContent className="py-6 flex flex-col items-center text-center">
                <div className="mb-4 p-4 bg-emerald-900/20 rounded-full">
                  <Stethoscope className="h-8 w-8 text-emerald-400" />
                </div>
                <CardTitle className="mb-2 text-xl font-semibold text-white">
                  Join as a Doctor
                </CardTitle>
                <CardDescription className="mb-4">
                  Create your professional profile, set your availability, and
                  provide consultations
                </CardDescription>
                <Button
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setStep("doctor-form")}
                  disabled={isLoading}
                >
                  Continue as a Doctor
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "doctor-form" && (
          <Card className="border-emerald-900/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">
                Complete Your Doctor Profile
              </CardTitle>
              <CardDescription>
                Please provide your professional details for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(handleDoctorSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="speciality">Medical Speciality</Label>
                  <Select
                    value={specialityValue}
                    onValueChange={(value) => setValue("speciality", value)}
                  >
                    <SelectTrigger id="speciality">
                      <SelectValue placeholder="Select your speciality" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((spec, idx) => (
                        <SelectItem key={idx} value={spec.name}>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400">
                              {spec.icon}
                            </span>
                            {spec.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.speciality && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.speciality.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="e.g. 5"
                    {...register("experience", { valueAsNumber: true })}
                  />
                  {errors.experience && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.experience.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credentialURL">
                    Link to Credential Document
                  </Label>
                  <Input
                    id="credentialURL"
                    type="url"
                    placeholder="https://example.com/my-medical-degree.pdf"
                    {...register("credentialURL")}
                  />
                  {errors.credentialURL && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.credentialURL.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Please provide link to your medical degree or certification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description of Your Services
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your expertise, services, and approach to patient care..."
                    rows="4"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("choose-role")}
                    className="border-emerald-900/30"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}