// app/admin-dashboard/components/patients.jsx
"use client";
import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, User, Eye, CreditCard, MapPin, Calendar, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

// Reusable User Card Component
function UserCard({ user, onViewDetails, type = "patient" }) {
  
  
  return (
    <Card className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted/20 rounded-full p-2">
              <User className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">{user.name}</h3>
              <p className="text-sm text-muted-foreground">
                
                  `Patient • ${user.credits || 0} credits`
                
              </p>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Joined: {format(new Date(user.created_at), "PPP")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                
                  "bg-blue-900/20 border-blue-900/30 text-blue-400"
              }
            >
                Patient
              
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(user)}
              className="border-emerald-900/30 hover:bg-muted/80"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Patient Details Dialog Component
function PatientDetailsDialog({ patient, open, onOpenChange }) {
  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Patient Details
          </DialogTitle>
          <DialogDescription>
            View patient information and account details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <h4 className="text-sm font-medium">Full Name</h4>
              </div>
              <p className="text-white text-lg font-medium">{patient.name}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <h4 className="text-sm font-medium">Email</h4>
              </div>
              <p className="text-white">{patient.email}</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <h4 className="text-sm font-medium">Available Credits</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-400">{patient.credits || 0}</span>
                <Badge variant="outline" className="bg-blue-900/20 text-blue-400">
                  Active
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <h4 className="text-sm font-medium">Member Since</h4>
              </div>
              <p className="text-white">
                {format(new Date(patient.created_at), "MMMM do, yyyy")}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Phone Number</span>
                </div>
                <p className="text-white">{patient.phone_number || "Not provided"}</p>
              </div>
              
              {patient.date_of_birth && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Date of Birth</span>
                  </div>
                  <p className="text-white">
                    {format(new Date(patient.date_of_birth), "PPP")}
                  </p>
                </div>
              )}
            </div>
            
            {patient.address && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Address</span>
                </div>
                <p className="text-white">{patient.address}</p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Account Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-400">{patient.credits || 0}</div>
                <div className="text-xs text-muted-foreground">Credits</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-xs text-muted-foreground">Appointments</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-2xl font-bold text-amber-400">0</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>

          
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Patients Component
export function Patients({ patients: initialPatients }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewMode, setViewMode] = useState("compact"); // "grid" or "compact"

  // Filter patients based on search term
  const filteredPatients = initialPatients.filter((patient) => {
    const query = searchTerm.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone_number?.toLowerCase().includes(query) ||
      patient.address?.toLowerCase().includes(query)
    );
  });

  // Sort patients by join date (newest first)
  const sortedPatients = [...filteredPatients].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
  };

  // Statistics
  const totalPatients = initialPatients.length;
  const patientsWithCredits = initialPatients.filter(p => p.credits > 0).length;
  const patientsWithPhone = initialPatients.filter(p => p.phone_number).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-900/20 border-blue-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Total Patients</p>
                <p className="text-2xl font-bold text-white">{totalPatients}</p>
              </div>
              <User className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-900/20 border-emerald-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">With Credits</p>
                <p className="text-2xl font-bold text-white">{patientsWithCredits}</p>
              </div>
              <CreditCard className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        
      </div>

      {/* Main Patients Card */}
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Patient Management
              </CardTitle>
              <CardDescription>
                Manage all registered patients ({totalPatients} total)
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-8 bg-background border-emerald-900/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {sortedPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? "No patients found" : "No patients registered"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Patients will appear here once they register"
                }
              </p>
            </div>
          ) : viewMode === "compact" ? (
            // Compact View
            <div className="space-y-2">
              {sortedPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-900/20 rounded-full p-2">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-900/20 text-blue-400">
                      {patient.credits || 0} credits
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Detailed Grid View
            <div className="space-y-4">
              {sortedPatients.map((patient) => (
                <UserCard
                  key={patient.id}
                  user={patient}
                  type="patient"
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}

          {/* Search Results Info */}
          {searchTerm && sortedPatients.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {sortedPatients.length} of {totalPatients} patients matching "{searchTerm}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={!!selectedPatient}
        onOpenChange={() => setSelectedPatient(null)}
      />
    </div>
  );
}

// Export default for easier imports
export default Patients;
