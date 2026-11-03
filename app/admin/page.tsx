import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Users, Banknote, Clock3, LibraryBig, ArrowLeft, Download } from "lucide-react";
import { db } from "@/db";
import { entitlements, libraries, orders, users } from "@/db/schema";
import { egp, withPrices } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم | الإحصائيات" };

export default async function AdminDashboard() {
  const [userCount] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const [revenue] = await db
    .select({ total: sql<string>`coalesce(sum(${orders.amount}), 0)` })
    .from(orders)
    .where(eq(orders.status, "approved"));
  const [pending] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "pending"));
  const [entCount] = await db.select({ c: sql<number>`count(*)::int` }).from(entitlements);

  const topRows = await db
    .select({
      libraryId: orders.libraryId,
      count: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(orders)
    .where(eq(orders.status, "approved"))
    .groupBy(orders.libraryId)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const allLibs = (await db.select().from(libraries)).map(withPrices);
  const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6);

  const stats = [
    {
      label: "إجمالي المستخدمين",
      value: String(userCount?.c ?? 0),
      note: "طالب مسجّل في المنصة",
      Icon: Users,
    },
    {
      label: "إجمالي الإيرادات",
      value: `${egp(Number(revenue?.total ?? 0))} ج.م`,
      note: "من الطلبات المعتمدة",
      Icon: Banknote,
    },
    {
      label: "طلبات منتظرة",
      value: String(pending?.c ?? 0),
      note: "بانتظار مراجعة الدفع",
      Icon: Clock3,
    },
    {
      label: "مكتبات مُفعّلة",
      value: String(entCount?.c ?? 0),
      note: "عمليات وصول للطلاب",
      Icon: LibraryBig,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip mb-2">DASHBOARD · الإحصائيات</span>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">نظرة عامة على المنصة</h1>
        </div>
        <Link href="/admin/orders" className="btn-primary text-xs">
          مراجعة الطلبات
          <ArrowLeft size={15} />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{s.label}</span>
              <s.Icon size={18} className="text-cyan-300" />
            </div>
            <p className="font-display mt-3 text-2xl font-black text-white">{s.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Export / Backup ZIP Banner */}
      <div className="card-surface p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-cyan-400/30 bg-gradient-to-r from-blue-600/15 via-navy-900 to-cyan-500/10">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="chip text-[10px]">BACKUP &amp; EXPORT</span>
            <h3 className="font-display text-sm sm:text-base font-extrabold text-white">
              تنزيل كود المشروع الكامل بصيغة (ZIP)
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            ملف مضغوط جاهز يحتوي على السورس كود الكامل للمنصة، قاعدة البيانات، إعدادات الحماية والأمان، والمكتبات الرقمية لرفعه على أي استضافة أو GitHub.
          </p>
        </div>
        <a
          href="/api/download"
          download="engineering-digital-libraries.zip"
          className="btn-primary text-xs !py-2.5 !px-4"
        >
          <Download size={15} />
          تحميل ملف ZIP الآن (1.5 MB)
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Top selling */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-display text-base font-extrabold text-white">المكتبات الأكثر مبيعًا</h2>
            <Link href="/admin/libraries" className="text-xs text-cyan-300 hover:underline">
              إدارة المكتبات ←
            </Link>
          </div>

          <div className="space-y-3">
            {topRows.length ? (
              topRows.map((row, i) => {
                const lib = allLibs.find((l) => l.id === row.libraryId);
                return (
                  <div key={row.libraryId} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
                    <span className="font-tech text-xs text-cyan-300">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{lib?.titleAr ?? `مكتبة #${row.libraryId}`}</p>
                      <div className="mt-1.5 h-1.5 w-full bg-navy-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{
                            width: `${Math.min(100, (row.count / (topRows[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="font-tech text-xs font-bold text-white block">{row.count} طلب</span>
                      <span className="font-tech text-[11px] text-cyan-200">{egp(Number(row.total))} ج.م</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-4 text-center text-xs text-slate-400">لا توجد مبيعات معتمدة بعد.</p>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-display text-base font-extrabold text-white">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="text-xs text-cyan-300 hover:underline">
              كل الطلبات ←
            </Link>
          </div>

          <div className="space-y-2.5">
            {recent.length ? (
              recent.map((o) => {
                const lib = allLibs.find((l) => l.id === o.libraryId);
                return (
                  <div key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-tech text-[11px] text-cyan-300">{o.reference}</p>
                      <p className="text-white font-bold mt-0.5">{lib?.titleAr ?? `#${o.libraryId}`}</p>
                    </div>
                    <span
                      className={`pill ${
                        o.status === "approved"
                          ? "pill-approved"
                          : o.status === "rejected"
                            ? "pill-rejected"
                            : "pill-pending"
                      }`}
                    >
                      {o.status === "approved" ? "مُفعّل" : o.status === "rejected" ? "مرفوض" : "منتظر"}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="p-4 text-center text-xs text-slate-400">لا توجد طلبات بعد.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
