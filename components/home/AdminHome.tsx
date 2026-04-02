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

export function AdminHome() {
  const router = useRouter();
  const statsQuery = trpc.admin.stats.useQuery();
  const accidentsQuery = trpc.admin.accidents.list.useQuery();
  const partnersQuery = trpc.admin.partners.list.useQuery();

  const stats = statsQuery.data;
  const accidents = (accidentsQuery.data ?? []) as any[];
  const partners = (partnersQuery.data ?? []) as any[];

  const pendingPartners = partners.filter((p: any) => p.status === "pending");
  const recentAccidents = accidents.slice(0, 5);

  const STATUS_COLOR: Record<string, string> = {
    접수: "#ED8936",
    증거수집: "#3182CE",
    파트너매칭: "#805AD5",
    처리중: "#F59E0B",
    완료: "#38A169",
  };

  if (statsQuery.isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#3182CE" size="large" />
        <Text style={styles.loadingText}>관리자 데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 관리자 헤더 */}
      <View style={styles.adminHeader}>
        <View>
          <Text style={styles.adminBadge}>🛡️ 관리자 대시보드</Text>
          <Text style={styles.adminTitle}>사고케어 운영 현황</Text>
        </View>
        <Pressable
          style={styles.adminDashBtn}
          onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
        >
          <Text style={styles.adminDashBtnText}>전체 보기</Text>
        </Pressable>
      </View>

      {/* 관리자 대시보드 진입 대형 카드 */}
      <Pressable
        style={({ pressed }) => [styles.adminEntryCard, pressed && { opacity: 0.9 }]}
        onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
      >
        <View style={styles.adminEntryLeft}>
          <Text style={styles.adminEntryIcon}>🛡️</Text>
          <View>
            <Text style={styles.adminEntryTitle}>관리자 대시보드</Text>
            <Text style={styles.adminEntryDesc}>사고 관리 · 파트너 승인 · 전체 통계</Text>
          </View>
        </View>
        <View style={styles.adminEntryRight}>
          {pendingPartners.length > 0 && (
            <View style={styles.adminEntryAlert}>
              <Text style={styles.adminEntryAlertText}>승인 대기 {pendingPartners.length}건</Text>
            </View>
          )}
          <Text style={styles.adminEntryArrow}>›</Text>
        </View>
      </Pressable>

      {/* 핵심 지표 */}
      <View style={styles.metricsGrid}>
        {[
          { label: "전체 사용자", value: stats?.totalUsers ?? 0, icon: "👥", color: "#3182CE" },
          { label: "활성 파트너", value: stats?.totalPartners ?? 0, icon: "🏢", color: "#38A169" },
          { label: "전체 사고", value: stats?.totalAccidents ?? 0, icon: "🚗", color: "#ED8936" },
          { label: "승인 대기", value: stats?.pendingPartners ?? 0, icon: "⏳", color: "#E53E3E" },
        ].map((m) => (
          <View key={m.label} style={[styles.metricCard, { borderTopColor: m.color }]}>
            <Text style={styles.metricIcon}>{m.icon}</Text>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* 사고 유형별 현황 */}
      {stats?.accidentStats && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 사고 처리 현황</Text>
          </View>
          <View style={styles.accidentStatsRow}>
            {Object.entries(stats.accidentStats as Record<string, number>).map(([status, count]) => (
              <View key={status} style={[styles.accidentStatChip, { borderColor: STATUS_COLOR[status] ?? "#718096" }]}>
                <View style={[styles.accidentStatDot, { backgroundColor: STATUS_COLOR[status] ?? "#718096" }]} />
                <Text style={styles.accidentStatLabel}>{status}</Text>
                <Text style={[styles.accidentStatCount, { color: STATUS_COLOR[status] ?? "#718096" }]}>{count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* 승인 대기 파트너 */}
      {pendingPartners.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏳ 파트너 승인 대기 ({pendingPartners.length})</Text>
            <Pressable onPress={() => router.push("/(tabs)/admin-dashboard" as never)}>
              <Text style={styles.sectionMore}>승인하기 →</Text>
            </Pressable>
          </View>
          {pendingPartners.slice(0, 3).map((p: any) => (
            <Pressable
              key={p.id}
              style={styles.pendingCard}
              onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
            >
              <View style={styles.pendingLeft}>
                <View style={styles.pendingCategoryBadge}>
                  <Text style={styles.pendingCategoryText}>{p.category}</Text>
                </View>
                <Text style={styles.pendingName}>{p.name}</Text>
                <Text style={styles.pendingPhone}>{p.phone}</Text>
              </View>
              <View style={styles.pendingRight}>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>심사 중</Text>
                </View>
                <Text style={styles.pendingArrow}>›</Text>
              </View>
            </Pressable>
          ))}
        </>
      )}

      {/* 최근 사고 접수 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🚨 최근 사고 접수</Text>
        <Pressable onPress={() => router.push("/(tabs)/admin-dashboard" as never)}>
          <Text style={styles.sectionMore}>전체 보기 →</Text>
        </Pressable>
      </View>
      {recentAccidents.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>접수된 사고가 없습니다</Text>
        </View>
      ) : (
        recentAccidents.map((acc: any) => (
          <View key={acc.id} style={styles.accidentCard}>
            <View style={[styles.accidentStatusBar, { backgroundColor: STATUS_COLOR[acc.status] ?? "#718096" }]} />
            <View style={styles.accidentBody}>
              <View style={styles.accidentTop}>
                <Text style={styles.accidentType}>{acc.accidentType}</Text>
                <View style={[styles.accidentStatusBadge, { backgroundColor: (STATUS_COLOR[acc.status] ?? "#718096") + "20" }]}>
                  <Text style={[styles.accidentStatusText, { color: STATUS_COLOR[acc.status] ?? "#718096" }]}>{acc.status}</Text>
                </View>
              </View>
              {acc.location && (
                <Text style={styles.accidentLocation} numberOfLines={1}>📍 {acc.location}</Text>
              )}
              <Text style={styles.accidentDate}>
                {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("ko-KR") : ""}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* 빠른 관리 메뉴 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚡ 빠른 관리</Text>
      </View>
      <View style={styles.quickMenuGrid}>
        {[
          { label: "사고 관리", icon: "🚗", route: "/(tabs)/admin-dashboard" },
          { label: "파트너 관리", icon: "🏢", route: "/(tabs)/admin-dashboard" },
          { label: "파트너 배정", icon: "🔗", route: "/(tabs)/admin-dashboard" },
          { label: "통계 현황", icon: "📊", route: "/(tabs)/admin-dashboard" },
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
  adminHeader: {
    backgroundColor: "#1A2B4C",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adminBadge: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  adminTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  adminDashBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  adminDashBtnText: { fontSize: 14, color: "#fff", fontWeight: "700" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricIcon: { fontSize: 24 },
  metricValue: { fontSize: 28, fontWeight: "800" },
  metricLabel: { fontSize: 12, color: "#718096" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  sectionMore: { fontSize: 13, color: "#3182CE", fontWeight: "600" },
  accidentStatsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  accidentStatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  accidentStatDot: { width: 8, height: 8, borderRadius: 4 },
  accidentStatLabel: { fontSize: 13, color: "#4A5568" },
  accidentStatCount: { fontSize: 14, fontWeight: "700" },
  pendingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    borderLeftColor: "#F6AD55",
  },
  pendingLeft: { gap: 4 },
  pendingCategoryBadge: {
    backgroundColor: "#EBF8FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  pendingCategoryText: { fontSize: 11, color: "#3182CE", fontWeight: "600" },
  pendingName: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  pendingPhone: { fontSize: 12, color: "#718096" },
  pendingRight: { alignItems: "center", gap: 6 },
  pendingBadge: {
    backgroundColor: "#FFFBEB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#F6AD55",
  },
  pendingBadgeText: { fontSize: 11, color: "#D69E2E", fontWeight: "600" },
  pendingArrow: { fontSize: 20, color: "#A0AEC0" },
  accidentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  accidentStatusBar: { width: 4 },
  accidentBody: { flex: 1, padding: 14, gap: 4 },
  accidentTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accidentType: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  accidentStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  accidentStatusText: { fontSize: 12, fontWeight: "600" },
  accidentLocation: { fontSize: 12, color: "#718096" },
  accidentDate: { fontSize: 11, color: "#A0AEC0" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#A0AEC0" },
  quickMenuGrid: { flexDirection: "row", gap: 10 },
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
  // 관리자 대시보드 진입 카드
  adminEntryCard: {
    backgroundColor: "#1A2B4C",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminEntryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminEntryIcon: { fontSize: 28 },
  adminEntryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  adminEntryDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  adminEntryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminEntryAlert: {
    backgroundColor: "#E53E3E",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminEntryAlertText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  adminEntryArrow: {
    fontSize: 28,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "300",
  },
});
