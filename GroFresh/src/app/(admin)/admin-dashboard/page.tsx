import { auth } from "@/auth";
import AdminDashboard from "@/components/AdminDashboard";
import Navbar from "@/components/Navbar";
import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AdminDashboardContent() {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();
  const user = await userModel.findById(session.user.id).lean();
  if (!user) {
    redirect("/login");
  }

  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <div>
      <Navbar user={plainUser} />
      <AdminDashboard />
    </div>
  );
}

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
      <AdminDashboardContent />
    </Suspense>
  );
}
