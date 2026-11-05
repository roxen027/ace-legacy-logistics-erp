import { requireAuth } from "@/lib/permissions";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar user={user} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
