"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  contactMessages,
  entitlements,
  libraries,
  orders,
  paymentSettings,
  progress,
  resources,
  sections,
  users,
} from "@/db/schema";
import {
  createSession,
  destroySession,
  getCurrentUser,
  getIpAddress,
  hashPassword,
  isThrottled,
  revokeAllSessions,
  verifyPassword,
  randomToken,
} from "@/lib/auth";
import { savePrivateFile, savePublicFile, deletePrivateFile } from "@/lib/storage";
import { brandedEmailHtml, emailIsConfigured, sendTransactionalEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function formDataString(fd: FormData, key: string, max = 5000): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeInternalPath(value: string, fallback = "/account") {
  // Reject protocol-relative paths, backslashes, and control characters.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n\0]/.test(value)) {
    return fallback;
  }
  return value;
}

function isSupportedYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host !== "youtube.com" && host !== "www.youtube.com" && host !== "m.youtube.com" && host !== "youtu.be") return false;
    if (host === "youtu.be") return /^[\w-]{6,}$/.test(url.pathname.replace(/^\//, ""));
    return /^\/embed\/[\w-]{6,}/.test(url.pathname) || /^\/shorts\/[\w-]{6,}/.test(url.pathname) ||
      (url.pathname === "/watch" && /^[\w-]{6,}$/.test(url.searchParams.get("v") ?? ""));
  } catch {
    return false;
  }
}

function hasExpectedFileSignature(buffer: Buffer, extension: string) {
  if (extension === "png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === "jpg" || extension === "jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === "webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (extension === "pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  return false;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login?next=/admin");
  return user;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function registerAction(formData: FormData) {
  const name = formDataString(formData, "name", 120);
  const email = formDataString(formData, "email", 190).toLowerCase();
  const password = formDataString(formData, "password", 200);
  const next = formDataString(formData, "next", 200) || "/account";
  const ip = await getIpAddress();

  if (isThrottled(`register-ip:${ip ?? "unknown"}`, 6, 60 * 60 * 1000)) {
    fail("/register", "تم تجاوز الحد الأقصى للتسجيل من هذا الجهاز مؤقتًا. يرجى المحاولة لاحقًا.");
  }

  if (name.length < 3) fail("/register", "الرجاء إدخال الاسم الكامل.");
  if (!isValidEmail(email)) fail("/register", "صيغة البريد الإلكتروني غير صحيحة.");
  if (password.length < 8) fail("/register", "كلمة المرور يجب ألا تقل عن 8 أحرف.");

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) fail("/register", "هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول.");

  const inserted = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: hashPassword(password),
      role: "user",
      status: "active",
      emailVerified: false,
      verifyToken: randomToken(),
      verifyTokenExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })
    .returning({ id: users.id });

  await createSession(inserted[0].id, null, ip);
  const verificationToken = (await db.select({ token: users.verifyToken }).from(users).where(eq(users.id, inserted[0].id)).limit(1))[0]?.token;
  let emailSent = false;
  if (verificationToken) {
    const url = `${SITE_URL}/api/verify?token=${encodeURIComponent(verificationToken)}`;
    emailSent = await sendTransactionalEmail({
      to: email,
      subject: "تأكيد بريدك الإلكتروني — SENSE",
      html: brandedEmailHtml("تأكيد البريد الإلكتروني", "شكرًا لإنشاء حسابك في SENSE. اضغط الزر لتأكيد ملكيتك لهذا البريد الإلكتروني.", "تأكيد البريد الإلكتروني", url),
      text: `لتأكيد بريدك الإلكتروني في SENSE افتح الرابط التالي: ${url}`,
    });
  }
  revalidatePath("/", "layout");
  const safeNext = safeInternalPath(next, "/account");
  redirect(`${safeNext}${safeNext.includes("?") ? "&" : "?"}${emailSent ? "verificationSent=1" : "verificationSetup=1"}`);
}

