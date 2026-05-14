import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Recipe Manager',
  description: 'Browse and filter recipes by ingredients',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
