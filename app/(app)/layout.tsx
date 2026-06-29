"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { dir } = useLocale();
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const needsOnboarding = !!user && !!profile && !profile.activeCompanyId;
  const onOnboarding = pathname?.startsWith("/onboarding");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (needsOnboarding && !onOnboarding) {
      router.replace("/onboarding");
    }
  }, [user, loading, needsOnboarding, onOnboarding, router]);

  if (loading || !user) return null;
  if (needsOnboarding && !onOnboarding) return null;

  // Onboarding renders fullscreen without navbar/sidebar
  if (onOnboarding) {
    return <div className="min-h-screen bg-background" dir={dir}>{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 pt-14">
        <Sidebar />
        <main
          className="flex-1 overflow-auto"
          style={dir === "rtl" ? { marginRight: 240 } : { marginLeft: 240 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