export async function loginAction(formData: FormData) {
  const email = formDataString(formData, "email", 190).toLowerCase();
  const password = formDataString(formData, "password", 200);
  const next = formDataString(formData, "next", 200) || "/account";
  const ip = await getIpAddress();

  // throttle brute-force attempts (per email and per IP)
  if (isThrottled(`login:${email}`) || isThrottled(`login-ip:${ip ?? "unknown"}`, 20)) {
    fail("/login", "محاولات دخول كثيرة. حاول مرة أخرى بعد 15 دقيقة.");
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    fail("/login", "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }
  if (user.status !== "active") {
    fail("/login", "هذا الحساب معطّل. تواصل مع الدعم للمزيد من المعلومات.");
  }

  await createSession(user.id, null, ip);
  revalidatePath("/", "layout");
  redirect(safeInternalPath(next, "/account"));
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestResetAction(formData: FormData) {
  const email = formDataString(formData, "email", 190).toLowerCase();
  const ip = await getIpAddress();

  if (isThrottled(`reset-ip:${ip ?? "unknown"}`, 4, 30 * 60 * 1000)) {
    fail("/forgot-password", "تم تجاوز الحد الأقصى لمحاولات الاستعادة. يرجى الانتظار 30 دقيقة.");
  }

  if (!emailIsConfigured()) redirect("/forgot-password?service=1");

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (rows.length && isValidEmail(email)) {
    const token = randomToken();
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpires: new Date(Date.now() + 1000 * 60 * 60) })
      .where(eq(users.id, rows[0].id));
    const url = `${SITE_URL}/forgot-password?token=${encodeURIComponent(token)}`;
    await sendTransactionalEmail({
      to: email,
      subject: "إعادة تعيين كلمة المرور — SENSE",
      html: brandedEmailHtml("إعادة تعيين كلمة المرور", "وصلنا طلب لتغيير كلمة مرور حسابك. استخدم الزر خلال ساعة واحدة لإعداد كلمة مرور جديدة.", "تعيين كلمة مرور جديدة", url),
      text: `لتعيين كلمة مرور جديدة لحساب SENSE افتح هذا الرابط خلال ساعة واحدة: ${url}`,
    });
  }
  // Same response for known and unknown addresses to prevent account enumeration.
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = formDataString(formData, "token", 120);
  const password = formDataString(formData, "password", 200);
  if (password.length < 8) fail(`/forgot-password?token=${encodeURIComponent(token)}`, "كلمة المرور يجب ألا تقل عن 8 أحرف.");

  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.resetToken, token), sql`${users.resetTokenExpires} > now()`))
    .limit(1);
  if (!rows.length) fail("/forgot-password", "رابط الاستعادة غير صالح أو منتهي الصلاحية.");

  await db
    .update(users)
    .set({
      passwordHash: hashPassword(password),
      resetToken: null,
      resetTokenExpires: null,
      emailVerified: true,
    })
    .where(eq(users.id, rows[0].id));
  // a password reset must invalidate every existing session
  await revokeAllSessions(rows[0].id);
  redirect("/login?reset=1");
}

