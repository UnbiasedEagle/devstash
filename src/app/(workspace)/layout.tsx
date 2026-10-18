import DashboardShell from "@/components/dashboard/DashboardShell";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell topBar={<TopBar />} sidebar={<Sidebar />}>
      {children}
    </DashboardShell>
  );
}
