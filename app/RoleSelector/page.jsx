// app/RoleSelector/page.jsx (updated doctor form)
"use client";

import { useState, useEffect } from "react";
import { useClientActions } from "@/lib/client-actions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { handleApiResponse } from "@/lib/api-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, User, FileText, Upload, X } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const doctorFormSchema = z.object({
  speciality: z.string().min(1, "Speciality is required"),
  experience: z
    .number()
    .min(1, "Experience must be at least 1 year")
    .max(70, "Experience must be less than 70 years"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  aadhaar_number: z.string().length(12, "Aadhaar must be 12 digits"),
  pan_number: z.string().length(10, "PAN must be 10 characters"),
  medical_license_number: z.string().min(1, "Medical license number is required"),
  aadhaar_url: z.string().url("Please enter valid Google Drive URL").min(1, "Aadhaar document is required"),
  pan_url: z.string().url("Please enter valid Google Drive URL").min(1, "PAN document is required"),
  medical_license_url: z.string().url("Please enter valid Google Drive URL").min(1, "Medical license document is required"),
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
      description: "",
      aadhaar_number: "",
      pan_number: "",
      medical_license_number: "",
      aadhaar_url: "",
      pan_url: "",
      medical_license_url: "",
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
        router.replace("/Doctor-dashboard/verification");
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

      // Update role using client action
      const result = await updateUserRole(role);

      console.log("📊 Role update result:", result);

      if (result.success) {
        console.log("✅ Role update successful, redirecting...");
        setRedirecting(true);
        router.replace(
          role === "PATIENT" ? "/Patient-dashboard" : "/Doctor-dashboard/verification"
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error updating role:", error);
      alert("Error updating role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSubmit = async (data) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      console.log("🔄 Submitting doctor profile with documents:", data);

      // Prepare document URLs for Supabase
      const documentUrls = [
        {
          type: "aadhaar",
          url: data.aadhaar_url,
          uploaded_at: new Date().toISOString(),
          verified: false,
          is_drive_link: true
        },
        {
          type: "pan",
          url: data.pan_url,
          uploaded_at: new Date().toISOString(),
          verified: false,
          is_drive_link: true
        },
        {
          type: "medical_license",
          url: data.medical_license_url,
          uploaded_at: new Date().toISOString(),
          verified: false,
          is_drive_link: true
        }
      ];

      // Update Supabase with doctor details and documents
      const response = await fetch("/api/update-doctor-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "DOCTOR",
          specialty: data.speciality,
          experience: data.experience,
          description: data.description,
          aadhaar_number: data.aadhaar_number,
          pan_number: data.pan_number,
          medical_license_number: data.medical_license_number,
          document_urls: documentUrls,
          verification_status: "PENDING",
        }),
      });

      const result = await handleApiResponse(response);
      
      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `Failed to update doctor profile: ${response.status}`
        );
      }

      console.log("✅ Doctor profile and documents updated successfully");

      // Update Clerk metadata after successful Supabase update
      await user.update({
        unsafeMetadata: {
          role: "DOCTOR",
          onboardingCompleted: true,
        },
      });

      console.log("✅ Clerk metadata updated");

      // Redirect to verification page
      setRedirecting(true);
      router.replace("/Doctor-dashboard/verification");
    } catch (error) {
      console.error("❌ Error submitting doctor profile:", error);
      alert("Error submitting doctor profile. Please try again.");
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
                Please provide your professional details and upload required documents for verification
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
                  <Label htmlFor="description">Professional Description</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                  <Input
                    id="aadhaar_number"
                    placeholder="12-digit Aadhaar number"
                    {...register("aadhaar_number")}
                  />
                  {errors.aadhaar_number && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.aadhaar_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaar_url">Aadhaar Document (Google Drive Link)</Label>
                  <Input
                    id="aadhaar_url"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    {...register("aadhaar_url")}
                  />
                  {errors.aadhaar_url && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.aadhaar_url.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your Aadhaar card to Google Drive and share the link
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    placeholder="10-digit PAN number"
                    {...register("pan_number")}
                  />
                  {errors.pan_number && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.pan_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pan_url">PAN Document (Google Drive Link)</Label>
                  <Input
                    id="pan_url"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    {...register("pan_url")}
                  />
                  {errors.pan_url && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.pan_url.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your PAN card to Google Drive and share the link
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_license_number">Medical License Number</Label>
                  <Input
                    id="medical_license_number"
                    placeholder="Medical license number"
                    {...register("medical_license_number")}
                  />
                  {errors.medical_license_number && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.medical_license_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_license_url">Medical License Document (Google Drive Link)</Label>
                  <Input
                    id="medical_license_url"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    {...register("medical_license_url")}
                  />
                  {errors.medical_license_url && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {errors.medical_license_url.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload your medical license to Google Drive and share the link
                  </p>
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
