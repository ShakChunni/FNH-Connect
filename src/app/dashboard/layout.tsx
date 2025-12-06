import { AppShell } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="Dashboard">{children}</AppShell>;
}
