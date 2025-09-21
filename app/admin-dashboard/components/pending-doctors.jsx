// app/admin-dashboard/components/pending-doctors.jsx
"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { User, FileText, ExternalLink, Check, X, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
const PendingDoctors = ({ doctors }) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseDialog = () => {
    setSelectedDoctor(null);
  };

 
const handleUpdateStatus = async (doctorId, status) => {
  if (loading) return;
  
  setLoading(true);
  try {
    const response = await fetch('/api/admin/verify-doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ doctorId, status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      window.location.reload();
    } else {
      console.error('Failed to update status:', result.error);
      alert('Failed to update status: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Error updating status: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleVerifyDocument = async (doctorId, documentType) => {
  if (loading) return;
  
  setLoading(true);
  try {
    const response = await fetch('/api/admin/verify-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ doctorId, documentType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const updatedDoctor = { ...selectedDoctor };
      updatedDoctor[`${documentType}_verified`] = true;
      setSelectedDoctor(updatedDoctor);
    } else {
      console.error('Failed to verify document:', result.error);
      alert('Failed to verify document: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error verifying document:', error);
    alert('Error verifying document: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            Pending Doctor Verification
          </CardTitle>
          <CardDescription>
            Review and approve doctor applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending verification requests
            </div>
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="bg-background border-emerald-900/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted/20 rounded-full">
                          <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {doctor.specialty} • {doctor.experience} years experience
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-amber-900/20 border-amber-900/30 text-amber-400"
                        >
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(doctor)}
                          className="border-emerald-900/30 hover:bg-muted/80"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDoctor && (
        <Dialog open={!!selectedDoctor} onOpenChange={handleCloseDialog}>
          <DialogContent className="!w-[90vw] !max-w-6xl max-h-[100vh] overflow-y-auto">
  
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Doctor Verification Details
              </DialogTitle>
              <DialogDescription>
                Review the doctor's information and documents
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                  <p className="text-base font-medium text-white">{selectedDoctor.name}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="text-base font-medium text-white">{selectedDoctor.email}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Application Date</h4>
                  <p className="text-base font-medium text-white">
                    {format(new Date(selectedDoctor.created_at), "PPP")}
                  </p>
                </div>
              </div>

              <Separator className="bg-emerald-900/20" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Professional Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Specialty</h4>
                    <p className="text-white">{selectedDoctor.specialty}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Experience</h4>
                    <p className="text-white">{selectedDoctor.experience} years</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="text-white whitespace-pre-line">{selectedDoctor.description}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-emerald-900/20" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Document Verification</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['aadhaar', 'pan', 'medical_license'].map((docType) => (
                    <div key={docType} className={`p-4 rounded-lg border ${
                      selectedDoctor[`${docType}_verified`] 
                        ? 'bg-green-900/20 border-green-900/30' 
                        : 'bg-amber-900/20 border-amber-900/30'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-white capitalize">{docType.replace('_', ' ')}</h4>
                        {selectedDoctor[`${docType}_verified`] ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Number: {selectedDoctor[`${docType}_number`]}
                      </p>
                      {selectedDoctor.document_urls && (
                        <div className="mb-3">
                          <a
                            href={selectedDoctor.document_urls.find(doc => doc.type === docType)?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center"
                          >
                            View Document <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                      {!selectedDoctor[`${docType}_verified`] && (
                        <Button
                          size="sm"
                          onClick={() => handleVerifyDocument(selectedDoctor.id, docType)}
                          disabled={loading}
                          className="w-full"
                        >
                          Verify {docType.replace('_', ' ')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {loading && <BarLoader width={"100%"} color="#36d7b7" />}
          
            <DialogFooter className="flex sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus(selectedDoctor.id, "REJECTED")}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleUpdateStatus(selectedDoctor.id, "VERIFIED")}
                disabled={loading || !(
                  selectedDoctor.aadhaar_verified && 
                  selectedDoctor.pan_verified && 
                  selectedDoctor.medical_license_verified
                )}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve Doctor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PendingDoctors;