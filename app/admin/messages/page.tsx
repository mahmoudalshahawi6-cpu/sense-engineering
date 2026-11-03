import { desc } from "drizzle-orm";
import { Mail, MessageSquare } from "lucide-react";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "رسائل التواصل | لوحة التحكم" };

export default async function AdminMessagesPage() {
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <div>
        <span className="chip mb-2">MESSAGES · رسائل التواصل</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">رسائل الزوار والطلاب</h1>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((m) => (
            <article key={m.id} className="card-surface p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-cyan-300" />
                  <span className="font-bold text-white">{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="font-tech text-cyan-200 hover:underline flex items-center gap-1"
                    dir="ltr"
                  >
                    <Mail size={12} />
                    {m.email}
                  </a>
                </div>
                <span className="font-tech text-[11px] text-slate-400">
                  {new Date(m.createdAt).toISOString().slice(0, 16).replace("T", " · ")}
                </span>
              </div>
              {m.subject && <p className="text-xs font-bold text-cyan-200">{m.subject}</p>}
              <p className="text-xs leading-6 text-slate-300 whitespace-pre-line">{m.message}</p>
            </article>
          ))
        ) : (
          <div className="card-surface p-12 text-center text-xs text-slate-400">
            لا توجد رسائل واردة حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}
