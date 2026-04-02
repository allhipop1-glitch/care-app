import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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
  return n.toLocaleString("ko-KR") + "원";
}

export function PartnerHome() {
  const router = useRouter();
  const profileQuery = trpc.partner.myProfile.useQuery();
  const requestsQuery = trpc.partner.myRequests.useQuery();
  const statsQuery = trpc.partner.myStats.useQuery();
  const settlementQuery = trpc.settlement.monthly.useQuery();

  const profile = profileQuery.data;
  const requests = (requestsQuery.data ?? []) as any[];
  const stats = statsQuery.data;

  const pendingCount = requests.filter((r: any) => (r.matching?.status ?? r.status) === "요청").length;
  const activeCount = requests.filter((r: any) => (r.matching?.status ?? r.status) === "수락").length;

  // 이번 달 정산
  const now = new Date();
  const thisMonth = (settlementQuery.data ?? []).find(
    (m: any) => Number(m.year) === now.getFullYear() && Number(m.month) === now.getMonth() + 1
  );

  if (profileQuery.isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#3182CE" size="large" />
        <Text style={styles.loadingText}>업체 정보 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 업체 프로필 헤더 */}
      <View style={styles.profileCard}>
        <View style={styles.profileLeft}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{profile?.category ?? "업체"}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.name ?? "업체명"}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: profile?.status === "active" ? "#38A169" : "#F6AD55" }]} />
            <Text style={styles.statusText}>
              {profile?.status === "active" ? "영업 중" : profile?.status === "pending" ? "승인 대기" : "비활성"}
            </Text>
            <Text style={styles.ratingText}>  ⭐ {Number(profile?.rating ?? 0).toFixed(1)} ({profile?.reviewCount ?? 0}건)</Text>
          </View>
        </View>
        <View style={styles.profileRight}>
          <Text style={styles.totalCasesNum}>{profile?.totalCases ?? 0}</Text>
          <Text style={styles.totalCasesLabel}>누적 처리</Text>
        </View>
      </View>

      {/* 업체 포털 대시보드 진입 대형 카드 */}
      <Pressable
        style={({ pressed }) => [styles.dashboardEntryCard, pressed && { opacity: 0.9 }]}
        onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
      >
        <View style={styles.dashboardEntryLeft}>
          <Text style={styles.dashboardEntryIcon}>🏢</Text>
          <View>
            <Text style={styles.dashboardEntryTitle}>업체 포털 대시보드</Text>
            <Text style={styles.dashboardEntryDesc}>요청 관리 · 수락/거절 · 완료 처리</Text>
          </View>
        </View>
        <View style={styles.dashboardEntryBadge}>
          {pendingCount > 0 && (
            <View style={styles.dashboardEntryBadgeDot}>
              <Text style={styles.dashboardEntryBadgeNum}>{pendingCount}</Text>
            </View>
          )}
          <Text style={styles.dashboardEntryArrow}>›</Text>
        </View>
      </Pressable>

      {/* 오늘 요청 현황 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📋 오늘 요청 현황</Text>
        <Pressable onPress={() => router.push("/(tabs)/partner-dashboard" as never)}>
          <Text style={styles.sectionMore}>전체 보기 →</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "대기 중", value: pendingCount, color: "#ED8936", bg: "#FFFAF0", icon: "⏳" },
          { label: "진행 중", value: activeCount, color: "#3182CE", bg: "#EBF8FF", icon: "🔧" },
          { label: "전체 완료", value: stats?.완료 ?? 0, color: "#38A169", bg: "#F0FFF4", icon: "✅" },
          { label: "거절", value: stats?.거절 ?? 0, color: "#E53E3E", bg: "#FFF5F5", icon: "❌" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.color + "40" }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 이번 달 정산 요약 */}
      <View style={styles.settlementCard}>
        <View style={styles.settlementLeft}>
          <Text style={styles.settlementMonth}>{now.getMonth() + 1}월 정산 요약</Text>
          <Text style={styles.settlementRevenue}>{formatMoney(thisMonth?.totalFee)}</Text>
          <Text style={styles.settlementCases}>{Number(thisMonth?.count ?? 0)}건 완료</Text>
        </View>
        <Pressable
          style={styles.settlementBtn}
          onPress={() => router.push("/settlement" as never)}
        >
          <Text style={styles.settlementBtnText}>정산 관리</Text>
          <Text style={{ color: "#fff", fontSize: 14 }}>→</Text>
        </Pressable>
      </View>

      {/* 대기 중인 요청 미리보기 */}
      {pendingCount > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔔 대기 중인 요청</Text>
          </View>
          {requests
            .filter((r: any) => (r.matching?.status ?? r.status) === "요청")
            .slice(0, 3)
            .map((item: any, idx: number) => {
              const matching = item.matching ?? item;
              const accident = item.accident ?? {};
              const user = item.user ?? {};
              return (
                <Pressable
                  key={matching.id ?? idx}
                  style={styles.requestCard}
                  onPress={() => router.push("/(tabs)/partner-dashboard" as never)}
                >
                  <View style={styles.requestLeft}>
                    <Text style={styles.requestType}>{accident.accidentType ?? "사고"}</Text>
                    <Text style={styles.requestLocation} numberOfLines={1}>
                      📍 {accident.location ?? "위치 정보 없음"}
                    </Text>
                    <Text style={styles.requestUser}>👤 {user.name ?? "사용자"}</Text>
                  </View>
                  <View style={styles.requestRight}>
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                    <Text style={styles.requestArrow}>›</Text>
                  </View>
                </Pressable>
              );
            })}
        </>
      )}

      {/* 빠른 메뉴 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚡ 빠른 메뉴</Text>
      </View>
      <View style={styles.quickMenuRow}>
        {[
          { label: "업체 포털", icon: "🏢", route: "/(tabs)/partner-dashboard" },
          { label: "정산 관리", icon: "💰", route: "/settlement" },
          { label: "후기 확인", icon: "⭐", route: "/(tabs)/partner-dashboard" },
          { label: "업체 정보", icon: "📝", route: "/(tabs)/my" },
        ].map((m) => (
          <Pressable
            key={m.label}
            style={styles.quickMenuBtn}
            onPress={() => router.push(m.route as never)}
          >
            <Text style={styles.quickMenuIcon}>{m.icon}</Text>
            <Text style={styles.quickMenuLabel}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F7FAFC" },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#718096" },
  profileCard: {
    backgroundColor: "#1A2B4C",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileLeft: { gap: 6 },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  categoryText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  ratingText: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  profileRight: { alignItems: "center" },
  totalCasesNum: { fontSize: 32, fontWeight: "800", color: "#fff" },
  totalCasesLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  sectionMore: { fontSize: 13, color: "#3182CE", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statIcon: { fontSize: 18 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#718096" },
  settlementCard: {
    backgroundColor: "#1A2B4C",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settlementLeft: { gap: 4 },
  settlementMonth: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  settlementRevenue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  settlementCases: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  settlementBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settlementBtnText: { fontSize: 14, color: "#fff", fontWeight: "700" },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    borderLeftColor: "#ED8936",
  },
  requestLeft: { gap: 3 },
  requestType: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  requestLocation: { fontSize: 12, color: "#718096" },
  requestUser: { fontSize: 12, color: "#4A5568" },
  requestRight: { alignItems: "center", gap: 6 },
  newBadge: {
    backgroundColor: "#E53E3E",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, color: "#fff", fontWeight: "800" },
  requestArrow: { fontSize: 20, color: "#A0AEC0" },
  quickMenuRow: { flexDirection: "row", gap: 10 },
  quickMenuBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickMenuIcon: { fontSize: 24 },
  quickMenuLabel: { fontSize: 12, fontWeight: "600", color: "#4A5568" },
  // 대시보드 진입 카드
  dashboardEntryCard: {
    backgroundColor: "#1A2B4C",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardEntryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dashboardEntryIcon: { fontSize: 28 },
  dashboardEntryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  dashboardEntryDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  dashboardEntryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dashboardEntryBadgeDot: {
    backgroundColor: "#E53E3E",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  dashboardEntryBadgeNum: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dashboardEntryArrow: {
    fontSize: 28,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "300",
  },
});
