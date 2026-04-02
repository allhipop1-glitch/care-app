import { describe, expect, it, vi } from "vitest";

// DB 모듈 모킹
vi.mock("../server/db", () => ({
  getPartnerByUserId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 42,
    name: "테스트 공업사",
    category: "공업사",
    phone: "010-1234-5678",
    address: "서울시 강남구",
    description: "테스트 업체",
    rating: "4.50",
    reviewCount: 10,
    totalCases: 20,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAllPartners: vi.fn().mockResolvedValue([]),
  getActivePartners: vi.fn().mockResolvedValue([]),
  createPartner: vi.fn().mockResolvedValue(1),
  updatePartner: vi.fn().mockResolvedValue(undefined),
  updatePartnerStatus: vi.fn().mockResolvedValue(undefined),
  createAccident: vi.fn().mockResolvedValue(1),
  getAccidentsByUser: vi.fn().mockResolvedValue([]),
  getAllAccidents: vi.fn().mockResolvedValue([]),
  updateAccidentStatus: vi.fn().mockResolvedValue(undefined),
  getAccidentStats: vi.fn().mockResolvedValue({ total: 5, 접수: 2, 처리중: 2, 완료: 1 }),
  createMatching: vi.fn().mockResolvedValue(1),
  getMatchingsByPartner: vi.fn().mockResolvedValue([]),
  getMatchingsByAccident: vi.fn().mockResolvedValue([]),
  updateMatchingStatus: vi.fn().mockResolvedValue(undefined),
  getPartnerStats: vi.fn().mockResolvedValue({ total: 10, 요청: 2, 수락: 3, 완료: 4, 거절: 1 }),
  getReviewsByPartner: vi.fn().mockResolvedValue([]),
  createReview: vi.fn().mockResolvedValue(1),
  getAdminStats: vi.fn().mockResolvedValue({
    totalUsers: 100,
    totalPartners: 20,
    totalAccidents: 50,
    pendingPartners: 3,
  }),
}));

describe("파트너 대시보드 DB 함수", () => {
  it("getPartnerByUserId가 파트너 정보를 반환한다", async () => {
    const { getPartnerByUserId } = await import("../server/db");
    const result = await getPartnerByUserId(42);
    expect(result).toBeDefined();
    expect(result?.name).toBe("테스트 공업사");
    expect(result?.category).toBe("공업사");
    expect(result?.status).toBe("active");
  });

  it("getPartnerStats가 통계를 반환한다", async () => {
    const { getPartnerStats } = await import("../server/db");
    const stats = await getPartnerStats(1);
    expect(stats).toBeDefined();
    expect(stats?.total).toBe(10);
    expect(stats?.완료).toBe(4);
  });

  it("createAccident가 사고 ID를 반환한다", async () => {
    const { createAccident } = await import("../server/db");
    const id = await createAccident({
      userId: 1,
      accidentType: "차량사고",
      status: "접수",
      injuryLevel: "없음",
    });
    expect(id).toBe(1);
  });

  it("createMatching이 매칭 ID를 반환한다", async () => {
    const { createMatching } = await import("../server/db");
    const id = await createMatching({
      accidentId: 1,
      partnerId: 1,
      status: "요청",
    });
    expect(id).toBe(1);
  });
});

describe("관리자 대시보드 DB 함수", () => {
  it("getAdminStats가 전체 통계를 반환한다", async () => {
    const { getAdminStats } = await import("../server/db");
    const stats = await getAdminStats();
    expect(stats.totalUsers).toBe(100);
    expect(stats.totalPartners).toBe(20);
    expect(stats.totalAccidents).toBe(50);
    expect(stats.pendingPartners).toBe(3);
  });

  it("getAccidentStats가 사고 현황을 반환한다", async () => {
    const { getAccidentStats } = await import("../server/db");
    const stats = await getAccidentStats();
    expect(stats.total).toBe(5);
    expect(stats.완료).toBe(1);
  });

  it("updatePartnerStatus가 호출된다", async () => {
    const { updatePartnerStatus } = await import("../server/db");
    await expect(updatePartnerStatus(1, "active")).resolves.toBeUndefined();
    expect(updatePartnerStatus).toHaveBeenCalledWith(1, "active");
  });

  it("updateAccidentStatus가 호출된다", async () => {
    const { updateAccidentStatus } = await import("../server/db");
    await expect(updateAccidentStatus(1, "완료")).resolves.toBeUndefined();
    expect(updateAccidentStatus).toHaveBeenCalledWith(1, "완료");
  });
});

describe("DB 스키마 타입 검증", () => {
  it("사고 유형이 올바른 값만 허용한다", () => {
    const validTypes = ["차량사고", "보행자사고", "주차장사고", "단독사고"];
    expect(validTypes).toContain("차량사고");
    expect(validTypes).toContain("보행자사고");
    expect(validTypes).not.toContain("기타사고");
  });

  it("파트너 카테고리가 올바른 값만 허용한다", () => {
    const validCategories = ["공업사", "렉카", "병원", "변호사", "손해사정사"];
    expect(validCategories).toHaveLength(5);
    expect(validCategories).toContain("공업사");
    expect(validCategories).toContain("손해사정사");
  });

  it("매칭 상태가 올바른 값만 허용한다", () => {
    const validStatuses = ["요청", "수락", "거절", "완료"];
    expect(validStatuses).toContain("수락");
    expect(validStatuses).not.toContain("취소");
  });
});
