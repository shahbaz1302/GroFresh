import AdminNavbarWrapper from "@/components/AdminNavbarWrapper";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f8f0]">
      <AdminNavbarWrapper />
      <div className="flex-1">{children}</div>
    </div>
  );
}
