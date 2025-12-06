import { AppShell } from "@/components/sidebar";

export default function PatientRecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="Patient Records">{children}</AppShell>;
}
