import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { NO_INDEX } from "@/lib/no-index";

export const metadata: Metadata = NO_INDEX;

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
