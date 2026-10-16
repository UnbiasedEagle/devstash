import DashboardShell from "@/components/dashboard/DashboardShell";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <DashboardShell topBar={<TopBar />} sidebar={<Sidebar />}>
      {children}
    </DashboardShell>
  );
}
