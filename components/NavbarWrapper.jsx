// components/NavbarWrapper.jsx (Server Component that fetches data)
import { getUserData } from "@/lib/server-actions";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const userData = await getUserData();
  
  console.log("🔄 NavbarWrapper - User data:", {
    hasUserData: !!userData,
    role: userData?.role,
    name: userData?.name
  });
  
  return <Navbar userData={userData} />;
}