import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
