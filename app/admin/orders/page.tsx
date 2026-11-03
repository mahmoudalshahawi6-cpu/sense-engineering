import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Check, X, ExternalLink, Mail, Wallet, Filter } from "lucide-react";

import { db } from "@/db";
import { libraries, orders, users } from "@/db/schema";
import { egp, withPrices } from "@/lib/data";
import { adminApproveOrderAction, adminRejectOrderAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات والمدفوعات | لوحة التحكم" };

const methodLabel: Record<string, string> = {
  instapay: "InstaPay",
  wallet: "محفظة إلكترونية",
  bank: "تحويل بنكي",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; approved?: string; rejected?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.status ?? "all";

  const rows = await db
    .select({
      order: orders,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(filter === "all" ? undefined : sql`${orders.status} = ${filter}`)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  const allLibs = (await db.select().from(libraries)).map(withPrices);
  const [pendingCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip mb-2">ORDERS · الطلبات والمدفوعات</span>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">مراجعة طلبات الشراء</h1>
          <p className="mt-2 text-xs leading-6 text-slate-300">
            يرجى مراجعة صورة إثبات التحويل مع بيانات المستفيد قبل التفعيل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          {[
            ["all", "الكل"],
            ["pending", "منتظر"],
            ["approved", "مُعتمدة"],
            ["rejected", "مرفوضة"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/orders?status=${key}`}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                filter === key
                  ? "border-cyan-400 bg-cyan-400 text-navy-950"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {sp.approved && (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-200">
            تمت الموافقة على الطلب وتفعيل المكتبة للعميل بنجاح.
          </div>
        )}
        {sp.rejected && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
            تم رفض الطلب وحفظ السبب للعميل.
          </div>
        )}
        {sp.error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
            {sp.error}
          </div>
        )}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-300">
          الطلبات المنتظرة: <span className="font-tech font-bold text-cyan-300">{pendingCount?.c ?? 0}</span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.length === 0 && (
          <div className="card-surface p-12 text-center text-xs text-slate-400">
            لا توجد طلبات ضمن هذا التصنيف.
          </div>
        )}

        {rows.map(({ order: o, userName, userEmail }) => {
          const lib = allLibs.find((l) => l.id === o.libraryId);
          return (
            <article key={o.id} className="card-surface overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
                <div>
                  <p className="font-tech text-xs text-cyan-300">{o.reference}</p>
                  <h2 className="font-display text-base font-extrabold text-white mt-0.5">
                    {lib?.titleAr ?? `مكتبة #${o.libraryId}`}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`pill ${
                      o.status === "approved"
                        ? "pill-approved"
                        : o.status === "rejected"
                          ? "pill-rejected"
                          : "pill-pending"
                    }`}
                  >
                    {o.status === "approved" ? "مُعتمد" : o.status === "rejected" ? "مرفوض" : "بانتظار المراجعة"}
                  </span>
                  <span className="font-tech text-base font-black text-cyan-300">
                    {egp(Number(o.amount))} ج.م
                  </span>
                </div>
              </div>

              <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_260px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">العميل</span>
                      <span className="font-bold text-white mt-0.5 block">{userName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">البريد الإلكتروني</span>
                      <span className="font-tech text-cyan-200 mt-0.5 flex items-center gap-1" dir="ltr">
                        <Mail size={12} />
                        {userEmail}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">طريقة الدفع</span>
                      <span className="text-slate-200 mt-0.5 block">{methodLabel[o.method] ?? o.method}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">المحفظة / الحساب المرسل</span>
                      <span className="font-tech text-slate-200 mt-0.5 flex items-center gap-1" dir="ltr">
                        <Wallet size={12} />
                        {o.senderWallet || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">تاريخ الطلب</span>
                      <span className="font-tech text-slate-400 mt-0.5 block">
                        {new Date(o.createdAt).toISOString().slice(0, 16).replace("T", " · ")}
                      </span>
                    </div>
                  </div>

                  {o.adminNote && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                      <span className="text-[11px] text-slate-400 block">ملاحظة المدير:</span>
                      <p className="mt-1 text-slate-200">{o.adminNote}</p>
                    </div>
                  )}

                  {o.status === "rejected" && o.rejectReason && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <span className="font-bold block">سبب الرفض للعميل:</span>
                      <p className="mt-1">{o.rejectReason}</p>
                    </div>
                  )}
                </div>

                {/* Proof preview & Actions */}
                <div className="space-y-3">
                  <span className="text-[11px] text-slate-400 block">صورة إثبات التحويل</span>
                  {o.proofPath ? (
                    o.proofName?.toLowerCase().endsWith(".pdf") ? (
                      <div className="space-y-2">
                        <div className="h-48 overflow-hidden rounded-xl border border-white/10 bg-navy-950">
                          <iframe
                            src={`/api/proof/${o.id}`}
                            title={`إثبات PDF ${o.reference}`}
                            className="h-full w-full"
                          />
                        </div>
                        <a href={`/api/proof/${o.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-cyan-200 hover:underline">
                          <ExternalLink size={11} /> فتح ملف PDF بالحجم الكامل
                        </a>
                      </div>
                    ) : (
                      <a
                        href={`/api/proof/${o.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block h-36 overflow-hidden rounded-xl border border-white/10 bg-navy-950"
                      >
                        <img
                          src={`/api/proof/${o.id}`}
                          alt={`إثبات ${o.reference}`}
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-navy-900/80 px-2 py-1 text-[10px] text-cyan-200">
                          <ExternalLink size={11} /> فتح بالحجم الكامل
                        </span>
                      </a>
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-400">
                      لا توجد صورة مرفوعة
                    </div>
                  )}

                  {o.status === "pending" && (
                    <div className="space-y-2 pt-2">
                      <form action={adminApproveOrderAction}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <input type="hidden" name="adminNote" value="تم التحقق من التحويل." />
                        <button type="submit" className="btn-primary w-full text-xs !py-2">
                          <Check size={14} />
                          الموافقة وتفعيل المكتبة
                        </button>
                      </form>

                      <form action={adminRejectOrderAction} className="space-y-2">
                        <input type="hidden" name="orderId" value={o.id} />
                        <input
                          name="rejectReason"
                          required
                          placeholder="سبب الرفض (يظهر للعميل)"
                          className="field text-xs !py-1.5"
                        />
                        <button type="submit" className="btn-ghost w-full text-xs text-rose-300 hover:border-rose-400/40 !py-1.5">
                          <X size={14} />
                          رفض الطلب
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
