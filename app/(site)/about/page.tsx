import Link from "next/link";
import { ArrowLeft, Target, Eye, Compass, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/data";

export const metadata = {
  title: "من نحن | SENSE",
  description: "تعرف على منصة المكتبات الرقمية الهندسية ورسالتها في دعم طلاب وخريجي الهندسة.",
};

const pillars = [
  {
    Icon: Target,
    title: "رسالتنا",
    body: "توفير مرجع هندسي رقمي متكامل يجمع المعرفة المتناثرة في مكان واحد، بتنظيم يليق بطالب الهندسة ويوفّر عليه شهورًا من البحث العشوائي.",
  },
  {
    Icon: Eye,
    title: "رؤيتنا",
    body: "أن نكون الوجهة الأولى لكل طالب أو خريج هندسة في الوطن العربي يبحث عن محتوى تقني موثوق، برامج هندسية، ومسار تعلم تطبيقي منظم.",
  },
  {
    Icon: Compass,
    title: "منهجنا",
    body: "كل مكتبة تُبنى على فهرس مرقّم يبدأ من الأساسيات ودليل التخصص وينتهي بالمشروعات العملية والتدريب وتجهيز سوق العمل.",
  },
  {
    Icon: ShieldCheck,
    title: "التزامنا",
    body: "حماية محتوى المشتركين عبر قارئ مدمج وعلامة مائية، ومراجعة يدوية للمدفوعات، ودعم فني مستمر، مع سياسات واضحة للخصوصية والاسترجاع.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-12 space-y-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-12">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <div className="max-w-3xl">
          <span className="chip mb-3">ABOUT US · من نحن</span>
          <h1 className="font-display text-2xl font-black text-white sm:text-4xl">
            نبني المعرفة الهندسية كما تُبنى المنشآت: بأساسات واضحة وتنظيم دقيق
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-300 sm:text-base">
            {SITE.name} — {SITE.slogan}، منصة متخصصة في المكتبات الرقمية الهندسية، تجمع مصادر التعلم المنظمة لطلاب وخريجي التخصصات الهندسية والتقنية.
          </p>
        </div>
      </div>

      {/* Story Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card-surface p-7 sm:p-9 space-y-4">
          <span className="chip text-[11px]">OUR STORY</span>
          <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
            لماذا أنشأنا هذه المنصة؟
          </h2>
          <div className="space-y-4 text-sm leading-8 text-slate-300">
            <p>
              لاحظنا أن طالب الهندسة يقضي ساعات طويلة في البحث عن الكورسات المناسبة، والكتب الموثوقة، والبرامج الأصلية، وملفات التمارين والمشروعات — وغالبًا ما يجمعها في روابط مفقودة أو ملفات عشوائية يصعب الرجوع إليها.
            </p>
            <p>
              لذلك بنينا مكتبات رقمية مستقلة، كل واحدة تمثل مسارًا كاملًا لتخصص محدد، تحتوي على ما يحتاجه الطالب فعلًا: من شرح القسم والمقررات الدراسية، إلى البرامج الهندسية وكورسات التعلم، والكتب والمراجع، والمشروعات العملية، وتجهيز سوق العمل.
            </p>
            <p>
              نعتمد نظام الدفع مرة واحدة بامتلاك دائم، مع حماية لحقوق المحتوى بعلامة مائية وتخزين آمن، وإتاحة التحديثات التي يضيفها فريق المنصة إلى المكتبات.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["04", "مكتبات تخصصية ضمن المنصة"],
            ["مرة واحدة", "شراء بلا تجديد دوري"],
            ["مراجعة يدوية", "تأكيد الدفع قبل التفعيل"],
            ["حساب شخصي", "العودة للمحتوى في أي وقت"],
          ].map(([v, l]) => (
            <div key={l} className="card-surface flex flex-col justify-center p-6 text-center">
              <p className="font-display text-3xl font-black text-cyan-300">{v}</p>
              <p className="mt-2 text-xs font-bold text-slate-300">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pillars */}
      <div>
        <div className="text-center">
          <span className="chip mb-2">OUR PILLARS</span>
          <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
            ركائز وأهداف المنصة
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="card-surface p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <p.Icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-base font-extrabold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="card-surface p-8 text-center sm:p-12">
        <h2 className="font-display text-2xl font-extrabold text-white">
          جاهز تبدأ رحلتك بمسار واضح؟
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">
          استكشف المكتبات المنشورة، شاهد فيديو المعاينة المجاني، ثم اشترِ المكتبة المناسبة بدفعة واحدة.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/libraries" className="btn-primary text-xs">
            استكشف المكتبات
            <ArrowLeft size={16} />
          </Link>
          <Link href="/contact" className="btn-ghost text-xs">
            تواصل معنا
          </Link>
        </div>
      </div>
    </div>
  );
}
