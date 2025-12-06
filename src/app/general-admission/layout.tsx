import { AppShell } from "@/components/sidebar";

export default function GeneralAdmissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="General Admission">{children}</AppShell>;
}
