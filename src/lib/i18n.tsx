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
    // Patients
    addPatient: "Add patient", editPatient: "Edit patient", patientDetails: "Patient details",
    militaryNumber: "Military number", otherDiseases: "Chronic conditions", patientNotes: "Notes",
    // Visits
    newVisit: "New visit", visitDetails: "Visit details", priority: "Priority", status: "Status",
    diagnosis: "Diagnosis", prescription: "Prescription", addItem: "Add item", remove: "Remove",
    medicine: "Medicine", quantity: "Quantity", unit: "Unit", patient: "Patient",
    pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
    partially_dispensed: "Partially dispensed", dispensed_status: "Dispensed", not_available: "Not available", closed_status: "Closed",
    low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
    pill: "Pill", strip: "Strip", box: "Box",
    closeVisit: "Close visit", visitClosed: "Visit closed",
    selectPatient: "Select patient", selectMedicine: "Select medicine",
    timeline: "Timeline", noVisits: "No visits yet",
    // Pharmacy
    dispense: "Dispense", dispensed: "Dispensed", remaining: "Remaining",
    pharmacyQueue: "Pharmacy queue", noQueue: "Queue is empty",
    dispenseAll: "Dispense all", insufficientStock: "Insufficient stock",
    partialDispense: "Partial — shortage logged",
    // Inventory
    addMedicine: "Add medicine", editMedicine: "Edit medicine",
    commercialName: "Commercial name", barcode: "Barcode",
    stripsPerBox: "Strips/box", pillsPerStrip: "Pills/strip",
    minimumPills: "Min. pills", totalPills: "Total pills", expiryDate: "Expiry date",
    stockMovement: "Stock movement", stockIn: "Stock in", stockOut: "Stock out", stockAdjust: "Adjust",
    movementType: "Type", reason: "Reason", recordMovement: "Record",
    available: "Available", lowStockLabel: "Low stock", outOfStock: "Out of stock", expiredLabel: "Expired",
    description: "Description",
    form: "Form", formTablet: "Tablet", formOintment: "Ointment", formSyrup: "Syrup", formInjection: "Injection", formOther: "Other",
    totalUnits: "Total units", minimumUnits: "Min. units",
    // Shared
    edit: "Edit", view: "View", details: "Details", close: "Close", filter: "Filter", all: "All",
    delete: "Delete", confirmDelete: "Are you sure?",
    // Shortages
    missingPills: "Missing pills", requestCount: "Requests", lastRequested: "Last requested",
    resolve: "Resolve", resolved: "Resolved", unresolved: "Unresolved", markResolved: "Mark resolved", noShortages: "No shortages",
    // Audit
    action: "Action", entity: "Entity", actor: "Actor", when: "When", ipAddress: "IP", device: "Device",
    beforeData: "Before", afterData: "After", noAudit: "No audit entries", viewDetails: "View details",
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
    addPatient: "إضافة مريض", editPatient: "تعديل مريض", patientDetails: "بيانات المريض",
    militaryNumber: "الرقم العسكري", otherDiseases: "الأمراض المزمنة", patientNotes: "ملاحظات",
    newVisit: "زيارة جديدة", visitDetails: "تفاصيل الزيارة", priority: "الأولوية", status: "الحالة",
    diagnosis: "التشخيص", prescription: "الروشتة", addItem: "إضافة دواء", remove: "حذف",
    medicine: "الدواء", quantity: "الكمية", unit: "الوحدة", patient: "المريض",
    pending: "قيد الانتظار", in_progress: "قيد التنفيذ", completed: "مكتملة", cancelled: "ملغاة",
    partially_dispensed: "صرف جزئي", dispensed_status: "تم الصرف", not_available: "غير متوفر", closed_status: "مغلقة",
    low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة",
    pill: "قرص", strip: "شريط", box: "علبة",
    closeVisit: "إغلاق الزيارة", visitClosed: "تم إغلاق الزيارة",
    selectPatient: "اختر المريض", selectMedicine: "اختر الدواء",
    timeline: "السجل", noVisits: "لا توجد زيارات",
    dispense: "صرف", dispensed: "تم الصرف", remaining: "المتبقي",
    pharmacyQueue: "طابور الصيدلية", noQueue: "الطابور فارغ",
    dispenseAll: "صرف الكل", insufficientStock: "الكمية غير كافية",
    partialDispense: "صرف جزئي — تم تسجيل نقص",
    addMedicine: "إضافة دواء", editMedicine: "تعديل دواء",
    commercialName: "الاسم التجاري", barcode: "الباركود",
    stripsPerBox: "شرائط/علبة", pillsPerStrip: "أقراص/شريط",
    minimumPills: "الحد الأدنى", totalPills: "إجمالي الأقراص", expiryDate: "تاريخ الانتهاء",
    stockMovement: "حركة مخزون", stockIn: "إدخال", stockOut: "إخراج", stockAdjust: "تسوية",
    movementType: "النوع", reason: "السبب", recordMovement: "تسجيل",
    available: "متوفر", lowStockLabel: "مخزون منخفض", outOfStock: "نفد", expiredLabel: "منتهي",
    description: "الوصف",
    edit: "تعديل", view: "عرض", details: "تفاصيل", close: "إغلاق", filter: "تصفية", all: "الكل",
    delete: "حذف", confirmDelete: "هل أنت متأكد؟",
    missingPills: "أقراص ناقصة", requestCount: "عدد الطلبات", lastRequested: "آخر طلب",
    resolve: "حل", resolved: "تم الحل", unresolved: "غير محلولة", markResolved: "وضع كمحلول", noShortages: "لا توجد نواقص",
    action: "الإجراء", entity: "الكيان", actor: "المنفّذ", when: "الوقت", ipAddress: "IP", device: "الجهاز",
    beforeData: "قبل", afterData: "بعد", noAudit: "لا توجد سجلات", viewDetails: "عرض التفاصيل",
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
