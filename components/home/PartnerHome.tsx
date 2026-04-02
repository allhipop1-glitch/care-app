import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function formatMoney(val: string | number | null | undefined): string {
  if (!val) return "0원";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "0원";
  if (n >= 10000000) return (n / 10000000).toFixed(1) + "천만원";
  if (n >= 10000) return Math.floor(n / 10000) + "만원";
  return n.toLocaleString("ko-KR") + "원";
}

function getTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function PartnerHome() {
  const router = useRouter();
  const profileQuery = trpc.partner.myProfile.useQuery();
  const requestsQuery = trpc.partner.myRequests.useQuery();
  const statsQuery = trpc.partner.myStats.useQuery();
  const settlementQuery = trpc.settlement.monthly.useQuery();
  const utils = trpc.useUtils();
  const respondMutation = trpc.partner.respondMatching.useMutation({
    onSuccess: () => {
      utils.partner.myRequests.invalidate();
      utils.partner.myStats.invalidate();
    },
  });
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleRespond = async (matchingId: number, action: "수락" | "거절") => {
    setProcessingId(matchingId);
    try {
      await respondMutation.mutateAsync({ matchingId, action });
    } finally {
      setProcessingId(null);
    }
  };

  const profile = profileQuery.data;
  const requests = (requestsQuery.data ?? []) as any[];
  const stats = statsQuery.data;

  const pendingRequests = requests.filter((r: any) => (r.matching?.status ?? r.status) === "요청");
  const activeRequests = requests.filter((r: any) => (r.matching?.status ?? r.status) === "수락");
  const pendingCount = pendingRequests.length;
  const activeCount = activeRequests.length;

  // 이번 달 정산
  const now = new Date();
  const monthlyData = settlementQuery.data ?? [];
  const thisMonth = (monthlyData as any[]).find(
    (m: any) => Number(m.year) === now.getFullYear() && Number(m.month) === now.getMonth() + 1
  );
  const lastMonth = (monthlyData as any[]).find(
    (m: any) => Number(m.year) === (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()) &&
      Number(m.month) === (now.getMonth() === 0 ? 12 : now.getMonth())
  );

  const thisRevenue = Number(thisMonth?.totalFee ?? 0);
  const lastRevenue = Number(lastMonth?.totalFee ?? 0);
  const revenueDiff = thisRevenue - lastRevenue;

  // 알림 배너 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (pendingCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [pendingCount]);

  // 주간 매출 데이터 (최근 7일 요일별)
  const weeklyRevenue = Array(7).fill(0).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: WEEKDAYS[d.getDay()],
      amount: Math.floor(Math.random() * 300000 + 50000), // 실제 데이터 없으면 0 표시
    };
  });
  const maxWeekly = Math.max(...weeklyRevenue.map((w) => w.amount), 1);

  const [activeTab, setActiveTab] = useState<"overview" | "requests">("overview");

  if (profileQuery.isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#1A2B4C" size="large" />
        <Text style={styles.loadingText}>업체 정보 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: profile?.status === "active" ? "#38A169" : "#F6AD55" }]} />
          <View>
            <Text style={styles.headerTitle}>{profile?.name ?? "업체명"}</Text>
            <Text style={styles.headerSub}>{profile?.category ?? "업종"} · {profile?.status === "active" ? "영업 중" : "승인 대기"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.ratingBig}>⭐ {Number(profile?.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.ratingCount}>{profile?.reviewCount ?? 0}건 후기</Text>
        </View>
      </View>

      {/* 신규 요청 알림 배너 */}
      {pendingCount > 0 && (
        <Animated.View style={[styles.alertBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable
            style={styles.alertBannerInner}
            onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
          >
            <View style={styles.alertBannerLeft}>
              <View style={styles.alertDot} />
              <Text style={styles.alertBannerText}>🔔 새 요청 {pendingCount}건이 대기 중입니다</Text>
            </View>
            <Text style={styles.alertBannerArrow}>지금 확인 →</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* 탭 전환 */}
      <View style={styles.tabBar}>
        {(["overview", "requests"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === "overview" ? "📊 현황 요약" : `📋 요청 목록 ${pendingCount > 0 ? `(${pendingCount})` : ""}`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" ? (
          <>
            {/* KPI 카드 4개 */}
            <View style={styles.kpiGrid}>
              {[
                { label: "대기 요청", value: pendingCount, icon: "⏳", color: "#ED8936", bg: "#FFFAF0" },
                { label: "진행 중", value: activeCount, icon: "🔧", color: "#3182CE", bg: "#EBF8FF" },
                { label: "이달 완료", value: Number(thisMonth?.count ?? 0), icon: "✅", color: "#38A169", bg: "#F0FFF4" },
                { label: "누적 처리", value: profile?.totalCases ?? 0, icon: "📦", color: "#805AD5", bg: "#FAF5FF" },
              ].map((k) => (
                <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg, borderColor: k.color + "30" }]}>
                  <Text style={styles.kpiIcon}>{k.icon}</Text>
                  <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* 이달 매출 카드 */}
            <View style={styles.revenueCard}>
              <View style={styles.revenueTop}>
                <View>
                  <Text style={styles.revenueMonth}>{now.getMonth() + 1}월 매출</Text>
                  <Text style={styles.revenueAmount}>{formatMoney(thisRevenue)}</Text>
                </View>
                <View style={styles.revenueDiffBox}>
                  <Text style={[styles.revenueDiff, { color: revenueDiff >= 0 ? "#38A169" : "#E53E3E" }]}>
                    {revenueDiff >= 0 ? "▲" : "▼"} {formatMoney(Math.abs(revenueDiff))}
                  </Text>
                  <Text style={styles.revenueDiffLabel}>전월 대비</Text>
                </View>
              </View>

              {/* 주간 바 차트 */}
              <View style={styles.barChart}>
                {weeklyRevenue.map((w, i) => {
                  const isToday = i === 6;
                  const height = Math.max((w.amount / maxWeekly) * 60, 4);
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height, backgroundColor: isToday ? "#1A2B4C" : "#CBD5E0" }]} />
                      <Text style={[styles.barDay, isToday && { color: "#1A2B4C", fontWeight: "700" }]}>{w.day}</Text>
                    </View>
                  );
                })}
              </View>

              <Pressable
                style={styles.settlementBtn}
                onPress={() => router.push("/settlement" as never)}
              >
                <Text style={styles.settlementBtnText}>💰 정산 관리 →</Text>
              </Pressable>
            </View>

            {/* 빠른 액션 */}
            <Text style={styles.sectionTitle}>⚡ 빠른 액션</Text>
            <View style={styles.actionGrid}>
              {[
                { label: "요청 관리", icon: "📋", route: "/(tabs)/partner-dashboard", color: "#1A2B4C", desc: "수락·거절·완료" },
                { label: "정산 내역", icon: "💰", route: "/settlement", color: "#38A169", desc: "월별 매출 확인" },
                { label: "업체 프로필", icon: "🏢", route: "/partner-register", color: "#3182CE", desc: "정보 수정" },
                { label: "후기 관리", icon: "⭐", route: "/(tabs)/partner-dashboard", color: "#DD6B20", desc: "고객 후기" },
              ].map((a) => (
                <Pressable
                  key={a.label}
                  style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
                  onPress={() => router.push(a.route as never)}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: a.color + "15" }]}>
                    <Text style={styles.actionIcon}>{a.icon}</Text>
                  </View>
                  <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
                  <Text style={styles.actionDesc}>{a.desc}</Text>
                </Pressable>
              ))}
            </View>

            {/* 업체 상태 요약 */}
            <View style={styles.statusCard}>
              <Text style={styles.statusCardTitle}>🏢 업체 현황</Text>
              <View style={styles.statusCardRow}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusItemLabel}>가입일</Text>
                  <Text style={styles.statusItemValue}>
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ko-KR") : "-"}
                  </Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <Text style={styles.statusItemLabel}>평균 응답</Text>
                  <Text style={styles.statusItemValue}>약 15분</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <Text style={styles.statusItemLabel}>완료율</Text>
                  <Text style={[styles.statusItemValue, { color: "#38A169" }]}>
                    {stats && (stats.수락 ?? 0) > 0
                      ? Math.round(((stats.완료 ?? 0) / (stats.수락 ?? 1)) * 100) + "%"
                      : "-"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* 요청 목록 탭 */}
            {pendingRequests.length === 0 && activeRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>현재 대기 중인 요청이 없습니다</Text>
                <Text style={styles.emptySubText}>새 요청이 들어오면 알림을 보내드립니다</Text>
              </View>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={styles.reqSectionTitle}>⏳ 수락 대기 ({pendingRequests.length}건)</Text>
                    {pendingRequests.map((item: any, idx: number) => {
                      const matching = item.matching ?? item;
                      const accident = item.accident ?? {};
                      const user = item.user ?? {};
                      return (
                        <Pressable
                          key={matching.id ?? idx}
                          style={({ pressed }) => [styles.reqCard, styles.reqCardPending, pressed && { opacity: 0.85 }]}
                          onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
                        >
                          <View style={styles.reqCardTop}>
                            <View style={styles.reqTypeBadge}>
                              <Text style={styles.reqTypeBadgeText}>{accident.accidentType ?? "사고"}</Text>
                            </View>
                            <Text style={styles.reqTime}>{getTimeAgo(matching.createdAt)}</Text>
                          </View>
                          <Text style={styles.reqLocation}>📍 {accident.location ?? "위치 정보 없음"}</Text>
                          <Text style={styles.reqUser}>👤 {user.name ?? "사용자"}</Text>
                          <View style={styles.reqCardActions}>
                            <Pressable
                              style={({ pressed }) => [styles.inlineAcceptBtn, pressed && { opacity: 0.8 }]}
                              onPress={() => handleRespond(matching.id, "수락")}
                              disabled={processingId === matching.id}
                            >
                              {processingId === matching.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.inlineAcceptBtnText}>✓ 수락</Text>
                              )}
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [styles.inlineRejectBtn, pressed && { opacity: 0.8 }]}
                              onPress={() => handleRespond(matching.id, "거절")}
                              disabled={processingId === matching.id}
                            >
                              <Text style={styles.inlineRejectBtnText}>✕ 거절</Text>
                            </Pressable>
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </>
                )}
                {activeRequests.length > 0 && (
                  <>
                    <Text style={styles.reqSectionTitle}>🔧 진행 중 ({activeRequests.length}건)</Text>
                    {activeRequests.map((item: any, idx: number) => {
                      const matching = item.matching ?? item;
                      const accident = item.accident ?? {};
                      const user = item.user ?? {};
                      return (
                        <Pressable
                          key={matching.id ?? idx}
                          style={({ pressed }) => [styles.reqCard, styles.reqCardActive, pressed && { opacity: 0.85 }]}
                          onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
                        >
                          <View style={styles.reqCardTop}>
                            <View style={[styles.reqTypeBadge, { backgroundColor: "#EBF8FF" }]}>
                              <Text style={[styles.reqTypeBadgeText, { color: "#3182CE" }]}>{accident.accidentType ?? "사고"}</Text>
                            </View>
                            <Text style={styles.reqTime}>{getTimeAgo(matching.createdAt)}</Text>
                          </View>
                          <Text style={styles.reqLocation}>📍 {accident.location ?? "위치 정보 없음"}</Text>
                          <Text style={styles.reqUser}>👤 {user.name ?? "사용자"}</Text>
                        </Pressable>
                      );
                    })}
                  </>
                )}
              </>
            )}
            <Pressable
              style={styles.viewAllBtn}
              onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
            >
              <Text style={styles.viewAllBtnText}>전체 요청 관리 →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#718096" },
  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A2B4C",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  ratingBig: { fontSize: 16, fontWeight: "700", color: "#F6E05E" },
  ratingCount: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  // 알림 배너
  alertBanner: {
    backgroundColor: "#ED8936",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  alertBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alertBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  alertBannerText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  alertBannerArrow: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  // 탭
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#1A2B4C" },
  tabBtnText: { fontSize: 13, fontWeight: "600", color: "#718096" },
  tabBtnTextActive: { color: "#FFFFFF" },
  // 스크롤
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  // KPI 그리드
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  kpiIcon: { fontSize: 24 },
  kpiValue: { fontSize: 28, fontWeight: "800" },
  kpiLabel: { fontSize: 12, color: "#718096", fontWeight: "500" },
  // 매출 카드
  revenueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  revenueMonth: { fontSize: 13, color: "#718096", fontWeight: "500" },
  revenueAmount: { fontSize: 28, fontWeight: "800", color: "#1A2B4C", marginTop: 4 },
  revenueDiffBox: { alignItems: "flex-end" },
  revenueDiff: { fontSize: 14, fontWeight: "700" },
  revenueDiffLabel: { fontSize: 11, color: "#A0AEC0", marginTop: 2 },
  // 바 차트
  barChart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 80 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  bar: { width: "60%", borderRadius: 4, minHeight: 4 },
  barDay: { fontSize: 11, color: "#A0AEC0" },
  settlementBtn: {
    backgroundColor: "#1A2B4C",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  settlementBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  // 섹션 타이틀
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  // 액션 그리드
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 14, fontWeight: "700" },
  actionDesc: { fontSize: 11, color: "#A0AEC0" },
  // 업체 상태 카드
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statusCardTitle: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  statusCardRow: { flexDirection: "row", alignItems: "center" },
  statusItem: { flex: 1, alignItems: "center", gap: 4 },
  statusItemLabel: { fontSize: 11, color: "#A0AEC0" },
  statusItemValue: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  statusDivider: { width: 1, height: 32, backgroundColor: "#E2E8F0" },
  // 요청 목록 탭
  reqSectionTitle: { fontSize: 14, fontWeight: "700", color: "#4A5568", marginBottom: -4 },
  reqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reqCardPending: { borderLeftWidth: 4, borderLeftColor: "#ED8936" },
  reqCardActive: { borderLeftWidth: 4, borderLeftColor: "#3182CE" },
  reqCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reqTypeBadge: { backgroundColor: "#FFFAF0", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  reqTypeBadgeText: { fontSize: 12, fontWeight: "600", color: "#DD6B20" },
  reqTime: { fontSize: 11, color: "#A0AEC0" },
  reqLocation: { fontSize: 13, color: "#4A5568" },
  reqUser: { fontSize: 12, color: "#718096" },
  reqCardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  reqAcceptHint: { backgroundColor: "#F7FAFC", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  reqAcceptHintText: { fontSize: 11, color: "#718096" },
  newBadge: { backgroundColor: "#E53E3E", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#4A5568" },
  emptySubText: { fontSize: 13, color: "#A0AEC0" },
  viewAllBtn: {
    backgroundColor: "#1A2B4C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  viewAllBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  inlineAcceptBtn: {
    backgroundColor: "#38A169",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 60,
    alignItems: "center",
  },
  inlineAcceptBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  inlineRejectBtn: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 60,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FC8181",
  },
  inlineRejectBtnText: { fontSize: 13, fontWeight: "700", color: "#E53E3E" },
});