export async function verifyEmailAction() {
  const user = await requireUser();
  if (user.emailVerified) redirect("/account?verified=1");
  if (!emailIsConfigured()) fail("/account", "خدمة إرسال البريد غير مفعّلة بعد. أضف إعدادات البريد إلى الموقع ثم أعد المحاولة.");

  const token = randomToken();
  await db.update(users).set({
    verifyToken: token,
    verifyTokenExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  }).where(eq(users.id, user.id));
  const url = `${SITE_URL}/api/verify?token=${encodeURIComponent(token)}`;
  const sent = await sendTransactionalEmail({
    to: user.email,
    subject: "تأكيد بريدك الإلكتروني — SENSE",
    html: brandedEmailHtml("تأكيد البريد الإلكتروني", "استخدم الزر لتأكيد بريدك الإلكتروني. الرابط صالح لمدة 24 ساعة.", "تأكيد البريد الإلكتروني", url),
    text: `لتأكيد بريدك الإلكتروني افتح الرابط خلال 24 ساعة: ${url}`,
  });
  if (!sent) fail("/account", "تعذر إرسال رسالة التأكيد. راجع إعدادات البريد وحاول مرة أخرى.");
  revalidatePath("/account");
  redirect("/account?verificationSent=1");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const name = formDataString(formData, "name", 120);
  const password = formDataString(formData, "password", 200);

  if (name.length < 3) fail("/account", "الرجاء إدخال اسم صحيح.");
  const updates: Partial<typeof users.$inferInsert> = { name };
  if (password) {
    if (password.length < 8) fail("/account", "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.");
    updates.passwordHash = hashPassword(password);
  }
  await db.update(users).set(updates).where(eq(users.id, user.id));
  // keep only the current device signed in after a password change
  if (password) await revokeAllSessions(user.id, true);
  revalidatePath("/account");
  redirect("/account?updated=1");
}

/** Sign out from every device except the current one. */
export async function logoutAllAction() {
  const user = await requireUser();
  await revokeAllSessions(user.id, true);
  revalidatePath("/account");
  redirect("/account?signedout=1");
}

