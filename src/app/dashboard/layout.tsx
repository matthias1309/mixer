import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Übersicht | Recipe Manager',
  description: 'Rezepte durchsuchen und nach Zutaten filtern',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
