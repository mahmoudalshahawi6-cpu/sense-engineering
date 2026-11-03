import { desc } from "drizzle-orm";
import { UserCheck, UserX, ShieldCheck, ShieldAlert } from "lucide-react";
import { db } from "@/db";
import { entitlements, libraries, users } from "@/db/schema";
import { adminToggleUserAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة المستخدمين | لوحة التحكم" };

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
  const ents = await db.select().from(entitlements);
  const libs = await db.select().from(libraries);
  const libName = new Map(libs.map((l) => [l.id, l.titleAr]));

  return (
    <div className="space-y-6">
      <div>
        <span className="chip mb-2">USERS · إدارة المستخدمين</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">حسابات المشتركين</h1>
        <p className="mt-2 text-xs leading-6 text-slate-300">
          مراجعة بيانات الطلاب، والمكتبات المفعّلة على حساب كل مستخدم، وإمكانية تعطيل أو تفعيل أي حساب.
        </p>
      </div>

      <div className="card-surface overflow-x-auto p-1">
        <table className="sheet-table min-w-[850px]">
          <thead>
            <tr>
              <th>رقم الحساب</th>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>تاريخ التسجيل</th>
              <th>الحالة</th>
              <th>البريد</th>
              <th>المكتبات المشتراة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const owned = ents.filter((e) => e.userId === u.id);
              return (
                <tr key={u.id}>
                  <td className="font-tech text-xs text-slate-400">#{String(u.id).padStart(5, "0")}</td>
                  <td className="font-bold text-white">
                    {u.name}
                    {u.role === "admin" && (
                      <span className="pill pill-approved ms-2 text-[10px]">
                        <ShieldCheck size={11} /> ADMIN
                      </span>
                    )}
                  </td>
                  <td className="font-tech text-xs text-cyan-200" dir="ltr">
                    {u.email}
                  </td>
                  <td className="font-tech text-xs text-slate-400">
                    {new Date(u.createdAt).toISOString().slice(0, 10)}
                  </td>
                  <td>
                    <span className={`pill ${u.status === "active" ? "pill-approved" : "pill-rejected"}`}>
                      {u.status === "active" ? (
                        <>
                          <UserCheck size={12} /> نشط
                        </>
                      ) : (
                        <>
                          <UserX size={12} /> معطّل
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${u.emailVerified ? "pill-approved" : "pill-pending"}`}>
                      {u.emailVerified ? "مُفعّل" : "غير مُفعّل"}
                    </span>
                  </td>
                  <td>
                    {owned.length ? (
                      <ul className="space-y-1">
                        {owned.map((e) => (
                          <li key={e.id} className="text-xs text-slate-300">
                            {libName.get(e.libraryId) ?? `#${e.libraryId}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                  <td>
                    <form action={adminToggleUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button
                        type="submit"
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                          u.status === "active"
                            ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                            : "border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/10"
                        }`}
                      >
                        {u.status === "active" ? "تعطيل الحساب" : "إعادة التفعيل"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card-surface flex items-start gap-3 p-4 text-xs text-slate-300">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-cyan-300" />
        <p className="leading-5">
          صلاحيات المدير مفصولة عن المستخدمين، وكلمات المرور مشفّرة بأقوى معايير التشفير (scrypt).
        </p>
      </div>
    </div>
  );
}