export async function contactAction(formData: FormData) {
  const ip = await getIpAddress();
  if (isThrottled(`contact-ip:${ip ?? "unknown"}`, 5, 30 * 60 * 1000)) {
    fail("/contact", "تم إرسال عدة رسائل مؤخرًا من هذا الجهاز. يرجى الانتظار بضع دقائق.");
  }

  const name = formDataString(formData, "name", 120);
  const email = formDataString(formData, "email", 190);
  const subject = formDataString(formData, "subject", 190);
  const message = formDataString(formData, "message", 4000);

  if (name.length < 3 || !isValidEmail(email) || message.length < 10) {
    fail("/contact", "تأكد من إدخال الاسم والبريد ورسالة لا تقل عن 10 أحرف.");
  }
  await db.insert(contactMessages).values({ name, email, subject, message });
  redirect("/contact?sent=1");
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export async function createOrderAction(formData: FormData) {
  const user = await requireUser();
  const ip = await getIpAddress();

  if (isThrottled(`order-user:${user.id}`, 6, 60 * 60 * 1000) || isThrottled(`order-ip:${ip ?? "unknown"}`, 10, 60 * 60 * 1000)) {
    fail("/account", "تم تجاوز الحد الأقصى لإنشاء الطلبات مؤقتًا. يرجى الانتظار.");
  }

  const libraryId = Number(formDataString(formData, "libraryId"));
  const method = formDataString(formData, "method", 40) || "instapay";
  if (!["instapay", "wallet", "bank"].includes(method)) {
    fail("/libraries", "طريقة الدفع غير مدعومة.");
  }
  const senderWallet = formDataString(formData, "senderWallet", 120);
  const proof = formData.get("proof");

  const lib = await db.select().from(libraries).where(and(eq(libraries.id, libraryId), eq(libraries.published, true))).limit(1);
  if (!lib.length) fail("/libraries", "المكتبة غير متاحة للشراء حاليًا.");
  const library = lib[0];
  const backPath = `/library/${library.slug}`;
  const paymentRow = await db.select({ value: paymentSettings.value }).from(paymentSettings)
    .where(eq(paymentSettings.key, method)).limit(1);
  if (!paymentRow[0]?.value?.trim()) fail(backPath, "طريقة الدفع هذه غير متاحة حاليًا. اختر وسيلة أخرى أو تواصل مع الإدارة.");

  const already = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.userId, user.id), eq(entitlements.libraryId, libraryId)))
    .limit(1);
  if (already.length) fail(backPath, "أنت تملك هذه المكتبة بالفعل.");

  const pending = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.userId, user.id), eq(orders.libraryId, libraryId), eq(orders.status, "pending")))
    .limit(1);
  if (pending.length) fail(backPath, "لديك طلب قيد المراجعة لهذه المكتبة بالفعل.");

  if (!(proof instanceof File) || proof.size === 0) {
    fail(backPath, "الرجاء رفع صورة إثبات التحويل قبل إرسال الطلب.");
  }
  if (proof.size > 4 * 1024 * 1024) fail(backPath, "حجم الإثبات يجب ألا يتجاوز 4 ميجابايت. اضغط الصورة أو قلّل حجم ملف PDF.");
  const type = (proof.type || "").toLowerCase();
  const ext = (proof.name ? proof.name.split(".").pop() ?? "" : "").toLowerCase();
  const allowedExts = ["png", "jpg", "jpeg", "webp", "pdf"];
  if (!allowedExts.includes(ext) || !["image/png", "image/jpeg", "image/webp", "image/pdf", "application/pdf"].includes(type)) {
    fail(backPath, "صيغة الملف غير مدعومة. ارفع صورة PNG أو JPG أو مستند PDF فقط.");
  }

  const amount =
    library.discountPrice !== null && Number(library.discountPrice) > 0
      ? Number(library.discountPrice)
      : Number(library.price);

  if (!Number.isFinite(amount) || amount <= 0) fail(backPath, "المكتبة غير جاهزة للبيع حاليًا. تواصل مع الإدارة.");

  const reference = `SENSE-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  const buffer = Buffer.from(await proof.arrayBuffer());
  if (!hasExpectedFileSignature(buffer, ext)) {
    fail(backPath, "محتوى الملف لا يطابق امتداده. أعد تصدير الإيصال كصورة PNG/JPG/WEBP أو PDF حقيقي.");
  }
  const proofName = proof.name || "proof.png";
  const rel = await savePrivateFile("proofs", proofName, buffer);
  let orderId: number;
  try {
    const inserted = await db
      .insert(orders)
      .values({
        reference,
        userId: user.id,
        libraryId,
        amount: String(amount),
        method,
        senderWallet,
        status: "pending",
        proofPath: rel,
        proofName,
      })
      .returning({ id: orders.id });
    orderId = inserted[0].id;
  } catch (error) {
    await deletePrivateFile(rel);
    throw error;
  }

  const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  if (adminNotifyEmail && emailIsConfigured()) {
    const adminUrl = `${SITE_URL}/admin/orders`;
    await sendTransactionalEmail({
      to: adminNotifyEmail,
      subject: `طلب شراء جديد ${reference} — SENSE`,
      html: brandedEmailHtml("طلب شراء جديد", `وصل طلب جديد من ${user.name} للمكتبة ${library.titleAr}. راجع إثبات التحويل من لوحة الإدارة.`, "فتح طلبات الشراء", adminUrl),
      text: `طلب جديد ${reference} من ${user.name} للمكتبة ${library.titleAr}. افتح لوحة الإدارة: ${adminUrl}`,
    });
  }

  revalidatePath("/admin/orders");
  redirect(`/account/orders/${orderId}?created=1`);
}

export async function saveProgressAction(payload: {
  libraryId: number;
  resourceId: number;
  completed?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const libraryId = Number(payload.libraryId);
  const resourceId = Number(payload.resourceId);
  if (!libraryId || !resourceId) return { ok: false };

  const owns = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.userId, user.id), eq(entitlements.libraryId, libraryId)))
    .limit(1);
  if (!owns.length) return { ok: false };

  const existing = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, user.id), eq(progress.libraryId, libraryId)))
    .limit(1);

  const completedIds = new Set<number>(existing[0]?.completedIds ?? []);
  if (payload.completed) completedIds.add(resourceId);

  if (existing.length) {
    await db
      .update(progress)
      .set({
        resourceId,
        completedIds: Array.from(completedIds),
        updatedAt: new Date(),
      })
      .where(eq(progress.id, existing[0].id));
  } else {
    await db.insert(progress).values({
      userId: user.id,
      libraryId,
      resourceId,
      completedIds: Array.from(completedIds),
    });
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export async function adminApproveOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = Number(formDataString(formData, "orderId"));
  const note = formDataString(formData, "adminNote", 1000);
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) fail("/admin/orders", "الطلب غير موجود.");
  if (order.status !== "pending" || !order.proofPath) fail("/admin/orders", "لا يمكن اعتماد هذا الطلب؛ يجب أن يكون قيد المراجعة ويحتوي على إثبات دفع.");

  const approvedRows = await db
    .update(orders)
    .set({ status: "approved", adminNote: note, reviewedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (!approvedRows.length) fail("/admin/orders", "تمت مراجعة هذا الطلب بالفعل من جلسة أخرى.");
  await db
    .insert(entitlements)
    .values({ userId: order.userId, libraryId: order.libraryId, orderId: order.id })
    .onConflictDoNothing();

  const [customerRows, libraryRows] = await Promise.all([
    db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, order.userId)).limit(1),
    db.select({ title: libraries.titleAr, slug: libraries.slug }).from(libraries).where(eq(libraries.id, order.libraryId)).limit(1),
  ]);
  if (customerRows[0] && libraryRows[0] && emailIsConfigured()) {
    const libraryUrl = `${SITE_URL}/learn/${libraryRows[0].slug}`;
    await sendTransactionalEmail({
      to: customerRows[0].email,
      subject: "تم تفعيل مكتبتك — SENSE",
      html: brandedEmailHtml("تم تفعيل المكتبة", `مرحبًا ${customerRows[0].name}، تمت مراجعة الدفع وتفعيل ${libraryRows[0].title} على حسابك. يمكنك فتح المحتوى من حسابك في أي وقت.`, "فتح المكتبة", libraryUrl),
      text: `تم تفعيل ${libraryRows[0].title} على حسابك. افتح المكتبة: ${libraryUrl}`,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account");
  redirect(`/admin/orders?approved=${orderId}`);
}

export async function adminRejectOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = Number(formDataString(formData, "orderId"));
  const reason = formDataString(formData, "rejectReason", 500);
  const note = formDataString(formData, "adminNote", 1000);
  if (!reason) fail("/admin/orders", "الرجاء كتابة سبب الرفض.");
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0];
  if (!order) fail("/admin/orders", "الطلب غير موجود.");
  if (order.status !== "pending") fail("/admin/orders", "هذا الطلب تمت مراجعته بالفعل.");

  const rejectedRows = await db
    .update(orders)
    .set({ status: "rejected", rejectReason: reason, adminNote: note, reviewedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (!rejectedRows.length) fail("/admin/orders", "تمت مراجعة هذا الطلب بالفعل من جلسة أخرى.");
  const rejectedCustomer = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, order.userId)).limit(1);
  if (rejectedCustomer[0] && emailIsConfigured()) {
    await sendTransactionalEmail({
      to: rejectedCustomer[0].email,
      subject: "تحديث بخصوص طلب الشراء — SENSE",
      html: brandedEmailHtml("طلب الشراء يحتاج مراجعة", `مرحبًا ${rejectedCustomer[0].name}، لم يتم اعتماد إثبات الدفع المرسل. راجع تفاصيل الطلب في حسابك أو تواصل مع الإدارة إذا كنت تعتقد أن هناك خطأ.`, "فتح حسابي", `${SITE_URL}/account`),
      text: `لم يتم اعتماد إثبات الدفع. راجع حسابك: ${SITE_URL}/account`,
    });
  }
  revalidatePath("/admin/orders");
  redirect(`/admin/orders?rejected=${orderId}`);
}

export async function adminToggleUserAction(formData: FormData) {
  await requireAdmin();
  const userId = Number(formDataString(formData, "userId"));
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!rows.length) fail("/admin/users", "المستخدم غير موجود.");
  await db
    .update(users)
    .set({ status: rows[0].status === "active" ? "disabled" : "active" })
    .where(eq(users.id, userId));
  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function adminSaveLibraryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formDataString(formData, "id"));
  const slug = formDataString(formData, "slug", 80).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const titleAr = formDataString(formData, "titleAr", 160);
  const titleEn = formDataString(formData, "titleEn", 160);
  const tagline = formDataString(formData, "tagline", 240);
  const description = formDataString(formData, "description", 6000);
  const audience = formDataString(formData, "audience", 2000);
  const benefits = formDataString(formData, "benefits", 3000)
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
  const videoUrl = formDataString(formData, "videoUrl", 500);
  const videoCaption = formDataString(formData, "videoCaption", 300);
  const price = formDataString(formData, "price", 20) || "0";
  const discountPrice = formDataString(formData, "discountPrice", 20);
  const code = formDataString(formData, "code", 20) || "LIB-01";
  const featured = formData.get("featured") === "on";
  const published = formData.get("published") === "on";
  const sortOrder = Number(formDataString(formData, "sortOrder") || "0");

  if (!slug || !titleAr || !titleEn) fail("/admin/libraries", "الاسم والرابط مطلوبان.");
  const priceValue = Number(price);
  const discountValue = discountPrice ? Number(discountPrice) : null;
  if (!Number.isFinite(priceValue) || priceValue < 0) fail("/admin/libraries", "أدخل سعرًا صحيحًا.");
  if (discountValue !== null && (!Number.isFinite(discountValue) || discountValue < 0 || discountValue >= priceValue)) {
    fail("/admin/libraries", "سعر الخصم يجب أن يكون أقل من السعر الأساسي.");
  }
  if (published && priceValue <= 0) fail("/admin/libraries", "لا يمكن نشر مكتبة قبل تحديد سعر صحيح.");
  if (published && !isSupportedYouTubeUrl(videoUrl)) fail("/admin/libraries", "أضف رابط معاينة YouTube صحيحًا قبل نشر المكتبة.");

  const cover = formData.get("cover");
  let coverImage = formDataString(formData, "coverImage", 300);
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > 4 * 1024 * 1024) fail("/admin/libraries", "حجم صورة الغلاف يجب ألا يتجاوز 4 ميجابايت.");
    const extension = cover.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["png", "jpg", "jpeg", "webp"].includes(extension)) fail("/admin/libraries", "صورة الغلاف يجب أن تكون PNG أو JPG أو WEBP.");
    const coverBuffer = Buffer.from(await cover.arrayBuffer());
    if (!hasExpectedFileSignature(coverBuffer, extension)) fail("/admin/libraries", "محتوى صورة الغلاف لا يطابق امتداد الملف.");
    const rel = await savePublicFile("covers", cover.name, coverBuffer);
    coverImage = `/api/media/${rel}`;
  }

  const values = {
    slug,
    code,
    titleAr,
    titleEn,
    tagline,
    description,
    audience,
    benefits,
    coverImage,
    videoUrl,
    videoCaption,
    price,
    discountPrice: discountPrice ? discountPrice : null,
    featured,
    published,
    sortOrder,
  };

  if (id) {
    await db.update(libraries).set(values).where(eq(libraries.id, id));
  } else {
    await db.insert(libraries).values(values);
  }
  revalidatePath("/libraries");
  revalidatePath(`/library/${slug}`);
  redirect("/admin/libraries?saved=1");
}

export async function adminDeleteLibraryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formDataString(formData, "id"));
  if (id) await db.delete(libraries).where(eq(libraries.id, id));
  revalidatePath("/libraries");
  redirect("/admin/libraries?deleted=1");
}

export async function adminSaveSectionAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formDataString(formData, "id"));
  const libraryId = Number(formDataString(formData, "libraryId"));
  const code = formDataString(formData, "code", 12) || "00";
  const title = formDataString(formData, "title", 200);
  const description = formDataString(formData, "description", 1000);
  const sortOrder = Number(formDataString(formData, "sortOrder") || "0");
  if (!libraryId || !title) fail("/admin/libraries", "بيانات القسم غير مكتملة.");
  const libraryExists = await db.select({ id: libraries.id }).from(libraries).where(eq(libraries.id, libraryId)).limit(1);
  if (!libraryExists.length) fail("/admin/libraries", "المكتبة غير موجودة.");

  if (id) {
    const sectionExists = await db.select({ id: sections.id }).from(sections)
      .where(and(eq(sections.id, id), eq(sections.libraryId, libraryId))).limit(1);
    if (!sectionExists.length) fail(`/admin/libraries/${libraryId}`, "القسم لا يتبع هذه المكتبة.");
    await db.update(sections).set({ code, title, description, sortOrder }).where(eq(sections.id, id));
  } else {
    await db.insert(sections).values({ libraryId, code, title, description, sortOrder });
  }
  revalidatePath("/admin/libraries");
  redirect(`/admin/libraries/${libraryId}?saved=1`);
}

export async function adminDeleteSectionAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formDataString(formData, "id"));
  const libraryId = Number(formDataString(formData, "libraryId"));
  if (id && libraryId) {
    await db.delete(sections).where(and(eq(sections.id, id), eq(sections.libraryId, libraryId)));
  }
  revalidatePath("/admin/libraries");
  redirect(`/admin/libraries/${libraryId}?deleted=1`);
}

export async function adminSaveResourceAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formDataString(formData, "id"));
  const libraryId = Number(formDataString(formData, "libraryId"));
  const sectionId = Number(formDataString(formData, "sectionId"));
  const title = formDataString(formData, "title", 200);
  let kind = formDataString(formData, "kind", 20) || "document";
  const description = formDataString(formData, "description", 2000);
  const content = formDataString(formData, "content", 40000);
  const externalUrl = formDataString(formData, "externalUrl", 500);
  const duration = formDataString(formData, "duration", 40);
  if (externalUrl) {
    try {
      const parsed = new URL(externalUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported protocol");
    } catch {
      fail(`/admin/libraries/${libraryId}`, "الرابط الخارجي غير صحيح. استخدم رابطًا يبدأ بـ https:// أو http:// فقط.");
    }
    if (kind === "video" && !isSupportedYouTubeUrl(externalUrl)) {
      fail(`/admin/libraries/${libraryId}`, "عنصر الفيديو يجب أن يستخدم رابط YouTube صحيحًا.");
    }
  }
  const isFree = formData.get("isFree") === "on";
  const published = formData.get("published") === "on";
  const sortOrder = Number(formDataString(formData, "sortOrder") || "0");
  if (!libraryId || !sectionId || !title) fail("/admin/libraries", "بيانات الملف غير مكتملة.");
  if (!["document", "video", "link", "file"].includes(kind)) fail(`/admin/libraries/${libraryId}`, "نوع المحتوى غير مدعوم.");
  const sectionExists = await db.select({ id: sections.id }).from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.libraryId, libraryId))).limit(1);
  if (!sectionExists.length) fail(`/admin/libraries/${libraryId}`, "القسم المختار لا يتبع المكتبة المحددة.");
  if (id) {
    const resourceExists = await db.select({ id: resources.id }).from(resources)
      .where(and(eq(resources.id, id), eq(resources.libraryId, libraryId))).limit(1);
    if (!resourceExists.length) fail(`/admin/libraries/${libraryId}`, "الملف لا يتبع هذه المكتبة.");
  }

  let filePath = formDataString(formData, "filePath", 300) || null;
  let fileName = formDataString(formData, "fileName", 200) || null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) fail(`/admin/libraries/${libraryId}`, "حجم الملف يجب ألا يتجاوز 4 ميجابايت حاليًا. اضغط PDF أو قلّل دقة الصور والفيديو.");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedResourceExtensions = ["pdf", "png", "jpg", "jpeg", "webp", "mp4", "webm", "txt", "md"];
    if (!allowedResourceExtensions.includes(extension)) {
      fail(`/admin/libraries/${libraryId}`, "صيغة الملف غير مدعومة للعرض المحمي. الصيغ المسموحة: PDF والصور والفيديو MP4/WEBM وTXT/MD. حوّل ملفات Word وExcel إلى PDF أولًا.");
    }
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (["pdf", "png", "jpg", "jpeg", "webp"].includes(extension) && !hasExpectedFileSignature(fileBuffer, extension)) {
      fail(`/admin/libraries/${libraryId}`, "محتوى الملف لا يطابق امتداده. أعد تصدير الملف بصيغة صحيحة ثم حاول مرة أخرى.");
    }
    filePath = await savePrivateFile("library-files", file.name, fileBuffer);
    fileName = file.name;
    // An attached file is displayed in the protected reader, not as an empty text lesson.
    kind = "file";
  }

  if (published && kind === "video" && !externalUrl) fail(`/admin/libraries/${libraryId}`, "أضف رابط فيديو YouTube قبل نشر هذا العنصر.");
  if (published && kind === "link" && !externalUrl) fail(`/admin/libraries/${libraryId}`, "أضف الرابط الخارجي قبل نشر هذا العنصر.");
  if (published && kind === "file" && !filePath) fail(`/admin/libraries/${libraryId}`, "ارفع الملف قبل نشر هذا العنصر.");

  const values = {
    libraryId,
    sectionId,
    title,
    kind,
    description,
    content,
    externalUrl: externalUrl || null,
    duration,
    isFree,
    published,
    sortOrder,
    filePath,
    fileName,
  };

  if (id) {
    await db.update(resources).set(values).where(eq(resources.id, id));
  } else {
    await db.insert(resources).values(values);
  }
  revalidatePath("/admin/libraries");
  redirect(`/admin/libraries/${libraryId}?saved=1`);
}

export async function adminDeleteResourceAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formDataString(formData, "id"));
  const libraryId = Number(formDataString(formData, "libraryId"));
  const rows = await db.select().from(resources)
    .where(and(eq(resources.id, id), eq(resources.libraryId, libraryId))).limit(1);
  if (rows[0]?.filePath) await deletePrivateFile(rows[0].filePath);
  if (rows.length) await db.delete(resources).where(and(eq(resources.id, id), eq(resources.libraryId, libraryId)));
  revalidatePath("/admin/libraries");
  redirect(`/admin/libraries/${libraryId}?deleted=1`);
}

export async function adminSendTestEmailAction() {
  const admin = await requireAdmin();
  if (!emailIsConfigured()) redirect("/admin/settings?email=missing");

  const sent = await sendTransactionalEmail({
    to: admin.email,
    subject: "اختبار البريد الإلكتروني — SENSE",
    html: brandedEmailHtml(
      "تم إعداد البريد مبدئيًا",
      "هذه رسالة اختبار من منصة SENSE. إذا وصلتك، فإعدادات مفتاح Resend وعنوان المرسل تعمل مع هذا المستلم.",
      "فتح لوحة الإدارة",
      `${SITE_URL}/admin/settings`,
    ),
    text: "هذه رسالة اختبار من منصة SENSE. إذا وصلتك، فإعدادات البريد تعمل.",
  });

  redirect(sent ? "/admin/settings?email=sent" : "/admin/settings?email=failed");
}

export async function adminSavePaymentSettingsAction(formData: FormData) {
  await requireAdmin();
  const keys = formData.getAll("key").map((k) => String(k));
  for (const key of keys) {
    const label = formDataString(formData, `label_${key}`, 120);
    const value = formDataString(formData, `value_${key}`, 2000);
    const existing = await db.select().from(paymentSettings).where(eq(paymentSettings.key, key)).limit(1);
    if (existing.length) {
      await db.update(paymentSettings).set({ label, value }).where(eq(paymentSettings.id, existing[0].id));
    } else {
      await db.insert(paymentSettings).values({ key, label, value });
    }
  }
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
