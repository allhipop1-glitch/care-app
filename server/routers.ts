import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAccident,
  createMatching,
  createPartner,
  createReview,
  getAccidentStats,
  getAccidentsByUser,
  getActivePartners,
  getAdminStats,
  getAllAccidents,
  getAllPartners,
  getMatchingsByAccident,
  getMatchingsByPartner,
  getPartnerByUserId,
  getPartnerStats,
  getReviewsByPartner,
  updateAccidentStatus,
  updateMatchingStatus,
  updatePartner,
  updatePartnerStatus,
} from "./db";

// ─── 사고 접수 라우터 ─────────────────────────────────────────────────────────

const accidentRouter = router({
  // 사고 접수 생성
  create: protectedProcedure
    .input(
      z.object({
        accidentType: z.enum(["차량사고", "보행자사고", "주차장사고", "단독사고"]),
        location: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
        injuryLevel: z.enum(["없음", "경상", "중상", "불명"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createAccident({
        userId: ctx.user.id,
        accidentType: input.accidentType,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        description: input.description,
        injuryLevel: input.injuryLevel ?? "없음",
        status: "접수",
      });
      return { id };
    }),

  // 내 사고 목록
  myList: protectedProcedure.query(async ({ ctx }) => {
    return getAccidentsByUser(ctx.user.id);
  }),

  // 파트너 매칭 요청
  requestMatching: protectedProcedure
    .input(
      z.object({
        accidentId: z.number(),
        partnerIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ input }) => {
      const ids: number[] = [];
      for (const partnerId of input.partnerIds) {
        const id = await createMatching({
          accidentId: input.accidentId,
          partnerId,
          status: "요청",
        });
        ids.push(id);
      }
      await updateAccidentStatus(input.accidentId, "파트너매칭");
      return { matchingIds: ids };
    }),
});

// ─── 파트너 업체 라우터 ───────────────────────────────────────────────────────

const partnerRouter = router({
  // 활성 파트너 목록 (공개)
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      return getActivePartners(input.category);
    }),

  // 내 파트너 프로필 조회
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const partner = await getPartnerByUserId(ctx.user.id);
    if (!partner) return null;
    return partner;
  }),

  // 내 매칭 요청 목록
  myRequests: protectedProcedure.query(async ({ ctx }) => {
    const partner = await getPartnerByUserId(ctx.user.id);
    if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "파트너 프로필이 없습니다" });
    return getMatchingsByPartner(partner.id);
  }),

  // 매칭 수락/거절
  respondMatching: protectedProcedure
    .input(
      z.object({
        matchingId: z.number(),
        action: z.enum(["수락", "거절"]),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const partner = await getPartnerByUserId(ctx.user.id);
      if (!partner) throw new TRPCError({ code: "FORBIDDEN", message: "파트너 권한이 없습니다" });
      await updateMatchingStatus(input.matchingId, input.action, {
        respondedAt: new Date(),
        note: input.note,
      });
      return { success: true };
    }),

  // 매칭 완료 처리
  completeMatching: protectedProcedure
    .input(
      z.object({
        matchingId: z.number(),
        fee: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const partner = await getPartnerByUserId(ctx.user.id);
      if (!partner) throw new TRPCError({ code: "FORBIDDEN", message: "파트너 권한이 없습니다" });
      await updateMatchingStatus(input.matchingId, "완료", {
        completedAt: new Date(),
        fee: input.fee,
        note: input.note,
      });
      return { success: true };
    }),

  // 내 통계
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const partner = await getPartnerByUserId(ctx.user.id);
    if (!partner) return null;
    return getPartnerStats(partner.id);
  }),

  // 후기 목록
  reviews: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ input }) => {
      return getReviewsByPartner(input.partnerId);
    }),

  // 후기 작성
  writeReview: protectedProcedure
    .input(
      z.object({
        partnerId: z.number(),
        matchingId: z.number(),
        rating: z.number().min(1).max(5),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createReview({
        partnerId: input.partnerId,
        userId: ctx.user.id,
        matchingId: input.matchingId,
        rating: input.rating,
        content: input.content,
      });
      return { id };
    }),

  // 파트너 프로필 업데이트
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const partner = await getPartnerByUserId(ctx.user.id);
      if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "파트너 프로필이 없습니다" });
      await updatePartner(partner.id, input);
      return { success: true };
    }),
});

// ─── 관리자 라우터 ────────────────────────────────────────────────────────────

const adminRouter = router({
  // 대시보드 통계
  stats: adminProcedure.query(async () => {
    const [adminStats, accidentStats] = await Promise.all([getAdminStats(), getAccidentStats()]);
    return { ...adminStats, accidentStats };
  }),

  // 전체 사고 목록
  accidents: adminRouter_accidents(),

  // 파트너 관리
  partners: adminRouter_partners(),
});

function adminRouter_accidents() {
  return router({
    list: adminProcedure.query(async () => {
      return getAllAccidents();
    }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["접수", "증거수집", "파트너매칭", "처리중", "완료"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updateAccidentStatus(input.id, input.status);
        return { success: true };
      }),

    matchings: adminProcedure
      .input(z.object({ accidentId: z.number() }))
      .query(async ({ input }) => {
        return getMatchingsByAccident(input.accidentId);
      }),

    assignPartner: adminProcedure
      .input(z.object({ accidentId: z.number(), partnerId: z.number() }))
      .mutation(async ({ input }) => {
        const id = await createMatching({
          accidentId: input.accidentId,
          partnerId: input.partnerId,
          status: "요청",
        });
        await updateAccidentStatus(input.accidentId, "파트너매칭");
        return { matchingId: id };
      }),
  });
}

function adminRouter_partners() {
  return router({
    list: adminProcedure.query(async () => {
      return getAllPartners();
    }),

    register: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string(),
          category: z.enum(["공업사", "렉카", "병원", "변호사", "손해사정사"]),
          phone: z.string(),
          address: z.string(),
          description: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const id = await createPartner({ ...input, status: "active" });
        return { id };
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "inactive", "pending"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updatePartnerStatus(input.id, input.status);
        return { success: true };
      }),
  });
}

// ─── 앱 라우터 ────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  accident: accidentRouter,
  partner: partnerRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
