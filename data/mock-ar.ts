/**
 * Arabic translations for mock data, keyed by entity ID.
 * Apply via the hooks in `lib/i18n/use-localized-data.ts`.
 *
 * Only translatable fields are listed — non-translatable fields
 * (IDs, dates, prices, ratings) come from the base English mock.
 */

import type {
  Tender, ProjectWorkspace, Vendor, AIInsight, MaterialPrice,
  TenderAnalysis,
} from "@/types";

/* Override shape — same as Partial<Tender> but with a relaxed analysis
 * field so we can list only the analysis subfields that change. */
type TenderOverride = Omit<Partial<Tender>, "analysis"> & { analysis?: Partial<TenderAnalysis> };

/* ── Tenders ─────────────────────────────────────────────────────── */
export const tenderArOverrides: Record<string, TenderOverride> = {
  "t-001": {
    title: "البنية التحتية لطريق الوصل — المرحلة 3",
    client: "هيئة طرق دبي",
    tags: ["بنية تحتية", "طرق", "مرحلة 3"],
    analysis: {
      summary: "تطوير طريق مزدوج بطول 4.2 كم يشمل الصرف واللافتات وثلاثة جسور مشاة. تعقيد عالٍ بسبب متطلبات إدارة الحركة المرورية ونافذة تنفيذ ضيقة قدرها 8 أشهر.",
      requirements: [
        "مقاول حاصل على شهادة ISO 9001:2015",
        "خبرة لا تقل عن 10 سنوات في إنشاء الطرق",
        "خطة إدارة حركة معتمدة من هيئة الطرق",
        "ضمان حسن أداء: 10% من قيمة العقد",
      ],
      penalties: ["50,000 درهم/يوم عن إغلاق الطرق غير المصرح به", "احتجاز 5% لمدة 12 شهراً بعد الإنجاز"],
      missingInfo: ["تقرير جيوتقني غير مرفق", "مرجع دراسة المرور غير مدرج"],
    },
  },
  "t-002": {
    title: "برج الخليج السكني — أعمال كهروميكانيكية",
    client: "إعمار العقارية",
    tags: ["كهروميكانيكي", "سكني", "أبراج"],
  },
  "t-003": {
    title: "مزرعة طاقة شمسية — محطة فرعية",
    client: "هيئة كهرباء ومياه دبي",
    tags: ["كهرباء", "طاقة شمسية", "مرافق"],
    analysis: {
      summary: "محطة فرعية 132/11 ك.ف لمزرعة طاقة شمسية 50 ميجاواط تشمل لوحات التحويل والمحولات وأنظمة SCADA وكابلات أرضية بطول 8 كم.",
      requirements: ["مقاول معتمد من هيئة الكهرباء", "متوافق مع IEC 61850", "فريق معتمد لدمج SCADA"],
      penalties: ["غرامة تأخير: 0.1% يومياً، بحد أقصى 10% من قيمة العقد"],
      missingInfo: [],
    },
  },
  "t-004": {
    title: "تجديد الحرم المدرسي — التشطيبات",
    client: "مجلس أبوظبي للتعليم",
    tags: ["تشطيبات", "تعليم", "تجديد"],
  },
};

/* ── Project Workspaces ─────────────────────────────────────────── */
export const workspaceArOverrides: Record<string, Partial<ProjectWorkspace>> = {
  "ws-001": {
    name: "طريق الوصل — المرحلة 3",
    clientName: "هيئة طرق دبي",
    projectType: "بنية تحتية للطرق",
  },
  "ws-002": {
    name: "برج الخليج للكهروميكانيكا",
    clientName: "إعمار العقارية",
    projectType: "كهروميكانيكي — أبراج",
  },
  "ws-003": {
    name: "محطة فرعية للطاقة الشمسية",
    clientName: "هيئة كهرباء ومياه دبي",
    projectType: "كهرباء — مرافق",
  },
  "ws-004": {
    name: "تجديد الحرم المدرسي",
    clientName: "مجلس أبوظبي للتعليم",
    projectType: "تشطيبات — تعليم",
  },
};

/* ── Vendors ─────────────────────────────────────────────────────── */
export const vendorArOverrides: Record<string, Partial<Vendor>> = {
  "v-001": {
    name: "شركة الخليج لتجارة الحديد",
    category: "حديد ومعادن",
    location: "مدينة دبي الصناعية",
    notes: "المورد المفضل للحديد — جودة ثابتة وأسعار تنافسية",
  },
  "v-002": {
    name: "الفطيم لمواد البناء",
    category: "أسمنت وركام",
    location: "الشارقة",
    notes: "موثوق لطلبات الأسمنت بالجملة",
  },
  "v-003": {
    name: "الإمارات لصناعات الكابلات",
    category: "كهرباء",
    location: "أبوظبي",
    notes: "المورد المعتمد الوحيد لكابلات الجهد العالي لهيئة الكهرباء",
  },
};

