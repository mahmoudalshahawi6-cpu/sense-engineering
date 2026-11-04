import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    status: text("status").notNull().default("active"),
    emailVerified: boolean("email_verified").notNull().default(false),
    verifyToken: text("verify_token"),
    verifyTokenExpires: timestamp("verify_token_expires"),
    resetToken: text("reset_token"),
    resetTokenExpires: timestamp("reset_token_expires"),
    sessionsLimit: integer("sessions_limit").notNull().default(3),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    revoked: boolean("revoked").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("sessions_token_unique").on(t.tokenHash),
    userIdx: index("sessions_user_idx").on(t.userId),
  })
);

export const libraries = pgTable("libraries", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  code: text("code").notNull().default("LIB-01"),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  audience: text("audience").notNull().default(""),
  benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
  coverImage: text("cover_image").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  videoCaption: text("video_caption").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  discountPrice: numeric("discount_price", { precision: 10, scale: 2 }),
  featured: boolean("featured").notNull().default(true),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sections = pgTable(
  "sections",
  {
    id: serial("id").primaryKey(),
    libraryId: integer("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    code: text("code").notNull().default("00"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    libIdx: index("sections_library_idx").on(t.libraryId),
  })
);

export const resources = pgTable(
  "resources",
  {
    id: serial("id").primaryKey(),
    libraryId: integer("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    sectionId: integer("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("document"), // document | video | link | file
    description: text("description").notNull().default(""),
    content: text("content").notNull().default(""),
    filePath: text("file_path"),
    fileName: text("file_name"),
    externalUrl: text("external_url"),
    duration: text("duration").notNull().default(""),
    isFree: boolean("is_free").notNull().default(false),
    published: boolean("published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    libIdx: index("resources_library_idx").on(t.libraryId),
    secIdx: index("resources_section_idx").on(t.sectionId),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    libraryId: integer("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    method: text("method").notNull().default("instapay"),
    senderWallet: text("sender_wallet").notNull().default(""),
    proofPath: text("proof_path"),
    proofName: text("proof_name"),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    adminNote: text("admin_note").notNull().default(""),
    rejectReason: text("reject_reason").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
  },
  (t) => ({
    refUnique: uniqueIndex("orders_ref_unique").on(t.reference),
    userIdx: index("orders_user_idx").on(t.userId),
  })
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    libraryId: integer("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("entitlements_user_library_unique").on(t.userId, t.libraryId),
  })
);

export const progress = pgTable(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    libraryId: integer("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    resourceId: integer("resource_id").references(() => resources.id, { onDelete: "set null" }),
    completedIds: jsonb("completed_ids").$type<number[]>().notNull().default([]),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("progress_user_library_unique").on(t.userId, t.libraryId),
  })
);

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  label: text("label").notNull().default(""),
  value: text("value").notNull().default(""),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Library = typeof libraries.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PaymentSetting = typeof paymentSettings.$inferSelect;
