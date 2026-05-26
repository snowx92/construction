import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-6" style={{ background: "var(--color-danger-sub)" }}>
          <span className="text-3xl font-bold" style={{ color: "var(--color-danger)" }}>404</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text-1)" }}>Page not found</h1>
        <p className="text-base mb-6" style={{ color: "var(--color-text-2)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn-primary gap-2 inline-flex">
          <Home className="h-4 w-4" strokeWidth={1.5} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
