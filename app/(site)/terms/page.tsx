import { SITE } from "@/lib/data";

export const metadata = { title: "شروط الاستخدام | SENSE" };

const sections = [
  {
    h: "1. القبول بالشروط",
    p: "باستخدامك لمنصة " + SITE.name + " فإنك توافق على هذه الشروط وأي سياسات متعلقة بها. إذا كنت لا توافق على أي بند، يرجى عدم استخدام المنصة أو شراء أي من مكتباتها.",
  },
  {
    h: "2. الحساب والمسؤولية",
    p: "يجب تقديم بيانات صحيحة عند التسجيل، والحفاظ على سرية كلمة المرور. أنت مسؤول عن كل النشاطات التي تتم عبر حسابك. يُمنع مشاركة الحساب مع الغير أو استخدامه بشكل جماعي تجاري.",
  },
  {
    h: "3. ترخيص المحتوى والاستخدام",
    p: "عند شرائك لمكتبة تحصل على ترخيص شخصي دائم غير قابل للتحويل للاطلاع على المحتوى عبر المنصة. يُمنع نسخ الملفات وإعادة نشرها أو بيعها أو رفعها على منصات عامة، كما يُمنع مشاركة الروابط الخاصة.",
  },
  {
    h: "4. الدفع والتفعيل اليدوي",
    p: "تُنفَّذ عمليات الشراء عبر التحويل البنكي أو InstaPay أو المحافظ الإلكترونية. يتم تفعيل المكتبة بعد مراجعة إثبات التحويل والموافقة عليه يدويًا من إدارة المنصة لضمان دقة المعاملات المالية.",
  },
  {
    h: "5. حماية المحتوى والعلامة المائية",
    p: "يُعرض المحتوى داخل قارئ مدمج مع علامة مائية باسم المشترك. نستخدم قارئًا مدمجًا وروابط قصيرة الصلاحية وعلامات مائية لتقليل المشاركة غير المصرح بها. لا يمكن ضمان منع تصوير الشاشة أو النسخ الخارجي بالكامل.",
  },
];

export default function TermsPage() {
  return (
    <div className="container-page py-12 max-w-4xl space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-12">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <span className="chip mb-3">LEGAL · السياسات</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-4xl">شروط الاستخدام</h1>
        <p className="mt-3 text-sm leading-8 text-slate-300">
          تحكم هذه الشروط العلاقة بينك وبين منصة {SITE.name} بخصوص استخدام الموقع والمكتبات الرقمية.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.h} className="card-surface p-6 sm:p-8">
            <h2 className="font-display text-base sm:text-lg font-extrabold text-cyan-300">{s.h}</h2>
            <p className="mt-3 text-xs sm:text-sm leading-8 text-slate-300">{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
