// components/MobileMenu.jsx
"use client";

import React from "react";
import { Menu } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "./ui/button";
import Link from "next/link";

function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full hover:bg-gray-200 h-12 w-12"
        >
          <Menu className="h-12 w-12 text-white" strokeWidth={3} />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="absolute right-0 top-14 w-48 mt-2 p-2 space-y-2 rounded-lg border bg-muted shadow-lg animate-in slide-in-from-top-7">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-md hover:bg-blue-50 hover:text-blue-600"
        >
          My Appointments
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-md hover:bg-green-50 hover:text-green-600"
        >
          Medical History
        </Button>
        <Link href="/user-profile" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-md hover:bg-green-50 hover:text-green-600"
          >
            Edit Profile
          </Button>
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default MobileMenu;
