import type { ReactNode } from "react";
import { validateSystemAdminAccess } from "@/lib/auth-validation";

interface UserManagementLayoutProps {
  children: ReactNode;
}

export default async function UserManagementLayout({
  children,
}: UserManagementLayoutProps) {
  await validateSystemAdminAccess();

  return children;
}
