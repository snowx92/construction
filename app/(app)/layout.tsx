"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useLocale } from "@/lib/i18n";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { dir } = useLocale();

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-bg)" }}>
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
