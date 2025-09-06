import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import React from "react";

function Navbar() {
  return (
    <div className="fixed top-0 w-full  border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto pl-16 pr-8 h-20 flex justify-between items-center">
        <Link href="/">
          <img
            className="h-10 w-auto object-cover"
            src="/logo-single.png"
            alt="Logo"
            width={200}
            height={60}
          />
        </Link>
        <div>
          <SignedOut>
            <SignUpButton>
              <button className="bg-muted hover:bg-muted/70 text-white rounded-full font-medium text-md h-10 px-4 shadow-sm hover:shadow transition-all duration-200 cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
