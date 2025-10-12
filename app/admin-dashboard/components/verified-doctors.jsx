// app/admin-dashboard/components/verified-doctors.jsx
"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Ban, Loader2, User, Search, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
export function VerifiedDoctors({ doctors: initialDoctors }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState(initialDoctors);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetDoctor, setTargetDoctor] = useState(null);

  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchTerm.toLowerCase();
    return (
      doctor.name?.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query)
    );
  });

  const handleStatusChange = async (doctor, suspend) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${suspend ? "suspend" : "reinstate"} ${
        doctor.name
      }?`
    );
    if (!confirmed || loading) return;

    setTargetDoctor(doctor);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/update-doctor-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          suspend: suspend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        setDoctors(
          doctors.map((d) =>
            d.id === doctor.id
              ? { ...d, verification_status: suspend ? "REJECTED" : "VERIFIED" }
              : d
          )
        );
      } else {
        console.error("Failed to update status:", result.error);
        alert("Failed to update status: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating doctor status:", error);
      alert("Error updating status: " + error.message);
    } finally {
      setLoading(false);
      setTargetDoctor(null);
    }
  };

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Manage Doctors
              </CardTitle>
              <CardDescription>
                View and manage all verified doctors
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                className="pl-8 bg-background border-emerald-900/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No doctors match your search."
                : "No doctors available."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => {
                const isSuspended = doctor.verification_status === "REJECTED";
                return (
                  <Card
                    key={doctor.id}
                    className="bg-background border-emerald-900/20"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted/20 rounded-full p-2">
                            <User className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">
                              {doctor.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.specialty} • {doctor.experience} years
                              experience
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {doctor.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined:{" "}
                              {format(new Date(doctor.created_at), "PPP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSuspended ? (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-red-900/20 border-red-900/30 text-red-400"
                              >
                                Suspended
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(doctor)}
                                className="border-emerald-900/30 hover:bg-muted/80"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(doctor, false)
                                }
                                disabled={loading}
                                className="border-emerald-900/30 hover:bg-muted/80"
                              >
                                {loading && targetDoctor?.id === doctor.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Reinstate
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                              >
                                Active
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(doctor)}
                                className="border-emerald-900/30 hover:bg-muted/80"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(doctor, true)}
                                disabled={loading}
                                className="border-red-900/30 hover:bg-red-900/10 text-red-400"
                              >
                                {loading && targetDoctor?.id === doctor.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4 mr-1" />
                                )}
                                Suspend
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDoctor && (
        <Dialog
          open={!!selectedDoctor}
          onOpenChange={() => setSelectedDoctor(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Doctor Details
              </DialogTitle>
              <DialogDescription>
                View doctor information and verification status
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Name
                  </h4>
                  <p className="text-white">{selectedDoctor.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Email
                  </h4>
                  <p className="text-white">{selectedDoctor.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Specialty
                  </h4>
                  <p className="text-white">{selectedDoctor.specialty}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Experience
                  </h4>
                  <p className="text-white">
                    {selectedDoctor.experience} years
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <Badge
                  variant="outline"
                  className={
                    selectedDoctor.verification_status === "VERIFIED"
                      ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                      : "bg-red-900/20 border-red-900/30 text-red-400"
                  }
                >
                  {selectedDoctor.verification_status}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Document Verification
                </h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["aadhaar", "pan", "medical_license"].map((docType) => (
                    <div
                      key={docType}
                      className={`text-center p-2 rounded ${
                        selectedDoctor[`${docType}_verified`]
                          ? "bg-green-900/20"
                          : "bg-amber-900/20"
                      }`}
                    >
                      <span className="text-xs capitalize">
                        {docType.replace("_", " ")}
                      </span>
                      <br />
                      <span className="text-sm">
                        {selectedDoctor[`${docType}_verified`]
                          ? "✓"
                          : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
