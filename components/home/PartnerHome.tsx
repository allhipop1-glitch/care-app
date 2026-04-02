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

const ACCIDENT_TYPE_ICON: Record<string, string> = {
  "차량 단독사고": "🚗",
  "차량 대 차량": "💥",
  "차량 대 보행자": "🚶",
  "차량 대 이륜차": "🏍️",
  "주차장 사고": "🅿️",
};

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

  const handleQuickAccept = async (matchingId: number) => {
    setProcessingId(matchingId);
    try {
      await respondMutation.mutateAsync({ matchingId, action: "수락" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickReject = async (matchingId: number) => {
    setProcessingId(matchingId);
    try {
      await respondMutation.mutateAsync({ matchingId, action: "거절" });
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

  // 알림 배너 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (pendingCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [pendingCount]);

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

      {/* 신규 요청 긴급 알림 배너 */}
      {pendingCount > 0 && (
        <Animated.View style={[styles.urgentBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable
            style={styles.urgentBannerInner}
            onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
          >
            <View style={styles.urgentLeft}>
              <View style={styles.urgentDot} />
              <Text style={styles.urgentText}>🔔 새 고객 요청 {pendingCount}건 대기 중!</Text>
            </View>
            <Text style={styles.urgentAction}>지금 수락 →</Text>
          </Pressable>
        </Animated.View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 오늘의 통계 */}
        <View style={styles.todayStatsCard}>
          <Text style={styles.todayStatsTitle}>📊 오늘의 통계</Text>
          <View style={styles.todayStatsRow}>
            {[
              { label: "신규 요청", value: pendingCount, icon: "🔔", color: "#ED8936" },
              { label: "진행 중", value: activeCount, icon: "🔧", color: "#3182CE" },
              { label: "이달 완료", value: Number(thisMonth?.count ?? 0), icon: "✅", color: "#38A169" },
              { label: "이달 수익", value: formatMoney(thisMonth?.totalFee ?? 0), icon: "💰", color: "#805AD5" },
            ].map((s) => (
              <View key={s.label} style={styles.todayStatItem}>
                <Text style={styles.todayStatIcon}>{s.icon}</Text>
                <Text style={[styles.todayStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.todayStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 신규 요청 목록 (최대 3개) */}
        {pendingRequests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 새 고객 요청</Text>
              <Pressable onPress={() => router.push("/(tabs)/partner-dashboard" as never)}>
                <Text style={styles.sectionLink}>전체 보기 →</Text>
              </Pressable>
            </View>
            {pendingRequests.slice(0, 3).map((item: any, idx: number) => {
              const matching = item.matching ?? item;
              const accident = item.accident ?? {};
              const user = item.user ?? {};
              const matchingId = matching.id;
              const isProcessing = processingId === matchingId;
              const typeIcon = ACCIDENT_TYPE_ICON[accident.accidentType] ?? "🚗";

              return (
                <Animated.View key={matchingId ?? idx} style={[styles.requestCard, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.requestCardTop}>
                    <View style={styles.newBadge}>
                      <View style={styles.newBadgeDot} />
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                    <Text style={styles.requestTime}>{getTimeAgo(matching.requestedAt ?? matching.createdAt)}</Text>
                  </View>

                  <View style={styles.requestTypeRow}>
                    <Text style={styles.requestTypeIcon}>{typeIcon}</Text>
                    <View style={styles.requestTypeInfo}>
                      <Text style={styles.requestTypeName}>{accident.accidentType ?? "사고 유형"}</Text>
                      <Text style={styles.requestLocation} numberOfLines={1}>
                        📍 {accident.location ?? "위치 정보 없음"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestCustomerRow}>
                    <Text style={styles.requestCustomer}>👤 {user.name ?? "고객"}</Text>
                    {accident.injuryLevel && accident.injuryLevel !== "없음" && (
                      <View style={styles.injuryBadge}>
                        <Text style={styles.injuryText}>부상: {accident.injuryLevel}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.requestActions}>
                    <Pressable
                      style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.7 }, isProcessing && { opacity: 0.5 }]}
                      onPress={() => handleQuickReject(matchingId)}
                      disabled={isProcessing}
                    >
                      <Text style={styles.rejectBtnText}>✕ 거절</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.9 }, isProcessing && { opacity: 0.7 }]}
                      onPress={() => handleQuickAccept(matchingId)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.acceptBtnText}>✓ 수락하기</Text>
                      )}
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
            {pendingRequests.length > 3 && (
              <Pressable
                style={styles.viewMoreBtn}
                onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
              >
                <Text style={styles.viewMoreBtnText}>
                  +{pendingRequests.length - 3}건 더 보기 →
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* 진행 중 요청 (최대 3개) */}
        {activeRequests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔧 진행 중</Text>
              <Pressable onPress={() => router.push("/(tabs)/partner-dashboard" as never)}>
                <Text style={styles.sectionLink}>전체 보기 →</Text>
              </Pressable>
            </View>
            {activeRequests.slice(0, 3).map((item: any, idx: number) => {
              const matching = item.matching ?? item;
              const accident = item.accident ?? {};
              const user = item.user ?? {};

              return (
                <Pressable
                  key={matching.id ?? idx}
                  style={({ pressed }) => [styles.activeCard, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
                >
                  <View style={styles.activeCardTop}>
                    <View style={styles.activeCardLeft}>
                      <Text style={styles.activeAccidentType}>{accident.accidentType ?? "사고"}</Text>
                      <Text style={styles.activeCustomer}>👤 {user.name ?? "고객"}</Text>
                      <Text style={styles.activeLocation} numberOfLines={1}>📍 {accident.location ?? "위치 미상"}</Text>
                    </View>
                    <View style={styles.activeCardRight}>
                      <View style={styles.activeStatusBadge}>
                        <Text style={styles.activeStatusText}>진행중</Text>
                      </View>
                      <Text style={styles.activeTime}>{getTimeAgo(matching.requestedAt ?? matching.createdAt)}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        {/* 빠른 액션 */}
        <Text style={styles.sectionTitle}>⚡ 빠른 액션</Text>
        <View style={styles.actionGrid}>
          {[
            { label: "요청 관리", icon: "📋", route: "/(tabs)/partner-dashboard", color: "#1A2B4C", desc: `${pendingCount}건 대기` },
            { label: "정산 내역", icon: "💰", route: "/settlement", color: "#38A169", desc: "월별 매출" },
            { label: "업체 프로필", icon: "🏢", route: "/partner-register", color: "#3182CE", desc: "정보 수정" },
            { label: "후기 관리", icon: "⭐", route: "/(tabs)/partner-dashboard", color: "#DD6B20", desc: `평점 ${Number(profile?.rating ?? 0).toFixed(1)}` },
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

        {/* 업체 성과 */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>🏆 나의 성과</Text>
          <View style={styles.performanceRow}>
            {[
              { label: "누적 처리", value: profile?.totalCases ?? 0, color: "#3182CE" },
              { label: "완료율", value: (stats && (stats.수락 ?? 0) > 0 ? Math.round(((stats.완료 ?? 0) / (stats.수락 ?? 1)) * 100) + "%" : "-"), color: "#38A169" },
              { label: "평균 평점", value: Number(profile?.rating ?? 0).toFixed(1), color: "#ED8936" },
            ].map((p, i) => (
              <React.Fragment key={p.label}>
                {i > 0 && <View style={styles.performanceDivider} />}
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: p.color }]}>{p.value}</Text>
                  <Text style={styles.performanceLabel}>{p.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 빈 상태 (요청 없을 때) */}
        {pendingCount === 0 && activeCount === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>새 요청이 없습니다</Text>
            <Text style={styles.emptyDesc}>새 고객 요청이 들어오면 알림을 보내드립니다</Text>
            <View style={styles.emptyTips}>
              <Text style={styles.emptyTipsTitle}>💡 고객 유입 팁</Text>
              <Text style={styles.emptyTipsText}>• 프로필 정보를 완성하면 매칭 우선순위가 높아집니다</Text>
              <Text style={styles.emptyTipsText}>• 빠른 응답률이 높을수록 더 많은 요청을 받습니다</Text>
              <Text style={styles.emptyTipsText}>• 고객 후기 관리로 평점을 높이세요</Text>
            </View>
          </View>
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
  // 긴급 배너
  urgentBanner: {
    backgroundColor: "#ED8936",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  urgentBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  urgentLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  urgentText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  urgentAction: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  // 스크롤
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  // 오늘의 통계
  todayStatsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  todayStatsTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  todayStatsRow: { flexDirection: "row", gap: 8 },
  todayStatItem: { flex: 1, alignItems: "center", gap: 4 },
  todayStatIcon: { fontSize: 20 },
  todayStatValue: { fontSize: 18, fontWeight: "800" },
  todayStatLabel: { fontSize: 10, color: "#A0AEC0", textAlign: "center" },
  // 섹션 헤더
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  sectionLink: { fontSize: 13, fontWeight: "600", color: "#3182CE" },
  // 요청 카드
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#ED8936",
  },
  requestCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF3E0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ED8936" },
  newBadgeText: { fontSize: 11, fontWeight: "800", color: "#ED8936" },
  requestTime: { fontSize: 11, color: "#A0AEC0" },
  requestTypeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  requestTypeIcon: { fontSize: 32 },
  requestTypeInfo: { flex: 1, gap: 3 },
  requestTypeName: { fontSize: 16, fontWeight: "800", color: "#1A2B4C" },
  requestLocation: { fontSize: 13, color: "#4A5568" },
  requestCustomerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  requestCustomer: { fontSize: 13, color: "#718096" },
  injuryBadge: { backgroundColor: "#FFF5F5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  injuryText: { fontSize: 11, fontWeight: "600", color: "#E53E3E" },
  requestActions: { flexDirection: "row", gap: 8 },
  rejectBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rejectBtnText: { fontSize: 14, fontWeight: "700", color: "#718096" },
  acceptBtn: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#38A169",
  },
  acceptBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  viewMoreBtn: {
    backgroundColor: "#EBF8FF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  viewMoreBtnText: { fontSize: 13, fontWeight: "700", color: "#3182CE" },
  // 진행중 카드
  activeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#3182CE",
  },
  activeCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  activeCardLeft: { flex: 1, gap: 4 },
  activeAccidentType: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  activeCustomer: { fontSize: 12, color: "#718096" },
  activeLocation: { fontSize: 12, color: "#A0AEC0" },
  activeCardRight: { alignItems: "flex-end", gap: 6 },
  activeStatusBadge: { backgroundColor: "#EBF8FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  activeStatusText: { fontSize: 11, fontWeight: "700", color: "#3182CE" },
  activeTime: { fontSize: 10, color: "#A0AEC0" },
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
  // 성과 카드
  performanceCard: {
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
  performanceTitle: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  performanceRow: { flexDirection: "row", alignItems: "center" },
  performanceItem: { flex: 1, alignItems: "center", gap: 4 },
  performanceValue: { fontSize: 20, fontWeight: "800" },
  performanceLabel: { fontSize: 11, color: "#A0AEC0" },
  performanceDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0" },
  // 빈 상태
  emptyBox: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#4A5568" },
  emptyDesc: { fontSize: 13, color: "#A0AEC0" },
  emptyTips: {
    backgroundColor: "#F7FAFC",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    width: "100%",
    marginTop: 8,
  },
  emptyTipsTitle: { fontSize: 13, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 },
  emptyTipsText: { fontSize: 12, color: "#718096", lineHeight: 18 },
});