/* Translations for vendor priceItems materials and units, keyed by English text */
export const materialArOverrides: Record<string, string> = {
  "Steel Rebar (Y12)":             "حديد تسليح (Y12)",
  "Steel Rebar (Y16)":             "حديد تسليح (Y16)",
  "Structural Steel (H-Beam)":     "حديد إنشائي (كمرة H)",
  "OPC Cement (50kg bag)":         "أسمنت بورتلاندي (كيس 50 كجم)",
  "Washed Sand (Dune)":            "رمل مغسول (كثبان)",
  "Crushed Stone 20mm":            "حصى مكسر 20 مم",
  "11kV XLPE Cable 3x240mm²":      "كابل XLPE 11 ك.ف 3×240 مم²",
  "LV Cable 4x50mm²":              "كابل جهد منخفض 4×50 مم²",
};

export const unitArOverrides: Record<string, string> = {
  "ton":  "طن",
  "bag":  "كيس",
  "m":    "م",
  "m²":   "م²",
  "m³":   "م³",
  "L":    "لتر",
  "No.":  "عدد",
};

/* ── AI Insights ─────────────────────────────────────────────────── */
export const insightArOverrides: Record<string, Partial<AIInsight>> = {
  "i-001": {
    title: "ارتفاع أسعار الحديد 8% — راجع المناقصات المفتوحة",
    body: "ارتفعت أسعار حديد التسليح في بورصة لندن 8% خلال 3 أسابيع. مناقصاتك المفتوحة t-001 و t-003 تحتوي على بنود حديد كبيرة. يوصي الذكاء الاصطناعي بتعديل أسعار الوحدات قبل الموعد النهائي للتقديم.",
    relatedTo: { type: "tender", id: "t-001", label: "طريق الوصل — المرحلة 3" },
  },
  "i-002": {
    title: "بند الغرامة يتجاوز معيار الصناعة في t-001",
    body: "بند غرامة التأخير عند 50,000 درهم/يوم يبلغ 2.5 ضعف معيار السوق لقيمة هذا العقد. يُوصى بالإبلاغ للعميل أو طلب سقف في توضيحات العطاء.",
    relatedTo: { type: "tender", id: "t-001", label: "طريق الوصل — المرحلة 3" },
  },
  "i-003": {
    title: "الإمارات للكابلات: مدة التسليم قد تتجاوز موعد t-003",
    body: "مدة التسليم المعروضة من ECI وهي 21 يوماً لكابلات 11 ك.ف تتعارض مع متطلب التعبئة في t-003. فكر في توريد مزدوج أو التفاوض على تسليم سريع.",
    relatedTo: { type: "tender", id: "t-003", label: "محطة الطاقة الشمسية" },
  },
  "i-004": {
    title: "تأهيل هيئة الكهرباء ساري حتى أغسطس 2026 — 3 مناقصات مفتوحة تناسبك",
    body: "تأهيلك من الفئة A لدى هيئة كهرباء ومياه دبي يغطي 3 حزم تم إصدارها حديثاً. القيمة الإجمالية المقدرة: 12.4 مليون درهم. يُوصى بمراجعة RFQ-DEWA-2026-041.",
  },
};

/* ── Material Prices ─────────────────────────────────────────────── */
export const priceArOverrides: Record<string, Partial<MaterialPrice>> = {
  "p-001": { name: "حديد تسليح (Y16)", category: "حديد", source: "بورصة لندن / مسح محلي" },
  "p-002": { name: "أسمنت بورتلاندي", category: "أسمنت", source: "السوق المحلي" },
  "p-003": { name: "كابل نحاسي (16 مم²)", category: "كهرباء", source: "بورصة لندن + محلي" },
  "p-004": { name: "خرسانة جاهزة C30", category: "خرسانة", source: "مصانع الخلط" },
  "p-005": { name: "ديزل (بالجملة)", category: "وقود", source: "إينوك الرسمي" },
  "p-006": { name: "حديد إنشائي (كمرة H)", category: "حديد", source: "بورصة لندن / محلي" },
  "p-007": { name: "أنبوب HDPE 110 مم", category: "أنابيب", source: "مسح الموردين" },
  "p-008": { name: "تكسية ألمنيوم (3 مم)", category: "تكسية", source: "مسح الموردين" },
};
