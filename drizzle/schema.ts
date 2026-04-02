import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "partner"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── 파트너 업체 ──────────────────────────────────────────────────────────────

export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),                         // users.id (role=partner)
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "공업사", "렉카", "병원", "변호사", "손해사정사"
  ]).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  description: text("description"),
  // 운영시간: JSON 문자열 {mon:{open,close,closed}, tue:..., ...}
  businessHours: text("businessHours"),
  // 대표 사진 URL 목록: JSON 문자열 [url1, url2, ...]
  photoUrls: text("photoUrls"),
  // 서비스 금액표: JSON 문자열 [{name, price, unit, desc}, ...]
  pricingInfo: text("pricingInfo"),
  // 추가 정보
  website: varchar("website", { length: 500 }),
  parkingAvailable: boolean("parkingAvailable").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00").notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  totalCases: int("totalCases").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

// ─── 사고 접수 ────────────────────────────────────────────────────────────────

export const accidents = mysqlTable("accidents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),                         // 사고 당사자
  accidentType: mysqlEnum("accidentType", [
    "차량사고", "보행자사고", "주차장사고", "단독사고"
  ]).notNull(),
  status: mysqlEnum("status", [
    "접수", "증거수집", "파트너매칭", "처리중", "완료"
  ]).default("접수").notNull(),
  location: varchar("location", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  description: text("description"),
  injuryLevel: mysqlEnum("injuryLevel", ["없음", "경상", "중상", "불명"]).default("없음"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Accident = typeof accidents.$inferSelect;
export type InsertAccident = typeof accidents.$inferInsert;

// ─── 파트너 매칭 ──────────────────────────────────────────────────────────────

export const matchings = mysqlTable("matchings", {
  id: int("id").autoincrement().primaryKey(),
  accidentId: int("accidentId").notNull(),
  partnerId: int("partnerId").notNull(),
  status: mysqlEnum("status", [
    "요청", "수락", "거절", "완료"
  ]).default("요청").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  completedAt: timestamp("completedAt"),
  note: text("note"),                                      // 업체 메모
  fee: decimal("fee", { precision: 10, scale: 2 }),        // 처리 금액
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Matching = typeof matchings.$inferSelect;
export type InsertMatching = typeof matchings.$inferInsert;

// ─── 파트너 후기 ──────────────────────────────────────────────────────────────

export const partnerReviews = mysqlTable("partner_reviews", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  userId: int("userId").notNull(),
  matchingId: int("matchingId").notNull(),
  rating: int("rating").notNull(),                         // 1~5
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerReview = typeof partnerReviews.$inferSelect;
export type InsertPartnerReview = typeof partnerReviews.$inferInsert;
