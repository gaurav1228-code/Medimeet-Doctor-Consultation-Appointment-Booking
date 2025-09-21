// components/VerificationStatusCard.jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle, ClipboardCheck, AlertCircle, CheckCircle, FileText } from "lucide-react";

export default function VerificationStatusCard({ 
  verificationStatus, 
  aadhaarVerified, 
  panVerified, 
  medicalLicenseVerified 
}) {
  const isRejected = verificationStatus === "REJECTED";
  const isPending = verificationStatus === "PENDING";
  const isVerified = verificationStatus === "VERIFIED";

  // Check if all documents are verified
  const allDocumentsVerified = aadhaarVerified && panVerified && medicalLicenseVerified;
  const isFullyVerified = isVerified && allDocumentsVerified;

  return (
    <Card className="border-emerald-900/20">
      <CardHeader className="text-center">
        <div className={`mx-auto p-4 ${
          isRejected ? "bg-red-900/20" : 
          isFullyVerified ? "bg-green-900/20" : "bg-amber-900/20"
        } rounded-full mb-4 w-fit`}>
          {isRejected ? (
            <XCircle className="h-8 w-8 text-red-400" />
          ) : isFullyVerified ? (
            <CheckCircle className="h-8 w-8 text-green-400" />
          ) : (
            <ClipboardCheck className="h-8 w-8 text-amber-400" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold text-white">
          {isRejected
            ? "Verification Declined"
            : isFullyVerified
            ? "Verification Complete"
            : isPending
            ? "Verification in Progress"
            : "Verification Status"}
        </CardTitle>
        <CardDescription className="text-lg">
          {isRejected
            ? "Unfortunately, your application needs revision"
            : isFullyVerified
            ? "Congratulations! Your account is fully verified"
            : isPending
            ? "Thank you for submitting your application"
            : "Your verification status"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {/* Document Verification Status */}
        {!isFullyVerified && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Document Verification Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className={`p-3 rounded-lg flex items-center justify-center ${
                aadhaarVerified ? 'bg-green-900/20 border border-green-900/30' : 'bg-amber-900/20 border border-amber-900/30'
              }`}>
                <div className="text-center">
                  <FileText className={`h-5 w-5 mx-auto mb-1 ${aadhaarVerified ? 'text-green-400' : 'text-amber-400'}`} />
                  <span className="text-sm font-medium">Aadhaar</span>
                  <div className="text-xs mt-1">
                    {aadhaarVerified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg flex items-center justify-center ${
                panVerified ? 'bg-green-900/20 border border-green-900/30' : 'bg-amber-900/20 border border-amber-900/30'
              }`}>
                <div className="text-center">
                  <FileText className={`h-5 w-5 mx-auto mb-1 ${panVerified ? 'text-green-400' : 'text-amber-400'}`} />
                  <span className="text-sm font-medium">PAN</span>
                  <div className="text-xs mt-1">
                    {panVerified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg flex items-center justify-center ${
                medicalLicenseVerified ? 'bg-green-900/20 border border-green-900/30' : 'bg-amber-900/20 border border-amber-900/30'
              }`}>
                <div className="text-center">
                  <FileText className={`h-5 w-5 mx-auto mb-1 ${medicalLicenseVerified ? 'text-green-400' : 'text-amber-400'}`} />
                  <span className="text-sm font-medium">Medical License</span>
                  <div className="text-xs mt-1">
                    {medicalLicenseVerified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>
            </div>
            
            {!allDocumentsVerified && (
              <div className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> To complete your verification, please ensure all required documents 
                  (Aadhaar, PAN, and Medical License) are uploaded and verified. Click the "Update Profile" 
                  button below to add your documents.
                </p>
              </div>
            )}
          </div>
        )}

        {isRejected ? (
          <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-muted-foreground text-left">
              <p className="mb-2">
                Our administrative team has reviewed your application and
                found that it doesn&apos;t meet our current requirements. Common reasons for rejection include:
              </p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                <li>Insufficient or unclear credential documentation</li>
                <li>Professional experience requirements not met</li>
                <li>Incomplete or vague service description</li>
                <li>Missing or unverified documents (Aadhaar, PAN, Medical License)</li>
              </ul>
              <p>
                You can update your application with more information and
                resubmit for review.
              </p>
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-amber-900/10 border border-amber-900/20 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground text-left">
              Your profile is currently under review by our administrative
              team. This process typically takes 1-2 business days.
              You&apos;ll receive an email notification once your account
              is verified.
            </p>
          </div>
        ) : null}

        <p className="text-muted-foreground mb-6">
          {isRejected
            ? "You can update your doctor profile and resubmit for verification."
            : isFullyVerified
            ? "You can now access all features of the doctor dashboard."
            : isPending
            ? "While you wait, you can familiarize yourself with our platform or reach out to our support team if you have any questions."
            : "Please check back later for your verification status."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isRejected ? (
            <>
              <Button asChild variant="outline" className="border-emerald-900/30">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/user-profile">Update Profile</Link>
              </Button>
            </>
          ) : isFullyVerified ? (
            <>
              <Button asChild variant="outline" className="border-emerald-900/30">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/Doctor-dashboard">Go to Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="border-emerald-900/30">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/user-profile">Update Profile & Documents</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/contact-support">Contact Support</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
