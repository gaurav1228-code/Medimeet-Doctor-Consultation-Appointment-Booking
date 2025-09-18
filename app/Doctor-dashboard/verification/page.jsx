// app/Doctor-dashboard/verification/page.jsx
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, Stethoscope, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserData } from '@/lib/server-actions';
import { redirect } from "next/navigation";

async function VerificationPage() {
  const userData = await getUserData();
  const isRejected = userData?.verification_status === "REJECTED";
  const isPending = userData?.verification_status === "PENDING";
  const isVerified = userData?.verification_status === "VERIFIED";

  // If verified, redirect to dashboard
  if (isVerified) {
    redirect('/Doctor-dashboard');
  }

  return (
    <>
      <div className="container mx-auto px-4 pt-30">
        
        <div className="flex items-end gap-2">
          <div className="text-emerald-400">
            <Stethoscope className="h-12 md:h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gadient-title">
            Doctor Verification
          </h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-emerald-900/20">
            <CardHeader className="text-center">
              <div
                className={`mx-auto p-4 ${
                  isRejected ? "bg-red-900/20" : "bg-amber-900/20"
                } rounded-full mb-4 w-fit`}
              >
                {isRejected ? (
                  <XCircle className="h-8 w-8 text-red-400" />
                ) : (
                  <ClipboardCheck className="h-8 w-8 text-amber-400" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {isRejected
                  ? "Verification Declined"
                  : isPending
                  ? "Verification in Progress"
                  : "Verification Status"}
              </CardTitle>
              <CardDescription className="text-lg">
                {isRejected
                  ? "Unfortunately, your application needs revision"
                  : isPending
                  ? "Thank you for submitting your application"
                  : "Your verification status"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
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
                  : isPending
                  ? "While you wait, you can familiarize yourself with our platform or reach out to our support team if you have any questions."
                  : "Please check back later for your verification status."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isRejected ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-900/30"
                    >
                      <Link href="/">Return to Home</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Link href="/user-profile">Update Profile</Link>
                    </Button>
                  </>
                ) : isPending ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-900/30"
                    >
                      <Link href="/">Return to Home</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Link href="/contact-support">Contact Support</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Link href="/user-profile">Update Profile</Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default VerificationPage;
