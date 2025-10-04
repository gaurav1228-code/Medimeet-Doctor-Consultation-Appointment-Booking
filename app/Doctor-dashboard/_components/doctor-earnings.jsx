// app/Doctor-dashboard/_components/doctor-earnings.jsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Loader2,
  AlertCircle,
  Coins,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { getDoctorEarnings } from "@/lib/actions/doctor-earnings";
import { requestPayout } from "@/lib/actions/payout";

export function DoctorEarnings() {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [earningsData, setEarningsData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom hook for payout request
  const { loading: payoutLoading, data: payoutData, fn: submitPayoutRequest } = useFetch(requestPayout);

  // Fetch earnings and payouts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch earnings data
        const earningsResponse = await getDoctorEarnings();
        if (earningsResponse.success) {
          setEarningsData(earningsResponse.earnings);
          setPayouts(earningsResponse.payouts || []);
        } else {
          toast.error("Failed to load earnings data");
        }
      } catch (error) {
        console.error("Error fetching earnings data:", error);
        toast.error("Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle payout request
  const handlePayoutRequest = async (e) => {
    e.preventDefault();

    if (!paypalEmail) {
      toast.error("PayPal email is required");
      return;
    }

    const formData = new FormData();
    formData.append("paypalEmail", paypalEmail);

    await submitPayoutRequest(formData);
  };

  // Handle successful payout request
  useEffect(() => {
    if (payoutData?.success) {
      setShowPayoutDialog(false);
      setPaypalEmail("");
      toast.success("Payout request submitted successfully!");
      
      // Refresh earnings data
      const refreshData = async () => {
        const earningsResponse = await getDoctorEarnings();
        if (earningsResponse.success) {
          setEarningsData(earningsResponse.earnings);
          setPayouts(earningsResponse.payouts || []);
        }
      };
      refreshData();
    }
  }, [payoutData]);

  // Use default values if data is still loading
  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    averageEarningsPerMonth = 0,
    availableCredits = 0,
    availablePayout = 0,
  } = earningsData || {};

  const platformFee = availableCredits * 2; // $2 per credit
  const pendingPayout = payouts.find(payout => payout.status === "PENDING");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="border-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-muted/20 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-muted/20 rounded w-16"></div>
                  </div>
                  <div className="bg-muted/20 rounded-full p-3">
                    <div className="h-6 w-6 bg-muted/30 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mr-2" />
              <span>Loading earnings data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Available Credits
                </p>
                <p className="text-3xl font-bold text-white">
                  {availableCredits}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${availablePayout.toFixed(2)} available for payout
                </p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <Coins className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold text-white">
                  ${thisMonthEarnings.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Appointments
                </p>
                <p className="text-3xl font-bold text-white">
                  {completedAppointments}
                </p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg/Month</p>
                <p className="text-3xl font-bold text-white">
                  ${averageEarningsPerMonth.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-900/20 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
            Payout Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Payout Status */}
          <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">
                Available for Payout
              </h3>
              {pendingPayout ? (
                <Badge
                  variant="outline"
                  className="bg-amber-900/20 border-amber-900/30 text-amber-400"
                >
                  PENDING
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                >
                  Available
                </Badge>
              )}
            </div>

            {pendingPayout ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pending Credits</p>
                    <p className="text-white font-medium">
                      {pendingPayout.credits}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending Amount</p>
                    <p className="text-white font-medium">
                      ${pendingPayout.net_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PayPal Email</p>
                    <p className="text-white font-medium text-xs">
                      {pendingPayout.paypal_email}
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your payout request is pending approval. You'll receive the
                    payment once an admin approves it.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Available Credits</p>
                  <p className="text-white font-medium">{availableCredits}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payout Amount</p>
                  <p className="text-white font-medium">
                    ${availablePayout.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Platform Fee</p>
                  <p className="text-white font-medium">
                    ${platformFee.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {!pendingPayout && availableCredits > 0 && (
              <Button
                onClick={() => setShowPayoutDialog(true)}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Request Payout for All Credits
              </Button>
            )}

            {availableCredits === 0 && !pendingPayout && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No credits available for payout. Complete more appointments to
                  earn credits.
                </p>
              </div>
            )}
          </div>

          {/* Payout Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Payout Structure:</strong> You earn $8 per credit.
              Platform fee is $2 per credit. Payouts include all your available
              credits and are processed via PayPal.
            </AlertDescription>
          </Alert>

          {/* Payout History */}
          {payouts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Payout History</h3>
              <div className="space-y-2">
                {payouts.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/10 border border-emerald-900/10"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {format(new Date(payout.created_at), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payout.credits} credits • $
                        {payout.net_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.paypal_email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        payout.status === "APPROVED"
                          ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                          : payout.status === "PENDING"
                          ? "bg-amber-900/20 border-amber-900/30 text-amber-400"
                          : "bg-red-900/20 border-red-900/30 text-red-400"
                      }
                    >
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Request Payout
            </DialogTitle>
            <DialogDescription>
              Request payout for all your available credits
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Available credits:
                </span>
                <span className="text-white">{availableCredits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross amount:</span>
                <span className="text-white">
                  ${(availableCredits * 10).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Platform fee (20%):
                </span>
                <span className="text-white">-${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-emerald-900/20 pt-2 flex justify-between font-medium">
                <span className="text-white">Net payout:</span>
                <span className="text-emerald-400">
                  ${availablePayout.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your-email@paypal.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="bg-background border-emerald-900/20"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the PayPal email where you want to receive the payout.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Once processed by admin, {availableCredits} credits will be
                deducted from your account and ${availablePayout.toFixed(2)}{" "}
                will be sent to your PayPal.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayoutDialog(false)}
                disabled={payoutLoading}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={payoutLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {payoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Request Payout"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
