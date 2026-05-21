import type { Metadata } from "next";

// maintenance/page.tsx is a Client Component and cannot export metadata
// itself. This layout carries the noindex: the maintenance page is a
// kill-switch state, never something Google should index or snapshot.
export const metadata: Metadata = {
  title: "Maintenance",
  robots: { index: false, follow: false },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
