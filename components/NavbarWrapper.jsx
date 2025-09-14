// components/NavbarWrapper.jsx (Server Component that fetches data)
import { getUserData } from "@/lib/server-actions";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const userData = await getUserData();
  
  return <Navbar userData={userData} />;
}
