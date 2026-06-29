export function initials(name?: string | null, email?: string | null): string {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return src.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  company_owner:  "Owner",
  admin:          "Admin",
  tender_manager: "Tender Manager",
  estimator:      "Estimator",
  finance:        "Finance",
  legal:          "Legal",
};

export function roleLabel(role?: string | null): string {
  if (!role) return "Member";
  return ROLE_LABELS[role] || role;
}
