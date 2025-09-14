// components/Navbar.jsx (Pure Server Component - No async needed)
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import RoleSelector from "./RoleSelector";
import MobileMenu from "./MobileMenu";

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
            {userData?.role === 'UNASSIGNED' && <RoleSelector />}
            
            {userData?.role === 'PATIENT' && (
              <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm font-medium text-blue-700">
                  💳 Credits: {userData.credits}
                </span>
              </div>
            )}

            {userData?.role === 'PATIENT' && <MobileMenu />}
            <UserButton />
          </SignedIn>

          <SignedOut>
            <div className="flex gap-2">
              <SignUpButton mode="redirect" forceRedirectUrl="/">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  Sign Up
                </button>
              </SignUpButton>

              <SignInButton mode="redirect" forceRedirectUrl="/">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </nav>
    </div>
  );
}
