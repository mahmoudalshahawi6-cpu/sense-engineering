import Link from "next/link";
import { KeyRound, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { requestResetAction, resetPasswordAction } from "@/app/actions";

export const metadata = {
  title: "استعادة كلمة المرور | SENSE",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; token?: string; service?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AuthShell
      title={sp.token ? "تعيين كلمة مرور جديدة" : "استعادة كلمة المرور"}
      subtitle={
        sp.token
          ? "اختر كلمة مرور جديدة قوية لحسابك. رابط الاستعادة صالح للاستخدام مرة واحدة."
          : "أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور."
      }
      footer={
        <p className="text-slate-400">
          تذكرت كلمة المرور؟{" "}
          <Link href="/login" className="font-bold text-cyan-300 hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      }
    >
      {sp.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={15} />
          <span>{sp.error}</span>
        </div>
      )}

      {sp.token ? (
        <form action={resetPasswordAction} className="space-y-4">
          <input type="hidden" name="token" value={sp.token} />
          <div>
            <label className="field-label" htmlFor="password">
              كلمة المرور الجديدة
            </label>
            <input id="password" name="password" type="password" required minLength={8} className="field text-sm" dir="ltr" />
          </div>
          <button type="submit" className="btn-primary w-full text-xs sm:text-sm">
            <ShieldCheck size={16} />
            حفظ كلمة المرور الجديدة
          </button>
        </form>
      ) : (
        <form action={requestResetAction} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input id="email" name="email" type="email" required className="field text-sm" dir="ltr" placeholder="you@example.com" />
          </div>
          <button type="submit" className="btn-primary w-full text-xs sm:text-sm">
            <Mail size={16} />
            إرسال رابط الاستعادة
          </button>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <KeyRound size={13} className="text-cyan-300 shrink-0" />
            سيتم التحقق من الحساب وإرسال الرابط بأمان.
          </p>
        </form>
      )}

      {sp.sent && !sp.token && (
        <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-xs text-cyan-200">
          إذا كان هذا البريد مسجّلًا لدينا وتم إعداد خدمة البريد، فسيصلك رابط الاستعادة خلال دقائق. تحقق من مجلد الرسائل غير المرغوب فيها أيضًا.
        </div>
      )}
      {sp.service && !sp.token && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          خدمة إرسال البريد غير مفعّلة حاليًا. يرجى التواصل مع إدارة SENSE لاستعادة الحساب بعد تفعيل خدمة البريد.
        </div>
      )}
    </AuthShell>
  );
}
