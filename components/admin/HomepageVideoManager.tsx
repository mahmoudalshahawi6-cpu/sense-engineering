"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Link2, LoaderCircle, Save, UploadCloud, CheckCircle2 } from "lucide-react";
import { adminSaveHomepageVideoAction } from "@/app/actions";

export default function HomepageVideoManager({
  currentUrl,
  caption,
  enabled,
  storageReady,
}: {
  currentUrl: string;
  caption: string;
  enabled: boolean;
  storageReady: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState(currentUrl);
  const [captionText, setCaptionText] = useState(caption);
  const [visible, setVisible] = useState(enabled);

  async function uploadVideo(file: File) {
    if (!storageReady) {
      setMessage("اربط Supabase Storage أولًا من إعدادات الاستضافة، أو استخدم رابط YouTube في الحقل أعلاه.");
      return;
    }
    if (!/\.(mp4|webm)$/i.test(file.name)) {
      setMessage("ارفع فيديو MP4 أو WEBM فقط.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage("حجم الفيديو أكبر من 50 ميجابايت. ارفع نسخة مضغوطة أو استخدم رابط YouTube للفيديو الأكبر.");
      return;
    }
    setUploading(true);
    setMessage("جارٍ تجهيز الفيديو للرفع…");
    try {
      const signResponse = await fetch("/api/admin/uploads/sign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "homepageVideo", fileName: file.name, contentType: file.type, size: file.size }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error || "تعذر تجهيز رفع الفيديو.");
      const headers: Record<string, string> = { "Content-Type": file.type || "video/mp4", "x-upsert": "false", "cache-control": "3600" };
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (anonKey) { headers.apikey = anonKey; headers.Authorization = `Bearer ${anonKey}`; }
      const uploadResponse = await fetch(signed.signedUrl as string, { method: "PUT", headers, body: file });
      if (!uploadResponse.ok) throw new Error("تعذر رفع الفيديو إلى التخزين. راجع إعدادات Supabase أو جرّب ملفًا أصغر.");
      const completeResponse = await fetch("/api/admin/uploads/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "homepageVideo", bucket: signed.bucket, objectPath: signed.objectPath, fileName: file.name, caption: captionText }),
      });
      const completed = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completed.error || "تم الرفع لكن تعذر تفعيل الفيديو.");
      setUrl(completed.url);
      setMessage("تم رفع الفيديو وتفعيله في الصفحة الرئيسية.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ أثناء رفع الفيديو.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section id="homepage-video" className="card-surface space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Film size={18} className="text-cyan-300"/><div><h2 className="font-display text-base font-extrabold text-white">فيديو المعاينة المجاني في الصفحة الرئيسية</h2><p className="mt-1 text-xs text-slate-400">تحكم في الفيديو الذي يراه الزائر قبل شراء أي مكتبة.</p></div></div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${enabled && url ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>{enabled && currentUrl ? "ظاهر للزوار" : "غير مفعّل"}</span>
      </div>
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs leading-6 text-slate-200">
        <strong className="text-cyan-200">أسهل طريقة:</strong> ارفع الفيديو على YouTube واجعله Public أو Unlisted، ثم الصق رابط المشاركة هنا. ويمكنك بدل ذلك رفع ملف MP4/WEBM من جهازك مباشرة إذا كان التخزين السحابي متصلًا وحجم الفيديو لا يتجاوز 50 ميجابايت.
      </div>
      <form action={adminSaveHomepageVideoAction} className="space-y-3">
        <label className="block space-y-2"><span className="field-label">رابط YouTube أو رابط MP4/WEBM</span><input name="homepageVideoUrl" value={url} onChange={(event) => setUrl(event.target.value)} className="field text-sm" dir="ltr" placeholder="https://youtu.be/..."/></label>
        <label className="block space-y-2"><span className="field-label">النص الظاهر أسفل الفيديو</span><input name="homepageVideoCaption" value={captionText} onChange={(event) => setCaptionText(event.target.value)} className="field text-sm" placeholder="شاهد شرح المكتبات وطريقة الاستفادة منها مجانًا"/></label>
        <label className="flex items-center gap-2 text-xs text-white"><input type="checkbox" name="homepageVideoEnabled" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="h-4 w-4 accent-cyan-400"/> إظهار الفيديو في الصفحة الرئيسية</label>
        <button type="submit" className="btn-primary text-xs"><Save size={14}/> حفظ إعدادات الفيديو</button>
      </form>
      <div className="border-t border-white/10 pt-4">
        <input ref={inputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadVideo(file); event.currentTarget.value = ""; }}/>
        <button type="button" disabled={uploading || !storageReady} onClick={() => inputRef.current?.click()} className="btn-ghost text-xs"><UploadCloud size={14}/>{uploading ? "جارٍ رفع الفيديو…" : "أو اختر فيديو من جهازك"}{uploading && <LoaderCircle size={14} className="animate-spin"/>}</button>
        {!storageReady && <p className="mt-2 text-[11px] leading-5 text-amber-200">رفع الفيديو من الجهاز يتطلب ربط Supabase Storage. يمكنك حاليًا حفظ رابط YouTube.</p>}
      </div>
      {url && <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300"><CheckCircle2 size={15} className="shrink-0 text-emerald-300"/><span className="truncate" dir="ltr">{url}</span></div>}
      {message && <p role="status" className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs leading-6 text-cyan-100">{message}</p>}
      <p className="text-[11px] leading-5 text-slate-400">ملاحظة: الفيديو المجاني يجب أن يكون ملكك أو لديك إذن باستخدامه. رفع MP4 يجعل الفيديو متاحًا للعامة من خلال صفحة الموقع؛ استخدم YouTube للفيديوهات الكبيرة.</p>
    </section>
  );
}
