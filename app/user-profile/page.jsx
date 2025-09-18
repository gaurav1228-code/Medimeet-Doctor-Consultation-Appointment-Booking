// app/user-profile/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, CheckCircle, XCircle, User, Shield, FileText, LinkIcon, ExternalLink, Stethoscope, Briefcase, FileText as FileTextIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/specialities";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function UserProfilePage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    date_of_birth: "",
    address: "",
    aadhaar_number: "",
    pan_number: "",
    medical_license_number: "",
    specialty: "",
    experience: "",
    description: ""
  });
  const [documentLinks, setDocumentLinks] = useState({
    aadhaar: "",
    pan: "",
    medical_license: "",
    credential: ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [linkDialogOpen, setLinkDialogOpen] = useState({
    aadhaar: false,
    pan: false,
    medical_license: false,
    credential: false
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single();

      if (error) throw error;

      setUserData(data);
      setFormData({
        phone_number: data.phone_number || "",
        date_of_birth: data.date_of_birth || "",
        address: data.address || "",
        aadhaar_number: data.aadhaar_number || "",
        pan_number: data.pan_number || "",
        medical_license_number: data.medical_license_number || "",
        specialty: data.specialty || "",
        experience: data.experience || "",
        description: data.description || ""
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: "error", text: "Failed to load profile data" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLinkChange = (docType, value) => {
    setDocumentLinks(prev => ({
      ...prev,
      [docType]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const { error } = await supabase
        .from('users')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Profile updated successfully!" });
      fetchUserData(); // Refresh data
    } catch (error) {
      console.log('Error updating profile:', error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDocumentLink = async (docType) => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const link = documentLinks[docType];
      if (!link) {
        setMessage({ type: "error", text: "Please enter a valid link" });
        return;
      }

      // Validate Google Drive link format
      if (!link.includes('drive.google.com')) {
        setMessage({ type: "error", text: "Please provide a valid Google Drive link" });
        return;
      }

      // Convert to direct download link if it's a view link
      let finalLink = link;
      if (link.includes('/file/d/')) {
        const fileId = link.match(/\/file\/d\/([^\/]+)/)?.[1];
        if (fileId) {
          finalLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }

      const newDocument = {
        type: docType,
        url: finalLink,
        uploaded_at: new Date().toISOString(),
        verified: false,
        is_drive_link: true
      };

      const { error } = await supabase
        .from('users')
        .update({
          document_urls: [...(userData.document_urls || []), newDocument],
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Document link added successfully!" });
      setLinkDialogOpen(prev => ({ ...prev, [docType]: false }));
      setDocumentLinks(prev => ({ ...prev, [docType]: "" }));
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Error adding document link:', error);
      setMessage({ type: "error", text: "Failed to add document link" });
    } finally {
      setSaving(false);
    }
  };

  // Check if a field should be disabled (already filled and verified)
  const isFieldDisabled = (fieldName) => {
    if (!userData) return false;
    
    // Doctor-specific fields that should be disabled once set
    const doctorFields = ['specialty', 'experience', 'description', 'medical_license_number'];
    if (doctorFields.includes(fieldName) && userData[fieldName]) {
      return true;
    }
    
    return false;
  };

  // Check if user is a doctor
  const isDoctor = userData?.role === 'DOCTOR';

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">User Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and verification documents</p>
          {userData?.role && (
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-sm">
                Role: {userData.role}
              </span>
              {userData.verification_status && (
                <span className={`inline-block px-3 py-1 ml-2 rounded-full text-sm ${
                  userData.verification_status === 'VERIFIED' 
                    ? 'bg-green-900/30 text-green-400' 
                    : userData.verification_status === 'PENDING'
                    ? 'bg-amber-900/30 text-amber-400'
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  Status: {userData.verification_status}
                </span>
              )}
            </div>
          )}
        </div>

        {message.text && (
          <Alert variant={message.type === "success" ? "default" : "destructive"} className="mb-6">
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
            <CardContent className="space-y-4">
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
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+91 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete address"
                  rows={3}
                />
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Medical Specialty</Label>
                  <Select
                    value={formData.specialty}
                    onValueChange={(value) => handleSelectChange('specialty', value)}
                    disabled={isFieldDisabled('specialty')}
                  >
                    <SelectTrigger id="specialty" className={isFieldDisabled('specialty') ? 'bg-muted' : ''}>
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
                  {isFieldDisabled('specialty') && (
                    <p className="text-xs text-muted-foreground">
                      Specialty cannot be changed after verification
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    disabled={isFieldDisabled('experience')}
                    className={'bg-muted'}
                  />
                
                    <p className="text-xs text-muted-foreground">
                      Experience cannot be changed after verification
                    </p>
                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Professional Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your expertise and approach to patient care..."
                    rows={4}
                    className={"bg-muted"}
                  />
                  {isFieldDisabled('description') && (
                    <p className="text-xs text-muted-foreground">
                      Description cannot be changed after verification
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_license_number">Medical License Number</Label>
                  <Input
                    id="medical_license_number"
                    name="medical_license_number"
                    value={formData.medical_license_number}
                    onChange={handleInputChange}
                    placeholder="Medical license number"
                    disabled={isFieldDisabled('medical_license_number')}
                    className={isFieldDisabled('medical_license_number') ? 'bg-muted' : ''}
                  />
                  {isFieldDisabled('medical_license_number') && (
                    <p className="text-xs text-muted-foreground">
                      License number cannot be changed after verification
                    </p>
                  )}
                </div>

                {/* Credential Document Link */}
                <div className="space-y-2">
                  <Label>Medical Credentials</Label>
                  <Dialog open={linkDialogOpen.credential} onOpenChange={(open) => setLinkDialogOpen(prev => ({ ...prev, credential: open }))}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2 w-full">
                        <FileTextIcon className="h-4 w-4" />
                        {userData.credential_url ? 'Update Credential Document' : 'Add Credential Document'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Medical Credential Document</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Please provide a Google Drive link to your medical degree, certification, or license.
                        </div>
                        <Input
                          placeholder="https://drive.google.com/..."
                          value={documentLinks.credential}
                          onChange={(e) => handleLinkChange('credential', e.target.value)}
                        />
                        <Button 
                          onClick={() => handleAddDocumentLink('credential')}
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Document Link"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {userData.credential_url && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Medical Credentials</p>
                            <p className="text-xs text-muted-foreground">
                              Document uploaded for verification
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(userData.credential_url, '_blank')}
                          className="h-8 w-8 p-0"
                          title="View Document"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Documents */}
          <Card className="border-emerald-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Verification Documents
              </CardTitle>
              <CardDescription>Add Google Drive links for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aadhaar Card */}
              <div className="space-y-3">
                <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                <Input
                  id="aadhaar_number"
                  name="aadhaar_number"
                  value={formData.aadhaar_number}
                  onChange={handleInputChange}
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                />
                
                <Dialog open={linkDialogOpen.aadhaar} onOpenChange={(open) => setLinkDialogOpen(prev => ({ ...prev, aadhaar: open }))}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Add Aadhaar Card Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Aadhaar Card Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="https://drive.google.com/..."
                        value={documentLinks.aadhaar}
                        onChange={(e) => handleLinkChange('aadhaar', e.target.value)}
                      />
                      <Button 
                        onClick={() => handleAddDocumentLink('aadhaar')}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Link"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* PAN Card */}
              <div className="space-y-3">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input
                  id="pan_number"
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleInputChange}
                  placeholder="10-digit PAN number"
                  maxLength={10}
                  className="uppercase"
                />
                
                <Dialog open={linkDialogOpen.pan} onOpenChange={(open) => setLinkDialogOpen(prev => ({ ...prev, pan: open }))}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Add PAN Card Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add PAN Card Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="https://drive.google.com/..."
                        value={documentLinks.pan}
                        onChange={(e) => handleLinkChange('pan', e.target.value)}
                      />
                      <Button 
                        onClick={() => handleAddDocumentLink('pan')}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Link"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

  
              {/* Uploaded Documents List */}
              {userData?.document_urls?.length > 0 && (
                <div className="space-y-3">
                  <Label>Document Links</Label>
                  <div className="space-y-2">
                    {userData.document_urls.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium capitalize">{doc.type}</p>
                            <p className="text-xs text-muted-foreground">
                              Added {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" title="Verified" />
                          ) : (
                            <XCircle className="h-4 w-4 text-yellow-500" title="Pending Verification" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
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
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Verification Status */}
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
                <span>Aadhaar {userData?.aadhaar_verified ? 'Verified' : 'Pending'}</span>
              </div>
              <div className="flex items-center gap-2">
                {userData?.pan_verified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span>PAN {userData?.pan_verified ? 'Verified' : 'Pending'}</span>
              </div>
              {isDoctor && (
                <div className="flex items-center gap-2">
                  {userData?.medical_license_verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span>Medical License {userData?.medical_license_verified ? 'Verified' : 'Pending'}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mt-6 border-blue-900/40 bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-400">How to Share Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload your document to Google Drive</li>
              <li>Right-click on the file and select "Get link"</li>
              <li>Set sharing permissions to "Anyone with the link"</li>
              <li>Copy the link and paste it in the respective dialog</li>
              <li>Our team will verify your documents within 24-48 hours</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
