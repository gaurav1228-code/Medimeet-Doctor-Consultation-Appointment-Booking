// components/Navbar.jsx (Pure Server Component - No async needed)
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
  return (
    <div className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto pl-6 pr-6 h-20 flex justify-between items-center">
        <Link href="/">
          <img
            className="h-10 w-auto object-cover"
            src="/logo-single.png"
            alt="Logo"
            width={200}
            height={60}
          />
        </Link>

        <div className="flex items-center gap-6">
          <SignedIn>
            {userData?.role === "PATIENT" && (
              <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm font-medium text-blue-700">
                  💳 Credits: {userData.credits}
                </span>
              </div>
            )}

            {userData?.role === "PATIENT" && <MobileMenu />}
            {(userData?.role === "DOCTOR" && userData?.verification_status === "VERIFIED") && <MobileMenu />}
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
