import { auth } from "@/auth";
import AdminDashboard from "@/components/AdminDashboard";
import DeliveryBoyDashboard from "@/components/DeliveryBoyDashboard";
import EditRoleMobile from "@/components/EditRoleMobile";
import GeoUpdater from "@/components/GeoUpdater";
import Navbar from "@/components/Navbar";
import UserDashboard from "@/components/UserDashboard";
import connectDB from "@/lib/db";
import userModel from "@/models/user.model";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function HomeContent() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  await connectDB();
  const user = await userModel.findById(session?.user?.id);
  if (!user) {
    redirect("/login");
  }

  const inComplete =
    !user.mobile || !user.role || (!user.mobile && user.role === "user");

  if (inComplete) {
    return <EditRoleMobile />;
  }

  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <div>
      <Navbar user={plainUser} />
      <GeoUpdater userId={plainUser._id.toString()} />
      {user.role === "user" ? (
        <UserDashboard />
      ) : user.role === "deliveryBoy" ? (
        <DeliveryBoyDashboard user={plainUser} />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main
          aria-live="polite"
          className="min-h-screen bg-[#f4f8f0] px-4 py-12 text-center text-sm font-medium text-[#718575]">
          Loading your dashboard...
        </main>
      }>
      <HomeContent />
    </Suspense>
  );
}
