// components/Footer.jsx
'use client';

import Link from "next/link";

export default function Footer() {
  // Placeholder PDF URLs from online
  const policyPDFs = {
    privacy: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    terms: "https://www.africau.edu/images/default/sample.pdf",
    cookies: "https://www.orimi.com/pdf-test.pdf",
    contact: "https://www.clickdimensions.com/links/TestPDFfile.pdf"
  };

  const handlePolicyClick = (policyType) => {
    window.open(policyPDFs[policyType], '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-background border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <img
                  className="h-6 w-6 object-contain filter brightness-0 invert"
                  src="/logo-single.png"
                  alt="Medimeet Logo"
                  width={24}
                  height={24}
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                Medimeet
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md text-sm">
              Connecting patients with qualified healthcare professionals through 
              seamless video consultations and appointment booking. Your health, 
              our priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/footer/how-it-works" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link 
                  href="/footer/faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/footer/about" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/footer/services" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Our Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => handlePolicyClick('privacy')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none text-left p-0"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handlePolicyClick('terms')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none text-left p-0"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handlePolicyClick('cookies')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none text-left p-0"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handlePolicyClick('contact')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none text-left p-0"
                >
                  Contact Information
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Medimeet. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}