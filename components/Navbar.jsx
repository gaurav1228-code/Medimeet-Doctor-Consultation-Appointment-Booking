// components/Navbar.jsx
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import MobileMenu from "./MobileMenu";
import { Button } from "./ui/button";

export default function Navbar({ userData }) {
  const isVerifiedDoctor =
    userData?.role === "DOCTOR" && userData?.verification_status === "VERIFIED";
  const isPatient = userData?.role === "PATIENT";

  return (
    <div className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto pl-6 pr-6 h-20 flex justify-between items-center">
        {/* Enhanced Logo Section */}
        <Link href="/">
          <div className="flex items-center gap-3 group cursor-pointer">
            {/* Logo Container with Gradient Background */}
            <div className="flex items-center justify-center p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
              <img
                className="h-8 w-8 object-contain filter brightness-0 invert"
                src="/logo-single.png"
                alt="MeetMeet Logo"
                width={32}
                height={32}
              />
            </div>
            
            {/* Brand Name with Better Typography */}
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                MediMeet
              </span>
              <span className="text-xs text-muted-foreground -mt-1 tracking-wider">
                Healthcare Connect
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <SignedIn>
            {/* Show credits for patients */}
            {isPatient && (
              <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm font-medium text-blue-700">
                  💳 Credits: {userData.credits}
                </span>
              </div>
            )}

            {/* Patient menu */}
            {isPatient && <MobileMenu />}

            {/* Doctor buttons side by side */}
            {isVerifiedDoctor && (
              <div className="flex items-center gap-3">
                <Link href="/Doctor-dashboard">
                  <Button
                    variant="ghost"
                    className="rounded-md hover:bg-green-50 hover:text-green-600"
                    suppressHydrationWarning
                  >
                    Home
                  </Button>
                </Link>
                <Link href="/user-profile">
                  <Button
                    variant="ghost"
                    className="rounded-md hover:bg-green-50 hover:text-green-600"
                    suppressHydrationWarning
                  >
                    Edit Profile
                  </Button>
                </Link>
              </div>
            )}

            <UserButton />
          </SignedIn>

          <SignedOut>
            <div className="flex gap-2">
              <SignUpButton mode="redirect" forceRedirectUrl="/RoleSelector">
                <Button
                  variant="outline"
                  className="border-emerald-700/30 text-white hover:bg-muted/80"
                >
                  Sign Up
                </Button>
              </SignUpButton>

              <SignInButton mode="redirect" forceRedirectUrl="/RoleSelector">
                <Button
                  variant="outline"
                  className="border-emerald-700/30 text-white hover:bg-muted/80"
                >
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </nav>
    </div>
  );
}
