"use client";

import Link from "next/link";
import { GlobalSearch } from "@/components/global-search";
import { NotificationsPopover } from "@/components/notifications-popover";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { FileText, Home } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Navbar() {
  const t = useT();

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 border-b"
      style={{ background: "var(--color-panel)", borderColor: "var(--color-border-sub)" }}
    >
      {/* Start: Logo + Tender link */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "var(--color-accent)" }}>
            <Home className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </div>
          <span style={{ color: "var(--color-text-1)" }}>Tender.ai</span>
        </Link>

        <Link
          href="/tender"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-sand-200/50"
          style={{ color: "var(--color-text-2)" }}
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("nav.tenders")}
        </Link>
      </div>

      {/* Centre: Search */}
      <div className="flex-1 max-w-sm mx-6">
        <GlobalSearch />
      </div>

      {/* End: Language + Notifications */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <NotificationsPopover />
      </div>
    </nav>
  );
}
