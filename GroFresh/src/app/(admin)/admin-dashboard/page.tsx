import AdminDashboard from "@/components/AdminDashboard";
import { Suspense } from "react";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-screen bg-[#f4f8f0] px-4 py-12 text-center text-sm font-medium text-[#718575]">
          Loading admin dashboard...
        </main>
      }>
      <AdminDashboard />
    </Suspense>
  );
}
