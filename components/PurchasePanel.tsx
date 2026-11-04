"use client";

import { useState } from "react";
import { UploadCloud, Landmark, Smartphone, Zap, ShieldCheck } from "lucide-react";
import { createOrderAction } from "@/app/actions";

type Setting = { label: string; value: string };

export default function PurchasePanel({
  libraryId,
  librarySlug,
  settings,
  loggedIn,
}: {
  libraryId: number;
  librarySlug: string;
  settings: Record<string, Setting>;
  loggedIn: boolean;
}) {
  const [method, setMethod] = useState("instapay");
  const [fileName, setFileName] = useState("");

  const methods = [
    { key: "instapay", label: "InstaPay", Icon: Zap, hint: "تحويل فوري عبر تطبيق البنك" },
    { key: "wallet", label: "محفظة إلكترونية", Icon: Smartphone, hint: "Vodafone Cash وغيرها" },
    { key: "bank", label: "تحويل بنكي", Icon: Landmark, hint: "تحويل أو إيداع بنكي" },
  ];

  const availableMethods = methods.filter((item) => Boolean(settings[item.key]?.value?.trim()));
  const selectedMethod = availableMethods.some((item) => item.key === method)
    ? method
    : availableMethods[0]?.key ?? "instapay";
  const currentKey = selectedMethod;
  const current = settings[currentKey];
  const instructions = settings["instructions"];
  const beneficiary = settings["beneficiary"];

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-white/10 bg-navy-900/80 px-6 py-5">
        <span className="chip mb-1.5 text-[11px]">CHECKOUT</span>
        <h3 className="font-display text-lg font-extrabold text-white">إتمام الشراء والتفعيل</h3>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          اختر طريقة الدفع، نفّذ التحويل، ثم ارفع صورة إثبات التحويل. يُفتح المحتوى بعد مراجعة الإدارة والموافقة على الطلب.
        </p>
      </div>

      {!loggedIn ? (
        <div className="p-6">
          <p className="text-sm leading-7 text-slate-300">
            يجب تسجيل الدخول أو إنشاء حساب أولًا حتى نتمكن من ربط المكتبة بحسابك وإرسال إشعار التفعيل.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a href={`/register?next=/library/${librarySlug}`} className="btn-primary text-xs">
              إنشاء حساب جديد
            </a>
            <a href={`/login?next=/library/${librarySlug}`} className="btn-ghost text-xs">
              تسجيل الدخول
            </a>
          </div>
        </div>
      ) : (
        <form action={createOrderAction} className="space-y-5 p-6">
          <input type="hidden" name="libraryId" value={libraryId} />

          <fieldset>
            <legend className="field-label">طريقة الدفع</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {availableMethods.map((m) => (
                <label
                  key={m.key}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition ${
                    selectedMethod === m.key
                      ? "border-cyan-400 bg-cyan-400/10 text-white shadow-[0_0_15px_-4px_rgba(34,211,238,0.4)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.key}
                    checked={selectedMethod === m.key}
                    onChange={() => setMethod(m.key)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <m.Icon size={14} className="text-cyan-300" />
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {availableMethods.length === 0 ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-6 text-amber-200">
              لم تضف الإدارة بيانات الدفع بعد. ستظهر طرق الدفع هنا بمجرد تجهيزها، ويمكنك العودة لهذه الصفحة لاحقًا.
            </div>
          ) : (
          <>
          {/* Payment instructions box */}
          <div className="rounded-xl border border-white/10 bg-navy-950/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              {current?.label || "بيانات التحويل"}
            </p>
            <p className="font-tech mt-1.5 whitespace-pre-line text-sm text-white" dir="ltr">
              {current?.value || "—"}
            </p>
            {beneficiary?.value && (
              <p className="mt-2 text-[11px] text-slate-300">اسم المستفيد: <span className="font-bold text-white">{beneficiary.value}</span></p>
            )}
            {instructions?.value && (
              <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-slate-400">
                {instructions.value}
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="senderWallet">
              رقم المحفظة / الحساب الذي أرسلت منه (اختياري)
            </label>
            <input
              id="senderWallet"
              name="senderWallet"
              className="field text-sm"
              placeholder="مثال: 010 0000 0000"
              dir="ltr"
            />
          </div>

          <div>
            <span className="field-label">إثبات التحويل</span>
            <label
              htmlFor="proof"
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 px-4 py-7 text-center transition hover:border-cyan-300 hover:bg-cyan-400/10"
            >
              <UploadCloud size={24} className="text-cyan-300" />
              <span className="text-xs font-bold text-white">
                {fileName || "اضغط هنا لاختيار صورة الإيصال"}
              </span>
              <span className="text-[10px] text-slate-400">PNG أو JPG أو WEBP أو PDF · بحد أقصى 4 ميجابايت</span>
              <input
                id="proof"
                type="file"
                name="proof"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                required
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>

          <button type="submit" className="btn-primary w-full text-sm">
            إرسال طلب الشراء للمراجعة
          </button>

          <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-cyan-300" />
            لن يُفتح المحتوى بمجرد رفع الصورة؛ ستظهر حالة الطلب في حسابك، وتُفعّل المكتبة بعد مراجعة التحويل والموافقة عليه.
          </p>
          </>
          )}
        </form>
      )}
    </div>
  );
}
