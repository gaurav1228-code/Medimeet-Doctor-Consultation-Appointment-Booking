// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import NavbarWrapper from "@/components/NavbarWrapper";
import { Toaster } from "sonner";
import HMSProviderWrapper from "@/components/HMSProviderWrapper";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Medimeet - Doctor Appointment Booking App",
  description: "Connecting Patients with Doctors Seamlessly",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider 
      appearance={{ baseTheme: dark }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/RoleSelector"
      signUpFallbackRedirectUrl="/RoleSelector"
      signInForceRedirectUrl="/RoleSelector"
      signUpForceRedirectUrl="/RoleSelector"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <HMSProviderWrapper>
              <Toaster />
              <header>
                <NavbarWrapper />
              </header>
              <main className="min-h-screen">{children}</main>
              <footer>
                <Footer/>
              </footer>
            </HMSProviderWrapper>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
