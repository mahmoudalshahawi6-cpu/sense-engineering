import { Save, Wallet, Landmark, Zap, Info, UserCheck, Mail, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { adminSavePaymentSettingsAction, adminSendTestEmailAction } from "@/app/actions";
import HomepageVideoManager from "@/components/admin/HomepageVideoManager";
import { emailIsConfigured } from "@/lib/email";
import { directUploadsAreConfigured, privateStorageIsConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإعدادات والدفع | لوحة التحكم" };

const keys = [
  { key: "beneficiary", label: "اسم المستفيد", Icon: UserCheck, hint: "الاسم المسجّل في InstaPay والمحافظ الإلكترونية" },
  { key: "instapay", label: "بيانات InstaPay", Icon: Zap, hint: "الآي دي أو رقم التحويل الفوري" },
  { key: "wallet", label: "المحافظ الإلكترونية", Icon: Wallet, hint: "Vodafone Cash وغيرها — رقم المحفظة" },
  { key: "bank", label: "التحويل البنكي", Icon: Landmark, hint: "اسم البنك، رقم الحساب، والآيبان" },
  { key: "instructions", label: "تعليمات الدفع", Icon: Info, hint: "تظهر للعميل داخل صفحة الشراء" },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; homepageVideo?: string }>;
}) {
  const sp = await searchParams;
  const emailConfigured = emailIsConfigured();
  const cloudStorageConfigured = privateStorageIsConfigured();
  const directUploadsReady = directUploadsAreConfigured();
  const senderEmail = process.env.RESEND_FROM_EMAIL?.trim() || "غير مضبوط";
  const rows = await db.select().from(paymentSettings);
  const map = new Map(rows.map((r) => [r.key, r]));
  const homepageVideoUrl = map.get("homepage_preview_url")?.value ?? "";
  const homepageVideoCaption = map.get("homepage_preview_caption")?.value ?? "شاهد شرح المكتبات وطريقة الاستفادة منها مجانًا.";
  const homepageVideoEnabled = map.get("homepage_preview_enabled")?.value === "true";

  return (
    <div className="space-y-6">
      <div>
        <span className="chip mb-2">SENSE SETTINGS · إعدادات المنصة</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">تحكم في إعدادات SENSE</h1>
        <p className="mt-2 text-xs leading-6 text-slate-300">من هنا تدير فيديو الصفحة الرئيسية، البريد الإلكتروني، التخزين، وطرق الدفع — من مكان واحد.</p>
      </div>

      {sp.homepageVideo === "saved" && <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-200">تم حفظ إعدادات فيديو الصفحة الرئيسية.</p>}
      <HomepageVideoManager currentUrl={homepageVideoUrl} caption={homepageVideoCaption} enabled={homepageVideoEnabled} storageReady={directUploadsReady} />

      <section className="card-surface p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-cyan-300" />
            <h2 className="font-display text-sm font-extrabold text-white">إعداد البريد الإلكتروني</h2>
          </div>
          {emailConfigured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200"><CheckCircle2 size={13} /> بيانات الإرسال موجودة</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-200"><AlertTriangle size={13} /> البريد غير مفعّل</span>
          )}
        </div>
        <p className="text-xs leading-6 text-slate-300">
          البريد مسؤول عن تأكيد حساب الطالب، واستعادة كلمة المرور، وإشعارات الطلبات. لا تضع مفتاح Resend هنا؛ أضفه في متغيرات البيئة على Netlify أو في ملف <span dir="ltr">.env.local</span> عند التشغيل المحلي.
        </p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
          <p className="text-slate-400">عنوان المرسل الحالي</p>
          <p className="mt-1 font-tech text-cyan-200" dir="ltr">{senderEmail}</p>
        </div>
        {sp.email === "sent" && <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-200">تم إرسال رسالة اختبار إلى بريد حساب المدير. افحص Inbox وSpam.</p>}
        {sp.email === "missing" && <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-200">أضف RESEND_API_KEY وRESEND_FROM_EMAIL في إعدادات الاستضافة أولًا.</p>}
        {sp.email === "failed" && <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-200">فشل إرسال الاختبار. راجع توثيق الدومين وعنوان From ومفتاح API وسجل الإرسال في Resend.</p>}
        <div className="flex flex-wrap gap-2">
          <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="btn-ghost text-xs">توثيق الدومين في Resend</a>
          <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="btn-ghost text-xs">إنشاء API Key</a>
          <form action={adminSendTestEmailAction}>
            <button type="submit" className="btn-primary text-xs" disabled={!emailConfigured}><Send size={13} /> إرسال رسالة اختبار</button>
          </form>
        </div>
        <p className="text-[11px] leading-5 text-slate-400">وجود المتغيرات لا يثبت وحده أن الدومين موثّق. زر الاختبار يرسل رسالة إلى بريد حساب المدير ويكشف إذا كان الإرسال يعمل فعليًا.</p>
      </section>

      <section className="card-surface p-5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-sm font-extrabold text-white">تخزين ملفات المكتبات</h2>
          {cloudStorageConfigured ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">Supabase Storage متصل</span>
          ) : (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-200">التخزين السحابي غير مضبوط</span>
          )}
        </div>
        <p className="text-xs leading-6 text-slate-300">
          {cloudStorageConfigured
            ? "الملفات الخاصة تُرفع إلى Supabase Storage. تأكد أن حاوية sense-private موجودة وخاصّة (Private)."
            : "الموقع يستخدم التخزين المحلي فقط حاليًا. هذا مناسب للتجربة على جهازك، لكنه غير مناسب لنشر Netlify/Vercel لأن الملفات قد لا تبقى بعد إعادة النشر. اضبط SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY وNEXT_PUBLIC_SUPABASE_ANON_KEY، وأنشئ الحاويتين sense-private (خاصة) وsense-media (عامة للصور وفيديو المعاينة)."}
        </p>
        {!directUploadsReady && <p className="text-[11px] leading-5 text-amber-200">لرفع الملفات من المتصفح مباشرة، أضف أيضًا NEXT_PUBLIC_SUPABASE_ANON_KEY من إعدادات مشروع Supabase إلى متغيرات بيئة Netlify.</p>}
        <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="btn-ghost inline-flex text-xs">فتح لوحة Supabase</a>
      </section>

      <form action={adminSavePaymentSettingsAction} className="space-y-4">
        {keys.map((item) => {
          const row = map.get(item.key);
          return (
            <div key={item.key} className="card-surface p-5 space-y-3">
              <input type="hidden" name="key" value={item.key} />
              <div className="flex items-center gap-2">
                <item.Icon size={16} className="text-cyan-300" />
                <h2 className="font-display text-sm font-extrabold text-white">{item.label}</h2>
              </div>
              <p className="text-[11px] text-slate-400">{item.hint}</p>

              <div className="grid gap-3 md:grid-cols-[240px_1fr]">
                <div>
                  <label className="field-label text-[11px]">التسمية الظاهرة</label>
                  <input
                    name={`label_${item.key}`}
                    defaultValue={row?.label ?? item.label}
                    className="field text-xs"
                  />
                </div>
                <div>
                  <label className="field-label text-[11px]">القيمة</label>
                  {["instructions", "wallet", "bank"].includes(item.key) ? (
                    <textarea
                      name={`value_${item.key}`}
                      rows={item.key === "instructions" ? 3 : 2}
                      defaultValue={row?.value ?? ""}
                      className="field text-xs"
                      dir={item.key === "instructions" ? "rtl" : "auto"}
                    />
                  ) : (
                    <input
                      name={`value_${item.key}`}
                      defaultValue={row?.value ?? ""}
                      className="field text-xs font-tech"
                      dir="ltr"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button type="submit" className="btn-primary text-xs">
          <Save size={14} />
          حفظ التغييرات
        </button>
      </form>
    </div>
  );
}
