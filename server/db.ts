import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertAccident,
  InsertMatching,
  InsertPartner,
  InsertPartnerReview,
  accidents,
  matchings,
  partnerReviews,
  partners,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── 파트너 업체 ──────────────────────────────────────────────────────────────

export async function getPartnerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(partners).where(eq(partners.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPartners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(partners).orderBy(desc(partners.createdAt));
}

export async function getActivePartners(category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(partners.status, "active")];
  if (category) conditions.push(eq(partners.category, category as any));
  return db.select().from(partners).where(and(...conditions));
}

export async function createPartner(data: InsertPartner) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(partners).values(data);
  return result[0].insertId;
}

export async function updatePartner(id: number, data: Partial<InsertPartner>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(partners).set(data).where(eq(partners.id, id));
}

export async function updatePartnerStatus(id: number, status: "active" | "inactive" | "pending") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(partners).set({ status }).where(eq(partners.id, id));
}

// ─── 사고 접수 ────────────────────────────────────────────────────────────────

export async function createAccident(data: InsertAccident) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accidents).values(data);
  return result[0].insertId;
}

export async function getAccidentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accidents).where(eq(accidents.userId, userId)).orderBy(desc(accidents.createdAt));
}

export async function getAllAccidents() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    accident: accidents,
    user: { id: users.id, name: users.name, email: users.email },
  }).from(accidents).leftJoin(users, eq(accidents.userId, users.id)).orderBy(desc(accidents.createdAt));
}

export async function updateAccidentStatus(id: number, status: "접수" | "증거수집" | "파트너매칭" | "처리중" | "완료") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accidents).set({ status }).where(eq(accidents.id, id));
}

export async function getAccidentStats() {
  const db = await getDb();
  if (!db) return { total: 0, 접수: 0, 처리중: 0, 완료: 0 };
  const rows = await db.select({
    status: accidents.status,
    count: sql<number>`count(*)`,
  }).from(accidents).groupBy(accidents.status);
  const stats: Record<string, number> = { total: 0, 접수: 0, 증거수집: 0, 파트너매칭: 0, 처리중: 0, 완료: 0 };
  for (const row of rows) {
    stats[row.status] = Number(row.count);
    stats.total += Number(row.count);
  }
  return stats;
}

// ─── 파트너 매칭 ──────────────────────────────────────────────────────────────

export async function createMatching(data: InsertMatching) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchings).values(data);
  return result[0].insertId;
}

export async function getMatchingsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    matching: matchings,
    accident: accidents,
    user: { id: users.id, name: users.name, email: users.email },
  })
    .from(matchings)
    .leftJoin(accidents, eq(matchings.accidentId, accidents.id))
    .leftJoin(users, eq(accidents.userId, users.id))
    .where(eq(matchings.partnerId, partnerId))
    .orderBy(desc(matchings.requestedAt));
}

export async function getMatchingsByAccident(accidentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    matching: matchings,
    partner: partners,
  })
    .from(matchings)
    .leftJoin(partners, eq(matchings.partnerId, partners.id))
    .where(eq(matchings.accidentId, accidentId));
}

export async function updateMatchingStatus(
  id: number,
  status: "요청" | "수락" | "거절" | "완료",
  extra?: { respondedAt?: Date; completedAt?: Date; note?: string; fee?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matchings).set({ status, ...extra }).where(eq(matchings.id, id));
}

export async function getPartnerStats(partnerId: number) {
  const db = await getDb();
  if (!db) return { total: 0, 요청: 0, 수락: 0, 완료: 0, 거절: 0 };
  const rows = await db.select({
    status: matchings.status,
    count: sql<number>`count(*)`,
  }).from(matchings).where(eq(matchings.partnerId, partnerId)).groupBy(matchings.status);
  const stats: Record<string, number> = { total: 0, 요청: 0, 수락: 0, 완료: 0, 거절: 0 };
  for (const row of rows) {
    stats[row.status] = Number(row.count);
    stats.total += Number(row.count);
  }
  return stats;
}

// ─── 파트너 후기 ──────────────────────────────────────────────────────────────

export async function getReviewsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    review: partnerReviews,
    user: { id: users.id, name: users.name },
  })
    .from(partnerReviews)
    .leftJoin(users, eq(partnerReviews.userId, users.id))
    .where(eq(partnerReviews.partnerId, partnerId))
    .orderBy(desc(partnerReviews.createdAt));
}

export async function createReview(data: InsertPartnerReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(partnerReviews).values(data);
  // 파트너 평점 재계산
  const reviews = await db.select({ rating: partnerReviews.rating }).from(partnerReviews).where(eq(partnerReviews.partnerId, data.partnerId));
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await db.update(partners).set({ rating: avg.toFixed(2), reviewCount: reviews.length }).where(eq(partners.id, data.partnerId));
  return result[0].insertId;
}

// ─── 관리자 통계 ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalPartners: 0, totalAccidents: 0, pendingPartners: 0 };
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [partnerCount] = await db.select({ count: sql<number>`count(*)` }).from(partners).where(eq(partners.status, "active"));
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(partners).where(eq(partners.status, "pending"));
  const [accidentCount] = await db.select({ count: sql<number>`count(*)` }).from(accidents);
  return {
    totalUsers: Number(userCount.count),
    totalPartners: Number(partnerCount.count),
    totalAccidents: Number(accidentCount.count),
    pendingPartners: Number(pendingCount.count),
  };
}
