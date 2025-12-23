import { AppShell } from "@/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We can customize the scrollbar or sidebar items here if needed
  // For now, consistent with staff layout but keeping it separate for future admin-only menu items
  return <AppShell title="FNH Admin">{children}</AppShell>;
}
