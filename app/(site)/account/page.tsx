import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  LibraryBig,
  Mail,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { entitlements, libraries, orders } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { egp, withPrices } from "@/lib/data";
import { logoutAllAction, updateProfileAction, verifyEmailAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابي | SENSE" };

const statusLabel: Record<string, string> = {
  pending: "بانتظار مراجعة الدفع",
  approved: "تم التفعيل",
  rejected: "مرفوض",
};

const defaultCovers: Record<string, string> = {
  mechatronics: "https://images.pexels.com/photos/3913031/pexels-photo-3913031.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mechanical: "https://images.pexels.com/photos/8439008/pexels-photo-8439008.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  electrical: "https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  programming: "https://images.pexels.com/photos/29320998/pexels-photo-29320998.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string; verified?: string; verificationSent?: string; verificationSetup?: string; signedout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const sp = await searchParams;

  const [ownedRows, orderRows] = await Promise.all([
    db
      .select({ libraryId: entitlements.libraryId, grantedAt: entitlements.grantedAt })
      .from(entitlements)
      .where(eq(entitlements.userId, user.id)),
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(20),
  ]);

  const ownedIds = ownedRows.map((r) => r.libraryId);
  const ownedLibs = ownedIds.length
    ? (await db.select().from(libraries).where(inArray(libraries.id, ownedIds))).map(withPrices)
    : [];

  return (
    <div className="container-page py-12 space-y-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-10">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="chip mb-2">MY ACCOUNT</span>
            <h1 className="font-display text-2xl font-black text-white sm:text-3xl">
              أهلًا، {user.name}
            </h1>
            <p className="mt-1 font-tech text-xs text-cyan-200 flex items-center gap-1.5" dir="ltr">
              <Mail size={13} className="text-cyan-400" />
              {user.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`pill ${user.emailVerified ? "pill-approved" : "pill-pending"}`}>
              {user.emailVerified ? "البريد مُفعّل" : "البريد غير مُفعّل"}
            </span>
            <span className="pill pill-approved">
              <ShieldCheck size={12} />
              حساب نشط
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {sp.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <CircleAlert size={16} />
          <span>{sp.error}</span>
        </div>
      )}
      {sp.updated && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs text-cyan-200">
          تم تحديث بيانات الحساب بنجاح.
        </div>
      )}
      {sp.verified && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs text-cyan-200">
          تم تأكيد بريدك الإلكتروني بنجاح.
        </div>
      )}
      {sp.verificationSent && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs text-cyan-200">
          أرسلنا رابط تأكيد إلى بريدك الإلكتروني. افتح الرسالة واضغط الرابط خلال 24 ساعة.
        </div>
      )}
      {sp.verificationSetup && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-200">
          تعذّر إرسال رسالة التأكيد حاليًا. يمكنك استخدام حسابك، وحاول إرسال رسالة التأكيد لاحقًا بعد تفعيل خدمة البريد.
        </div>
      )}
      {sp.signedout && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-xs text-cyan-200">
          تم إنهاء الجلسات على الأجهزة الأخرى بنجاح. هذا الجهاز ما زال مسجّل الدخول.
        </div>
      )}

      {/* Purchased Libraries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="chip text-[11px] mb-1">LIBRARIES</span>
            <h2 className="font-display text-xl font-extrabold text-white">المكتبات المشتراة</h2>
          </div>
          <Link href="/libraries" className="btn-ghost text-xs">
            تصفح كل المكتبات
            <ArrowLeft size={14} />
          </Link>
        </div>

        {ownedLibs.length ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {ownedLibs.map((lib) => {
              const cover = defaultCovers[lib.slug] || lib.coverImage || defaultCovers.mechatronics;
              return (
                <div key={lib.id} className="card-surface overflow-hidden grid sm:grid-cols-[180px_1fr]">
                  <img src={cover} alt={lib.titleAr} className="h-40 w-full sm:h-full object-cover" />
                  <div className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold">
                        <BadgeCheck size={16} />
                        <span>وصول دائم مفعّل</span>
                      </div>
                      <h3 className="font-display mt-1 text-base font-extrabold text-white">
                        {lib.titleAr}
                      </h3>
                      <p className="font-tech text-[11px] text-slate-400">{lib.titleEn}</p>
                    </div>

                    <div className="mt-4">
                      <Link href={`/learn/${lib.slug}`} className="btn-primary w-full text-xs">
                        فتح القارئ والمحتوى
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-surface p-10 text-center space-y-3">
            <LibraryBig size={36} className="mx-auto text-slate-500" />
            <p className="text-sm text-slate-300">لا توجد مكتبات مفعّلة على حسابك حتى الآن.</p>
            <Link href="/libraries" className="btn-primary text-xs">
              استكشف المكتبات المتاحة
            </Link>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <div>
          <span className="chip text-[11px] mb-1">ORDERS</span>
          <h2 className="font-display text-xl font-extrabold text-white">طلبات الشراء والمدفوعات</h2>
        </div>

        {orderRows.length ? (
          <div className="card-surface overflow-x-auto p-1">
            <table className="sheet-table min-w-[650px]">
              <thead>
                <tr>
                  <th>المرجع</th>
                  <th>المكتبة</th>
                  <th>المبلغ</th>
                  <th>طريقة الدفع</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((o) => {
                  const lib = ownedLibs.find((l) => l.id === o.libraryId);
                  return (
                    <tr key={o.id}>
                      <td className="font-tech text-xs text-slate-300">{o.reference}</td>
                      <td className="font-bold text-white">{lib?.titleAr ?? `مكتبة #${o.libraryId}`}</td>
                      <td className="font-tech text-cyan-300 font-bold">{egp(Number(o.amount))} ج.م</td>
                      <td className="text-xs text-slate-300">
                        {o.method === "instapay" ? "InstaPay" : o.method === "wallet" ? "محفظة" : "تحويل بنكي"}
                      </td>
                      <td className="font-tech text-xs text-slate-400">
                        {new Date(o.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            o.status === "approved"
                              ? "pill-approved"
                              : o.status === "rejected"
                                ? "pill-rejected"
                                : "pill-pending"
                          }`}
                        >
                          {statusLabel[o.status] ?? o.status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/account/orders/${o.id}`} className="text-xs text-cyan-300 hover:underline">
                          عرض الإيصال ←
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-surface p-8 text-center text-xs text-slate-400">
            <Clock size={28} className="mx-auto mb-2 text-slate-500" />
            لم تقم بأي طلب شراء حتى الآن.
          </div>
        )}
      </div>

      {/* Profile & Security */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Profile edit */}
        <div className="card-surface p-6 sm:p-8 space-y-4">
          <h3 className="font-display text-lg font-extrabold text-white">تعديل بيانات الحساب</h3>
          <form action={updateProfileAction} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="name">
                الاسم الكامل
              </label>
              <input id="name" name="name" defaultValue={user.name} required className="field text-sm" />
            </div>

            <div>
              <label className="field-label" htmlFor="emailDisplay">
                البريد الإلكتروني
              </label>
              <input id="emailDisplay" value={user.email} disabled className="field text-sm opacity-60" dir="ltr" />
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                كلمة مرور جديدة (اتركها فارغة إذا لم ترغب بالتغيير)
              </label>
              <input id="password" name="password" type="password" className="field text-sm" dir="ltr" minLength={8} />
            </div>

            <button type="submit" className="btn-primary text-xs">
              حفظ التغييرات
            </button>
          </form>
        </div>

        {/* Security & Support */}
        <div className="space-y-4">
          {!user.emailVerified && (
            <div className="card-surface p-5 border-amber-400/30">
              <h4 className="text-sm font-bold text-amber-300">تأكيد البريد الإلكتروني</h4>
              <p className="mt-1 text-xs leading-5 text-slate-300">
أرسل رابط تأكيد إلى بريدك. لن يتم تأكيد البريد بمجرد الضغط على الزر؛ يجب فتح الرسالة والضغط على الرابط المرسل.
              </p>
              <form action={verifyEmailAction} className="mt-3">
                <button type="submit" className="btn-ghost w-full text-xs">
                  إرسال رابط التأكيد
                </button>
              </form>
            </div>
          )}

          <div className="card-surface p-5 space-y-3">
            <h4 className="text-sm font-bold text-white">أمان الحساب</h4>
            <p className="text-xs leading-5 text-slate-300">
              إنهاء كل الجلسات المفتوحة على أجهزة أخرى مع إبقاء هذا الجهاز فقط مسجّل الدخول.
            </p>
            <form action={logoutAllAction}>
              <button type="submit" className="btn-ghost w-full text-xs text-rose-300 hover:border-rose-400/40">
                تسجيل الخروج من كل الأجهزة الأخرى
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
