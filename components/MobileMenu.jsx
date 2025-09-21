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

  // Prevent hydration mismatch by using useEffect
  React.useEffect(() => {
    // Remove any fdprocessedid attributes that might be added by extensions
    const removeFdProcessedIds = () => {
      document.querySelectorAll('[fdprocessedid]').forEach(el => {
        el.removeAttribute('fdprocessedid');
      });
    };

    removeFdProcessedIds();
    
    // Also remove on any DOM changes
    const observer = new MutationObserver(removeFdProcessedIds);
    observer.observe(document.body, { 
      subtree: true, 
      childList: true, 
      attributes: true,
      attributeFilter: ['fdprocessedid']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full hover:bg-gray-200 h-12 w-12"
          // Add suppressHydrationWarning to prevent mismatch
          suppressHydrationWarning
        >
          <Menu className="h-6 w-6 text-white" strokeWidth={2} />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="absolute right-0 top-14 w-48 mt-2 p-2 space-y-2 rounded-lg border bg-muted shadow-lg animate-in slide-in-from-top-7">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-md hover:bg-blue-50 hover:text-blue-600"
          suppressHydrationWarning
        >
          My Appointments
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-md hover:bg-green-50 hover:text-green-600"
          suppressHydrationWarning
        >
          Medical History
        </Button>
        <Link href="/user-profile" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start rounded-md hover:bg-green-50 hover:text-green-600"
            suppressHydrationWarning
          >
            Edit Profile
          </Button>
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default MobileMenu;
