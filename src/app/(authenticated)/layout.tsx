import { AppShell } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="FNH Connect">{children}</AppShell>;
}
