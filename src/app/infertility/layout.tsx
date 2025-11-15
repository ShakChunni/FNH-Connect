import { AppShell } from "@/components/sidebar";

export default function InfertilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="Infertility">{children}</AppShell>;
}
