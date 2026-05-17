import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "ar";

const dict = {
  en: {
    appName: "Clinic & Pharmacy",
    appTagline: "Management System",
    login: "Sign in",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    invalidCreds: "Invalid username or password",
    accountDisabled: "Your account is disabled. Contact an administrator.",
    logout: "Sign out",
    dashboard: "Dashboard",
    patients: "Patients",
    visits: "Visits",
    pharmacy: "Pharmacy queue",
    inventory: "Inventory",
    shortages: "Shortages",
    users: "Users",
    auditLogs: "Audit logs",
    notifications: "Notifications",
    reports: "Reports",
    language: "Language",
    theme: "Theme",
    welcome: "Welcome back",
    today: "Today",
    role_admin: "Administrator",
    role_doctor: "Doctor",
    role_pharmacist: "Pharmacist",
    stats_patients_today: "Patients today",
    stats_active_visits: "Active visits",
    stats_low_stock: "Low stock",
    stats_expired: "Expired",
    stats_shortages: "Shortages",
    quickActions: "Quick actions",
    comingSoon: "Module coming next in Phase 2",
    addUser: "Add user",
    editUser: "Edit user",
    fullName: "Full name",
    role: "Role",
    active: "Active",
    disabled: "Disabled",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    disable: "Disable",
    enable: "Enable",
    resetPassword: "Reset password",
    newPassword: "New password",
    confirm: "Confirm",
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    noResults: "No results",
    search: "Search",
    settings: "Settings",
    pageNotFound: "Page not found",
    goHome: "Go to dashboard",
    loginHint: "Default admin: admin / admin123",
  },
  ar: {
    appName: "العيادة والصيدلية",
    appTagline: "نظام الإدارة",
    login: "تسجيل الدخول",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    signIn: "دخول",
    signingIn: "جارٍ الدخول…",
    invalidCreds: "اسم المستخدم أو كلمة المرور غير صحيحة",
    accountDisabled: "حسابك معطّل. تواصل مع المسؤول.",
    logout: "تسجيل الخروج",
    dashboard: "اللوحة الرئيسية",
    patients: "المرضى",
    visits: "الزيارات",
    pharmacy: "طابور الصيدلية",
    inventory: "المخزون",
    shortages: "النواقص",
    users: "المستخدمون",
    auditLogs: "سجل التدقيق",
    notifications: "الإشعارات",
    reports: "التقارير",
    language: "اللغة",
    theme: "السمة",
    welcome: "مرحبًا بعودتك",
    today: "اليوم",
    role_admin: "مسؤول",
    role_doctor: "طبيب",
    role_pharmacist: "صيدلي",
    stats_patients_today: "مرضى اليوم",
    stats_active_visits: "زيارات نشطة",
    stats_low_stock: "مخزون منخفض",
    stats_expired: "منتهية الصلاحية",
    stats_shortages: "نواقص",
    quickActions: "إجراءات سريعة",
    comingSoon: "هذه الوحدة قادمة في المرحلة الثانية",
    addUser: "إضافة مستخدم",
    editUser: "تعديل مستخدم",
    fullName: "الاسم الكامل",
    role: "الدور",
    active: "مفعّل",
    disabled: "معطّل",
    actions: "إجراءات",
    save: "حفظ",
    cancel: "إلغاء",
    disable: "تعطيل",
    enable: "تفعيل",
    resetPassword: "إعادة تعيين كلمة المرور",
    newPassword: "كلمة المرور الجديدة",
    confirm: "تأكيد",
    created: "تم الإنشاء",
    updated: "تم التحديث",
    deleted: "تم الحذف",
    noResults: "لا توجد نتائج",
    search: "بحث",
    settings: "الإعدادات",
    pageNotFound: "الصفحة غير موجودة",
    goHome: "إلى اللوحة",
    loginHint: "المسؤول الافتراضي: admin / admin123",
  },
} as const;

type Key = keyof typeof dict["en"];

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("lang") as Lang) || "en";
  });

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("lang", lang);
  }, [lang]);

  const value: Ctx = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang: setLangState,
    t: (k) => dict[lang][k] ?? k,
  };
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
