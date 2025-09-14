// app/Patient-dashboard/page.jsx (Fixed)
// import 'server-only';
import { getUserData } from '@/lib/server-actions';
import { redirect } from 'next/navigation';
import Pricing from '@/components/Pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Calendar, CreditCard, User } from 'lucide-react';

async function PatientDashboard() {
  const userData = await getUserData();

  console.log("👤 Patient Dashboard - User data:", userData);

  // Redirect if user is not authenticated or not a patient
  if (!userData) {
    console.log("❌ No user data, redirecting to home");
    redirect('/');
  }

  if (userData.role !== 'PATIENT') {
    console.log(`❌ User role is ${userData.role}, redirecting to home`);
    redirect('/');
  }

  return (
    <div className='pt-24 px-6 min-h-screen bg-background'>
      <div className='container mx-auto max-w-6xl'>
        {/* Header Section */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-white mb-2'>
            Welcome back, {userData.name?.split(' ')[0] || 'Patient'}!
          </h1>
          <p className='text-muted-foreground text-lg'>
            Manage your healthcare journey from your dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <Card className='border-emerald-900/40'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center'>
                <CreditCard className='h-4 w-4 mr-2' />
                Available Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-emerald-400'>
                {userData.credits}
              </div>
              <p className='text-xs text-muted-foreground'>
                Each appointment costs 2 credits
              </p>
            </CardContent>
          </Card>

          <Card className='border-emerald-900/40'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center'>
                <Calendar className='h-4 w-4 mr-2' />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-white'>0</div>
              <p className='text-xs text-muted-foreground'>
                No upcoming appointments
              </p>
            </CardContent>
          </Card>

          <Card className='border-emerald-900/40'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center'>
                <User className='h-4 w-4 mr-2' />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant="outline" 
                className="bg-emerald-900/30 border-emerald-700/30 text-emerald-400"
              >
                {userData.verification_status}
              </Badge>
              <p className='text-xs text-muted-foreground mt-2'>
                Account verified and active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className='mb-8'>
          <h2 className='text-2xl font-semibold text-white mb-4'>Quick Actions</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='border-emerald-900/40 hover:border-emerald-800/40 hover:shadow-[0px_4px_20px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer'>
              <CardContent className='p-6 text-center'>
                <Stethoscope className='h-8 w-8 text-emerald-400 mx-auto mb-2' />
                <h3 className='font-semibold text-white mb-1'>Find Doctors</h3>
                <p className='text-sm text-muted-foreground'>Browse available doctors</p>
              </CardContent>
            </Card>

            <Card className='border-emerald-900/40 hover:border-emerald-800/40 hover:shadow-[0px_4px_20px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer'>
              <CardContent className='p-6 text-center'>
                <Calendar className='h-8 w-8 text-emerald-400 mx-auto mb-2' />
                <h3 className='font-semibold text-white mb-1'>Book Appointment</h3>
                <p className='text-sm text-muted-foreground'>Schedule a consultation</p>
              </CardContent>
            </Card>

            <Card className='border-emerald-900/40 hover:border-emerald-800/40 hover:shadow-[0px_4px_20px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer'>
              <CardContent className='p-6 text-center'>
                <User className='h-8 w-8 text-emerald-400 mx-auto mb-2' />
                <h3 className='font-semibold text-white mb-1'>Medical History</h3>
                <p className='text-sm text-muted-foreground'>View past consultations</p>
              </CardContent>
            </Card>

            <Card className='border-emerald-900/40 hover:border-emerald-800/40 hover:shadow-[0px_4px_20px_rgba(16,185,129,0.2)] transition-all duration-300 cursor-pointer'>
              <CardContent className='p-6 text-center'>
                <CreditCard className='h-8 w-8 text-emerald-400 mx-auto mb-2' />
                <h3 className='font-semibold text-white mb-1'>Buy Credits</h3>
                <p className='text-sm text-muted-foreground'>Purchase consultation credits</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className='mb-8'>
          <h2 className='text-2xl font-semibold text-white mb-4'>Recent Activity</h2>
          <Card className='border-emerald-900/40'>
            <CardContent className='p-6'>
              <div className='text-center py-8'>
                <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-white mb-2'>No recent activity</h3>
                <p className='text-muted-foreground mb-4'>
                  Your appointments and consultations will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credits Running Low Warning */}
        {userData.credits < 4 && (
          <Card className='mb-8 border-orange-900/40 bg-orange-950/20'>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <CreditCard className='h-6 w-6 text-orange-400 mr-3' />
                <div>
                  <h3 className='font-semibold text-orange-400'>Credits Running Low</h3>
                  <p className='text-sm text-muted-foreground'>
                    You have {userData.credits} credits remaining. Consider purchasing more to continue booking appointments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Section */}
        <div className='mb-8'>
          <h2 className='text-2xl font-semibold text-white mb-4'>Subscription Plans</h2>
          <Pricing />
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
