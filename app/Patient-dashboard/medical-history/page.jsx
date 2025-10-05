// app/Patient-dashboard/medical-history/page.jsx - UPDATED
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
  Plus,
  FileText,
  ExternalLink,
  Calendar,
  Download,
  Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { 
  getMedicalDocuments, 
  addMedicalDocument, 
  deleteMedicalDocument 
} from "@/lib/actions/medical-history";

const DOCUMENT_TYPES = [
  { value: "prescription", label: "Prescription" },
  { value: "lab_report", label: "Lab Report" },
  { value: "medical_record", label: "Medical Record" },
  { value: "scan", label: "Scan/Imaging" },
  { value: "vaccination", label: "Vaccination Record" },
  { value: "insurance", label: "Insurance Document" },
  { value: "other", label: "Other" },
];

export default function MedicalHistoryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    document_type: "",
    google_drive_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchMedicalDocuments();
    }
  }, [user]);

  const fetchMedicalDocuments = async () => {
    try {
      setLoading(true);
      const result = await getMedicalDocuments();
      
      if (result.success) {
        setDocuments(result.documents || []);
      } else {
        setMessage({ type: "error", text: result.error || "Failed to load medical documents" });
      }
    } catch (error) {
      console.error("Error fetching medical documents:", error);
      setMessage({ type: "error", text: "Failed to load medical documents" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Validate form
      if (!formData.title || !formData.document_type || !formData.google_drive_url) {
        setMessage({ type: "error", text: "Please fill in all required fields" });
        return;
      }

      // Validate Google Drive URL
      if (!formData.google_drive_url.includes("drive.google.com")) {
        setMessage({ type: "error", text: "Please provide a valid Google Drive URL" });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("document_type", formData.document_type);
      formDataToSend.append("google_drive_url", formData.google_drive_url);

      const result = await addMedicalDocument(formDataToSend);

      if (result.success) {
        setMessage({ type: "success", text: "Medical document added successfully!" });
        setDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          document_type: "",
          google_drive_url: "",
        });
        fetchMedicalDocuments();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to add medical document" });
      }
    } catch (error) {
      console.error("Error adding medical document:", error);
      setMessage({ type: "error", text: "Failed to add medical document" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const result = await deleteMedicalDocument(documentId);

      if (result.success) {
        setMessage({ type: "success", text: "Document deleted successfully!" });
        fetchMedicalDocuments();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setMessage({ type: "error", text: "Failed to delete document" });
    }
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      prescription: "bg-blue-900/20 text-blue-400",
      lab_report: "bg-green-900/20 text-green-400",
      medical_record: "bg-purple-900/20 text-purple-400",
      scan: "bg-orange-900/20 text-orange-400",
      vaccination: "bg-emerald-900/20 text-emerald-400",
      insurance: "bg-amber-900/20 text-amber-400",
      other: "bg-gray-900/20 text-gray-400",
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Medical History</h1>
            <p className="text-muted-foreground">
              Manage your medical documents and health records
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medical Document</DialogTitle>
                <DialogDescription>
                  Upload your medical document to Google Drive and provide the link
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDocument} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Blood Test Report, X-Ray Scan"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => handleInputChange("document_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this document..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_drive_url">Google Drive Link *</Label>
                  <Input
                    id="google_drive_url"
                    placeholder="https://drive.google.com/..."
                    value={formData.google_drive_url}
                    onChange={(e) => handleInputChange("google_drive_url", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure the file is shared with "Anyone with the link" permission
                  </p>
                </div>

                {message.text && (
                  <Alert variant={message.type === "success" ? "default" : "destructive"}>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
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
        </div>

        {message.text && (
          <Alert
            variant={message.type === "success" ? "default" : "destructive"}
            className="mb-6"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Documents Grid */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="border-emerald-900/20 hover:border-emerald-700/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-white line-clamp-2">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className={getDocumentTypeColor(doc.document_type)}>
                          {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Uploaded {format(new Date(doc.upload_date), "MMM d, yyyy")}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-emerald-900/30"
                      onClick={() => window.open(doc.google_drive_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-emerald-900/20">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2">
                No Medical Documents
              </h3>
              <p className="text-muted-foreground mb-6">
                Start by adding your medical documents to build your health history
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card className="mt-8 border-blue-900/40 bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-400">
              How to Add Medical Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload your medical document to Google Drive</li>
              <li>Right-click on the file and select "Get link"</li>
              <li>Set sharing permissions to "Anyone with the link"</li>
              <li>Copy the link and paste it in the form above</li>
              <li>Doctors will be able to view these documents during your appointments</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Your medical documents are automatically shared with doctors 
                during your appointments to help them provide better care.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}