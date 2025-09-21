// app/layout.js (Server Component - No user data fetching)
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Medimeet - Doctor Appointment Booking App",
  description: "Connecting Patients with Doctors Seamlessly",
};
export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className}`} suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <header>
              <NavbarWrapper />
            </header>
            <main className="min-h-screen">{children}</main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
