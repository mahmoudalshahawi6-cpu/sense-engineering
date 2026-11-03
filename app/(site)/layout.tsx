import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user ? { name: user.name, role: user.role } : null} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
