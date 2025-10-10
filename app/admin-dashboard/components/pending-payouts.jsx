// app/admin-dashboard/components/pending-payouts.jsx - UPDATED
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  User,
  DollarSign,
  Mail,
  Stethoscope,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import { approvePayout, getPendingPayouts } from "@/lib/actions/admin";

export function PendingPayouts({ payouts: initialPayouts }) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh payouts data
  const refreshPayouts = async () => {
    setIsRefreshing(true);
    try {
      const result = await getPendingPayouts();
      if (result.success) {
        setPayouts(result.payouts || []);
        toast.success("Payouts refreshed");
      } else {
        toast.error("Failed to refresh payouts");
      }
    } catch (error) {
      console.error("Error refreshing payouts:", error);
      toast.error("Error refreshing payouts");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setPayouts(initialPayouts);
  }, [initialPayouts]);

  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
  };

  const handleApprovePayout = (payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedPayout || isApproving) return;

    setIsApproving(true);
    
    try {
      const formData = new FormData();
      formData.append("payoutId", selectedPayout.id);

      const result = await approvePayout(formData);

      if (result.success) {
        toast.success(result.message || "Payout approved successfully!");
        
        // Remove the approved payout from the local state
        setPayouts(prev => prev.filter(p => p.id !== selectedPayout.id));
        
        // Close dialogs
        setShowApproveDialog(false);
        setSelectedPayout(null);
        
      } else {
        toast.error(`Failed to approve payout: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving payout:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsApproving(false);
    }
  };

  const closeDialogs = () => {
    if (!isApproving) {
      setSelectedPayout(null);
      setShowApproveDialog(false);
    }
  };

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Pending Payouts
              </CardTitle>
              <CardDescription>
                Review and approve doctor payout requests
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPayouts}
              disabled={isRefreshing}
              className="border-emerald-900/30"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending payout requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted/20 rounded-full p-2 mt-1">
                          <User className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">
                            Dr. {payout.doctor.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {payout.doctor.specialty}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-emerald-400" />
                              <span>
                                {payout.credits} credits • $
                                {payout.net_amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-emerald-400" />
                              <span className="text-xs">
                                {payout.paypal_email}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested{" "}
                            {format(new Date(payout.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 self-end lg:self-center">
                        <Badge
                          variant="outline"
                          className="bg-amber-900/20 border-amber-900/30 text-amber-400 w-fit"
                        >
                          Pending
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(payout)}
                            disabled={isApproving}
                            className="border-emerald-900/30 hover:bg-muted/80"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayout(payout)}
                            disabled={isApproving}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Details Dialog */}
      {selectedPayout && !showApproveDialog && (
        <Dialog open={!!selectedPayout} onOpenChange={closeDialogs}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Payout Request Details
              </DialogTitle>
              <DialogDescription>
                Review the payout request information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Doctor Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Doctor Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-white">
                      Dr. {selectedPayout.doctor.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-white">{selectedPayout.doctor.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Specialty
                    </p>
                    <p className="text-white">
                      {selectedPayout.doctor.specialty}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Current Credits
                    </p>
                    <p className="text-white">
                      {selectedPayout.doctor.credits}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Payout Details</h3>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Credits to pay out:
                    </span>
                    <span className="text-white font-medium">
                      {selectedPayout.credits}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Gross amount (10 USD/credit):
                    </span>
                    <span className="text-white">
                      ${selectedPayout.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Platform fee (2 USD/credit):
                    </span>
                    <span className="text-white">
                      ${selectedPayout.platform_fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-emerald-900/20 pt-3 flex justify-between font-medium">
                    <span className="text-white">Net payout:</span>
                    <span className="text-emerald-400">
                      ${selectedPayout.net_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-emerald-900/20 pt-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      PayPal Email
                    </p>
                    <p className="text-white">{selectedPayout.paypal_email}</p>
                  </div>
                </div>
              </div>

              {/* Warning if insufficient credits */}
              {selectedPayout.doctor.credits < selectedPayout.credits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Doctor currently has only{" "}
                    {selectedPayout.doctor.credits} credits but this payout
                    requires {selectedPayout.credits} credits. The payout cannot
                    be processed.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDialogs}
                disabled={isApproving}
                className="border-emerald-900/30"
              >
                Close
              </Button>
              <Button
                onClick={() => handleApprovePayout(selectedPayout)}
                disabled={
                  selectedPayout.doctor.credits < selectedPayout.credits ||
                  isApproving
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Approve Payout
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Confirmation Dialog */}
      {showApproveDialog && selectedPayout && (
        <Dialog
          open={showApproveDialog}
          onOpenChange={(open) => {
            if (!open && !isApproving) {
              setShowApproveDialog(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Confirm Payout Approval
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this payout?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action will:
                  <ul className="mt-2 space-y-1 list-disc pl-4">
                    <li>
                      Deduct {selectedPayout.credits} credits from Dr.{" "}
                      {selectedPayout.doctor.name}'s account
                    </li>
                    <li>Mark the payout as APPROVED</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="text-white">
                    Dr. {selectedPayout.doctor.name}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Credits to deduct:</span>
                  <span className="text-white font-medium">
                    {selectedPayout.credits} credits
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount to pay:</span>
                  <span className="text-emerald-400 font-medium">
                    ${selectedPayout.net_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PayPal:</span>
                  <span className="text-white text-sm">
                    {selectedPayout.paypal_email}
                  </span>
                </div>
              </div>
            </div>

            {isApproving && <BarLoader width={"100%"} color="#36d7b7" />}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={isApproving}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={isApproving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}