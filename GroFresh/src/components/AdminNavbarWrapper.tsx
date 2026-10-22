"use client";

import Navbar from "@/components/Navbar";
import { RootState } from "@/redux/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function AdminNavbarWrapper() {
  const { data: session, status } = useSession();
  const { userData } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  const user = userData || {
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "",
    role: "admin" as const,
    image: session?.user?.image || undefined,
  };

  return <Navbar user={user} />;
}
