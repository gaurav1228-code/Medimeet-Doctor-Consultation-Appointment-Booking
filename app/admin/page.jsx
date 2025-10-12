// app/admin/page.jsx
import { redirect } from 'next/navigation';

export default function AdminRedirect() {
  redirect('/admin-dashboard');
}