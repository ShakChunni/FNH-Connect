export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No shell wrapper - just return children
  // The login/register pages have their own visual layout
  return <>{children}</>;
}
