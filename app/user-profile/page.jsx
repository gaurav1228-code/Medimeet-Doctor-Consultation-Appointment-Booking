// app/user-profile/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  User,
  Shield,
  FileText,
  ExternalLink,
  Stethoscope,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/specialities";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Form validation schemas
const personalInfoSchema = z.object({
  phone_number: z.string().optional(),
  date_of_birth: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Please enter a valid date"
  }),
  address: z.string().optional(),
});

const doctorInfoSchema = z.object({
  specialty: z.string().optional(),
  experience: z.number().optional().nullable(),
  description: z.string().optional(),
  medical_license_number: z.string().optional(),
});

const documentSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  description: z.string().optional(),
  url: z
    .string()
    .url("Please enter a valid Google Drive URL")
    .min(1, "URL is required"),
});

export default function UserProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Personal info form
  const {
    register: registerPersonal,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors },
    getValues: getPersonalValues,
    setValue: setPersonalValue,
    watch: watchPersonal,
  } = useForm({
    resolver: zodResolver(personalInfoSchema),
  });

  // Doctor info form
  const {
    register: registerDoctor,
    handleSubmit: handleDoctorSubmit,
    formState: { errors: doctorErrors },
    setValue: setDoctorValue,
    watch: watchDoctor,
    getValues: getDoctorValues,
  } = useForm({
    resolver: zodResolver(doctorInfoSchema),
  });

  // Document form
  const {
    register: registerDocument,
    handleSubmit: handleDocumentSubmit,
    formState: { errors: documentErrors },
    reset: resetDocument,
  } = useForm({
    resolver: zodResolver(documentSchema),
  });

  // Clean up form attributes
  useEffect(() => {
    const cleanFormAttributes = () => {
      if (typeof window !== "undefined") {
        document.querySelectorAll("[fdprocessedid]").forEach((el) => {
          el.removeAttribute("fdprocessedid");
        });
      }
    };

    cleanFormAttributes();

    const observer = new MutationObserver(cleanFormAttributes);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["fdprocessedid"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_user_id", user.id)
        .single();

      if (error) throw error;

      setUserData(data);
      
      // Pre-fill form values after data is loaded
      if (data) {
        // Personal info
        if (data.phone_number) setPersonalValue("phone_number", data.phone_number);
        if (data.date_of_birth) setPersonalValue("date_of_birth", data.date_of_birth.split('T')[0]); // Format date for input
        if (data.address) setPersonalValue("address", data.address);
        
        // Doctor info
        if (data.specialty) setDoctorValue("specialty", data.specialty);
        if (data.experience) setDoctorValue("experience", data.experience);
        if (data.description) setDoctorValue("description", data.description);
        if (data.medical_license_number) setDoctorValue("medical_license_number", data.medical_license_number);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage({ type: "error", text: "Failed to load profile data" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Get values from both forms
      const personalData = getPersonalValues();
      const doctorData = getDoctorValues();

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that have values
      if (personalData.phone_number) updateData.phone_number = personalData.phone_number;
      if (personalData.date_of_birth) updateData.date_of_birth = personalData.date_of_birth;
      if (personalData.address) updateData.address = personalData.address;

      // Add doctor-specific fields if user is a doctor
      if (isDoctor) {
        if (doctorData.specialty) updateData.specialty = doctorData.specialty;
        if (doctorData.experience) updateData.experience = doctorData.experience;
        if (doctorData.description) updateData.description = doctorData.description;
        if (doctorData.medical_license_number) updateData.medical_license_number = doctorData.medical_license_number;
      }

      // Validate date format before sending
      if (updateData.date_of_birth === "") {
        delete updateData.date_of_birth; // Remove empty date
      }

      console.log("Updating user data:", updateData);

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("clerk_user_id", user.id);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      setMessage({
        type: "success",
        text: "Profile information updated successfully!",
      });
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error("Error updating profile info:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile information: " + (error.message || "Unknown error"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocument = async (data) => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Validate Google Drive link format
      if (!data.url.includes("drive.google.com")) {
        setMessage({
          type: "error",
          text: "Please provide a valid Google Drive link",
        });
        return;
      }

      // Convert to direct download link if it's a view link
      let finalLink = data.url;
      if (data.url.includes("/file/d/")) {
        const fileId = data.url.match(/\/file\/d\/([^\/]+)/)?.[1];
        if (fileId) {
          finalLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }

      const documentToAdd = {
        type: data.type,
        description: data.description || "",
        url: finalLink,
        uploaded_at: new Date().toISOString(),
        verified: false,
        is_drive_link: true,
      };

      const currentDocuments = userData.document_urls || [];
      const updatedDocuments = [...currentDocuments, documentToAdd];

      const { error } = await supabase
        .from("users")
        .update({
          document_urls: updatedDocuments,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Document added successfully!" });
      setLinkDialogOpen(false);
      resetDocument();
      fetchUserData();
    } catch (error) {
      console.error("Error adding document:", error);
      setMessage({ type: "error", text: "Failed to add document" });
    } finally {
      setSaving(false);
    }
  };

  const isFieldDisabled = (fieldName) => {
    if (!userData) return false;

    // Doctor-specific fields that should be disabled once set
    const doctorFields = [
      "specialty",
      "experience",
      "medical_license_number",
    ];
    
    if (doctorFields.includes(fieldName) && userData[fieldName]) {
      return true;
    }

    return false;
  };

  // Check if user is a doctor
  const isDoctor = userData?.role === "DOCTOR";

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">User Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and verification documents
            </p>
            {userData?.role && (
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-sm">
                  Role: {userData.role}
                </span>
                {userData?.role=='DOCTOR' && userData.verification_status && (
                  <span
                    className={`inline-block px-3 py-1 ml-2 rounded-full text-sm ${
                      userData.verification_status === "VERIFIED"
                        ? "bg-green-900/30 text-green-400"
                        : userData.verification_status === "PENDING"
                        ? "bg-amber-900/30 text-amber-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    Status: {userData.verification_status}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSaveAll} 
            disabled={saving} 
            className="bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Changes
          </Button>
        </div>

        {message.text && (
          <Alert
            variant={message.type === "success" ? "default" : "destructive"}
            className="mb-6"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="border-emerald-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.emailAddresses[0]?.emailAddress || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    placeholder="+91 1234567890"
                    defaultValue={userData?.phone_number || ""}
                    {...registerPersonal("phone_number")}
                  />
                  {personalErrors.phone_number && (
                    <p className="text-sm text-red-500">
                      {personalErrors.phone_number.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...registerPersonal("date_of_birth")}
                  />
                  {personalErrors.date_of_birth && (
                    <p className="text-sm text-red-500">
                      {personalErrors.date_of_birth.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your complete address"
                    rows={3}
                    defaultValue={userData?.address || ""}
                    {...registerPersonal("address")}
                  />
                  {personalErrors.address && (
                    <p className="text-sm text-red-500">
                      {personalErrors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Information (only for doctors) */}
          {isDoctor && (
            <Card className="border-emerald-900/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-400" />
                  Professional Information
                </CardTitle>
                <CardDescription>Your medical practice details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Medical Specialty</Label>
                    <Select
                      defaultValue={userData?.specialty || ""}
                      onValueChange={(value) =>
                        setDoctorValue("specialty", value)
                      }
                      disabled={isFieldDisabled("specialty")}
                    >
                      <SelectTrigger
                        id="specialty"
                        className={
                          isFieldDisabled("specialty") ? "bg-muted" : ""
                        }
                      >
                        <SelectValue placeholder="Select your specialty" />
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
                    {isFieldDisabled("specialty") && (
                      <p className="text-xs text-muted-foreground">
                        Specialty cannot be changed
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      placeholder="e.g. 5"
                      defaultValue={userData?.experience || ""}
                      {...registerDoctor("experience", { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === "" ? null : parseInt(value)
                      })}
                      disabled={isFieldDisabled("experience")}
                      className={
                        isFieldDisabled("experience") ? "bg-muted" : ""
                      }
                    />
                    {doctorErrors.experience && (
                      <p className="text-sm text-red-500">
                        {doctorErrors.experience.message}
                      </p>
                    )}
                    {isFieldDisabled("experience") && (
                      <p className="text-xs text-muted-foreground">
                        Experience cannot be changed
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Professional Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your expertise and approach to patient care..."
                      rows={4}
                      defaultValue={userData?.description || ""}
                      {...registerDoctor("description")}
                    />
                    {doctorErrors.description && (
                      <p className="text-sm text-red-500">
                        {doctorErrors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_license_number">
                      Medical License Number
                    </Label>
                    <Input
                      id="medical_license_number"
                      placeholder="Medical license number"
                      defaultValue={userData?.medical_license_number || ""}
                      {...registerDoctor("medical_license_number")}
                      disabled={isFieldDisabled("medical_license_number")}
                      className={
                        isFieldDisabled("medical_license_number")
                          ? "bg-muted"
                          : ""
                      }
                    />
                    {doctorErrors.medical_license_number && (
                      <p className="text-sm text-red-500">
                        {doctorErrors.medical_license_number.message}
                      </p>
                    )}
                    {isFieldDisabled("medical_license_number") && (
                      <p className="text-xs text-muted-foreground">
                        License number cannot be changed
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          <Card className="border-emerald-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Documents
              </CardTitle>
              <CardDescription>
                Manage your verification documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Document Dialog */}
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Document</DialogTitle>
                    <DialogDescription>
                      Upload your document to Google Drive and provide the
                      shareable link
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleDocumentSubmit(handleAddDocument)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="type">Document Type</Label>
                      <Input
                        id="type"
                        placeholder={userData?.role=='PATIENT'?"e.g., Addhar card":"e.g., Medical Degree, Certification, etc."}
                        {...registerDocument("type")}
                      />
                      {documentErrors.type && (
                        <p className="text-sm text-red-500">
                          {documentErrors.type.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of this document..."
                        rows={2}
                        {...registerDocument("description")}
                      />
                      {documentErrors.description && (
                        <p className="text-sm text-red-500">
                          {documentErrors.description.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Google Drive Link</Label>
                      <Input
                        id="url"
                        placeholder="https://drive.google.com/..."
                        {...registerDocument("url")}
                      />
                      {documentErrors.url && (
                        <p className="text-sm text-red-500">
                          {documentErrors.url.message}
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          "Add Document"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Documents List */}
              {userData?.document_urls?.length > 0 ? (
                <div className="space-y-3">
                  <Label>Your Documents</Label>
                  <div className="space-y-2">
                    {userData.document_urls.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {doc.type}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Added{" "}
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.verified ? (
                            <CheckCircle
                              className="h-4 w-4 text-green-500"
                              title="Verified"
                            />
                          ) : (
                            <XCircle
                              className="h-4 w-4 text-yellow-500"
                              title="Pending Verification"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.url, "_blank")}
                            className="h-8 w-8 p-0"
                            title="View Document"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verification Status */}
        {isDoctor && (
          <Card className="mt-6 border-emerald-900/40">
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {userData?.aadhaar_verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span>
                    Aadhaar{" "}
                    {userData?.aadhaar_verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {userData?.pan_verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span>
                    PAN {userData?.pan_verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {userData?.medical_license_verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span>
                    Medical License{" "}
                    {userData?.medical_license_verified
                      ? "Verified"
                      : "Pending"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card className="mt-6 border-blue-900/40 bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-400">
              How to Share Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload your document to Google Drive</li>
              <li>Right-click on the file and select "Get link"</li>
              <li>Set sharing permissions to "Anyone with the link"</li>
              <li>Copy the link and paste it in the form above</li>
              <li>Our team will verify your documents within 24-48 hours</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
