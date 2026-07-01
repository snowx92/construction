"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { GlobalSearch } from "@/components/global-search";
import { NotificationsPopover } from "@/components/notifications-popover";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { FileText, Home, LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/initials";

export function Navbar() {
  const t = useT();
  const { dir } = useLocale();
  const { profile } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await signOut(auth);
    router.push("/login");
  }

  return (
    <nav className="glass fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 rounded-none border-x-0 border-b">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-80">
          <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-primary">
            <Home className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </div>
          Tender.ai
        </Link>

        <Link
          href="/projects"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-foreground-muted transition-colors hover:bg-black/[0.035]"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("nav.projects")}
        </Link>
      </div>

      <div className="flex-1 max-w-sm mx-6">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <NotificationsPopover />

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-[var(--radius-pill)] py-1 pl-1 pr-2.5 transition-colors hover:bg-black/[0.035]"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {profile?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white bg-primary">
                {initials(profile?.displayName, profile?.email)}
              </div>
            )}
            <span className="hidden md:block text-xs font-medium text-foreground max-w-[120px] truncate">
              {profile?.displayName?.split(" ")[0] || profile?.email}
            </span>
          </button>

          {open && (
            <div
              className={`absolute top-[calc(100%+6px)] z-50 min-w-[220px] rounded-xl border border-black/[0.08] bg-card p-1.5 shadow-lg ${dir === "rtl" ? "left-0" : "right-0"}`}
              role="menu"
            >
              <div className="px-3 py-2.5 border-b border-black/[0.05] mb-1">
                <p className="truncate text-sm font-medium text-foreground">{profile?.displayName || "—"}</p>
                <p className="truncate text-xs text-foreground-subtle">{profile?.email}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-black/[0.035]"
              >
                <UserIcon className="h-4 w-4" strokeWidth={1.5} />
                {t("nav.profile")}
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-black/[0.035]"
              >
                <SettingsIcon className="h-4 w-4" strokeWidth={1.5} />
                {t("nav.settings")}
              </Link>
              <div className="my-1 border-t border-black/[0.05]" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                {t("nav.signOut")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
