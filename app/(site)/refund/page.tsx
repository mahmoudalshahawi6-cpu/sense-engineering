import Link from "next/link";
import { ArrowLeft, ShieldCheck, Clock3, FileWarning, Banknote } from "lucide-react";
import { SITE } from "@/lib/data";

export const metadata = { title: "سياسة الاسترداد والاسترجاع | SENSE" };

const cases = [
  {
    Icon: ShieldCheck,
    title: "استحقاق الاسترداد",
    body: "يمكنك التواصل مع إدارة SENSE لطلب مراجعة الاسترداد في حال وجود مشكلة تقنية جوهرية في المحتوى (مثل ملف تالف أو قسم غير متاح). ستراجع الإدارة المشكلة والطلب وفق القوانين المعمول بها وسياسة البيع النهائية المعلنة قبل الشراء.",
  },
  {
    Icon: FileWarning,
    title: "حالات لا يشملها الاسترداد",
    body: "ستوضح السياسة النهائية الحالات المقبولة وغير المقبولة للاسترداد قبل الدفع، بما في ذلك أثر تفعيل المحتوى وطبيعة المشكلة وسبب الطلب.",
  },
  {
    Icon: Clock3,
    title: "إجراءات الطلب",
    body: "أرسل طلبك عبر صفحة تواصل معنا موضحًا رقم الطلب وسبب الاسترداد. يتم توضيح مدة المراجعة وطريقة رد المبلغ في سياسة البيع النهائية التي تعتمدها إدارة المنصة قبل استقبال المدفوعات.",
  },
  {
    Icon: Banknote,
    title: "الطلبات المرفوضة قبل التفعيل",
    body: "إذا كان إثبات التحويل غير واضح، يمكنك التواصل مع الإدارة لتوضيح البيانات أو إرسال إثبات جديد. لا يُفعّل الطلب قبل التحقق من وصول المبلغ.",
  },
];

export default function RefundPage() {
  return (
    <div className="container-page py-12 max-w-4xl space-y-10">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-12">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <span className="chip mb-3">REFUND POLICY</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-4xl">سياسة الاسترداد والاسترجاع</h1>
        <p className="mt-3 text-sm leading-8 text-slate-300">
          هذا نص مبدئي لسياسة الاسترداد، ويجب على إدارة SENSE مراجعته واعتماده وفق القوانين المحلية قبل استقبال المدفوعات.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cases.map((c) => (
          <div key={c.title} className="card-surface p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <c.Icon size={22} />
            </div>
            <h2 className="mt-4 font-display text-base font-extrabold text-white">{c.title}</h2>
            <p className="mt-2 text-xs sm:text-sm leading-7 text-slate-300">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="card-surface p-8 text-center sm:p-10">
        <h3 className="font-display text-lg font-extrabold text-white">تقديم طلب استرداد</h3>
        <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-slate-300">
          تواصل معنا عبر صفحة الدعم أو راسلنا على البريد الرسمي {SITE.email} أو عبر الواتساب على {SITE.phone}.
        </p>
        <div className="mt-5">
          <Link href="/contact" className="btn-primary text-xs">
            الانتقال إلى صفحة التواصل
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
