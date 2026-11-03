import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, CircleCheck, Clock3, ShieldAlert, FileCheck2, Banknote } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { libraries, orders } from "@/db/schema";
import { egp, getPaymentSettings, withPrices } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "تفاصيل الطلب | SENSE" };

const methodLabel: Record<string, string> = {
  instapay: "InstaPay",
  wallet: "محفظة إلكترونية",
  bank: "تحويل بنكي",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const { id } = await params;
  const sp = await searchParams;

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, Number(id)), eq(orders.userId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) notFound();

  const libRows = await db.select().from(libraries).where(eq(libraries.id, order.libraryId)).limit(1);
  const lib = libRows[0] ? withPrices(libRows[0]) : null;
  const settings = await getPaymentSettings();

  const status = order.status;
  const statusConfig = {
    pending: {
      label: "بانتظار مراجعة الدفع",
      Icon: Clock3,
      tone: "pill-pending",
      text: "تم استلام طلبك بنجاح. يراجع المدير صورة إثبات التحويل حاليًا، وستصلك رسالة عند الموافقة وتفعيل المكتبة.",
    },
    approved: {
      label: "تم تفعيل المكتبة بنجاح",
      Icon: CircleCheck,
      tone: "pill-approved",
      text: "تمت الموافقة على الدفع وتفعيل المكتبة على حسابك. يمكنك الدخول إليها الآن، وسيبقى الوصول دائمًا.",
    },
    rejected: {
      label: "تم رفض الطلب",
      Icon: ShieldAlert,
      tone: "pill-rejected",
      text: "تعذّرت الموافقة على طلبك. يمكنك الاطلاع على السبب أدناه وإعادة إرسال طلب جديد بصورة إثبات صحيحة.",
    },
  }[status] ?? {
    label: status,
    Icon: Clock3,
    tone: "pill-pending",
    text: "",
  };

  return (
    <div className="container-page py-12 max-w-4xl space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-10">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <span className="chip mb-2">ORDER STATUS</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">حالة طلب الشراء</h1>
        <p className="mt-1 font-tech text-xs text-cyan-200" dir="ltr">
          REF: {order.reference}
        </p>

        {sp.created && (
          <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3.5 text-xs text-cyan-200">
            تم إرسال طلبك بنجاح وسيظهر للمدير للمراجعة والتفعيل.
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Status Box */}
          <div className="card-surface p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`pill ${statusConfig.tone}`}>
                <statusConfig.Icon size={14} />
                {statusConfig.label}
              </span>
              <span className="font-tech text-xs text-slate-400">
                {new Date(order.createdAt).toISOString().slice(0, 16).replace("T", " · ")}
              </span>
            </div>

            <p className="text-sm leading-7 text-slate-300">{statusConfig.text}</p>

            {status === "rejected" && order.rejectReason && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                <span className="font-bold block mb-1">سبب الرفض:</span>
                <p className="leading-6">{order.rejectReason}</p>
              </div>
            )}

            {status === "approved" && lib && (
              <div className="pt-2">
                <Link href={`/learn/${lib.slug}`} className="btn-primary text-xs">
                  ادخل إلى {lib.titleAr} الآن
                  <ArrowLeft size={15} />
                </Link>
              </div>
            )}

            {status === "rejected" && lib && (
              <div className="pt-2">
                <Link href={`/library/${lib.slug}#buy`} className="btn-primary text-xs">
                  إعادة إرسال طلب جديد
                </Link>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <FileCheck2 size={18} className="text-cyan-300" />
              <h2 className="font-display text-base font-extrabold text-white">تفاصيل الطلب</h2>
            </div>

            <div className="divide-y divide-white/10 text-xs">
              {[
                ["المكتبة", lib?.titleAr ?? `#${order.libraryId}`],
                ["المبلغ", `${egp(Number(order.amount))} جنيه مصري`],
                ["طريقة الدفع", methodLabel[order.method] ?? order.method],
                ["رقم المحفظة / الحساب المرسل", order.senderWallet || "—"],
                ["تاريخ الطلب", new Date(order.createdAt).toISOString().slice(0, 10)],
                ["تاريخ المراجعة", order.reviewedAt ? new Date(order.reviewedAt).toISOString().slice(0, 10) : "قيد المراجعة"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proof Preview */}
          {order.proofPath && (
            <div className="card-surface p-6 space-y-3">
              <h2 className="font-display text-base font-extrabold text-white">إثبات التحويل المرفوع</h2>
              <p className="text-xs text-slate-400">
                الصورة محمية بالكامل ولا تظهر إلا لصاحب الطلب وإدارة المنصة.
              </p>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-950 p-2">
                <img
                  src={`/api/proof/${order.id}`}
                  alt="صورة إثبات التحويل"
                  className="max-h-[350px] w-full object-contain mx-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card-surface p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Banknote size={16} className="text-cyan-300" />
              <span>بيانات الدفع</span>
            </div>

            <div className="space-y-2 text-xs">
              {["instapay", "wallet", "bank"].map((key) => {
                const s = settings[key];
                if (!s) return null;
                return (
                  <div key={key} className="rounded-lg bg-white/5 p-2.5">
                    <span className="text-slate-400 block text-[11px]">{s.label}</span>
                    <span className="font-tech text-cyan-200 mt-0.5 block" dir="ltr">
                      {s.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-surface p-5 text-xs text-slate-300 space-y-2">
            <span className="font-bold block text-white">هل تواجه مشكلة؟</span>
            <p className="leading-5">
              تواصل مع إدارة المنصة مباشرة وسنساعدك في تفعيل حسابك فورًا.
            </p>
            <Link href="/contact" className="btn-ghost w-full text-center text-xs mt-2">
              تواصل مع الإدارة
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
