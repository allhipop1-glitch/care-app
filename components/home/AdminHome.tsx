import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const STATUS_COLOR: Record<string, string> = {
  접수: "#ED8936",
  증거수집: "#3182CE",
  파트너매칭: "#805AD5",
  처리중: "#F59E0B",
  완료: "#38A169",
};

const CATEGORY_ICON: Record<string, string> = {
  공업사: "🔧",
  렉카: "🚛",
  병원: "🏥",
  변호사: "⚖️",
  보험사: "🛡️",
};

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

export function AdminHome() {
  const router = useRouter();
  const statsQuery = trpc.admin.stats.useQuery();
  const accidentsQuery = trpc.admin.accidents.list.useQuery();
  const partnersQuery = trpc.admin.partners.list.useQuery();
  const utils = trpc.useUtils();
  const updateStatusMutation = trpc.admin.partners.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.partners.list.invalidate();
      utils.admin.stats.invalidate();
    },
  });
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handlePartnerStatus = async (id: number, status: "active" | "inactive") => {
    setProcessingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } finally {
      setProcessingId(null);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "accidents">("overview");

  const stats = statsQuery.data;
  const accidents = (accidentsQuery.data ?? []) as any[];
  const partners = (partnersQuery.data ?? []) as any[];

  const pendingPartners = partners.filter((p: any) => p.status === "pending");
  const activePartners = partners.filter((p: any) => p.status === "active");
  const recentAccidents = accidents.slice(0, 10);

  // 사고 상태별 파이프라인 수
  const pipeline = ["접수", "증거수집", "파트너매칭", "처리중", "완료"].map((s) => ({
    status: s,
    count: accidents.filter((a: any) => a.status === s).length,
    color: STATUS_COLOR[s],
  }));
  const totalAccidents = pipeline.reduce((sum, p) => sum + p.count, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      statsQuery.refetch(),
      accidentsQuery.refetch(),
      partnersQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  if (statsQuery.isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#1A2B4C" size="large" />
        <Text style={styles.loadingText}>관리자 데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>🛡️ 관리자</Text>
          <Text style={styles.headerTitle}>사고케어 운영 현황</Text>
        </View>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
        >
          <Text style={styles.headerBtnText}>전체 관리 →</Text>
        </Pressable>
      </View>

      {/* 승인 대기 긴급 배너 */}
      {pendingPartners.length > 0 && (
        <Pressable
          style={styles.urgentBanner}
          onPress={() => setActiveTab("pending")}
        >
          <View style={styles.urgentLeft}>
            <View style={styles.urgentDot} />
            <Text style={styles.urgentText}>⚠️ 파트너 승인 대기 {pendingPartners.length}건</Text>
          </View>
          <Text style={styles.urgentAction}>지금 처리 →</Text>
        </Pressable>
      )}

      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {([
          { key: "overview", label: "📊 현황" },
          { key: "pending", label: `⏳ 승인 대기${pendingPartners.length > 0 ? ` (${pendingPartners.length})` : ""}` },
          { key: "accidents", label: "🚨 사고" },
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A2B4C" />}
      >
        {/* ── 현황 탭 ── */}
        {activeTab === "overview" && (
          <>
            {/* 핵심 KPI 4개 */}
            <View style={styles.kpiGrid}>
              {[
                { label: "전체 사용자", value: stats?.totalUsers ?? 0, icon: "👥", color: "#3182CE", bg: "#EBF8FF" },
                { label: "활성 파트너", value: activePartners.length, icon: "🏢", color: "#38A169", bg: "#F0FFF4" },
                { label: "전체 사고", value: stats?.totalAccidents ?? 0, icon: "🚗", color: "#ED8936", bg: "#FFFAF0" },
                { label: "승인 대기", value: pendingPartners.length, icon: "⏳", color: "#E53E3E", bg: "#FFF5F5" },
              ].map((k) => (
                <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg, borderColor: k.color + "30" }]}>
                  <Text style={styles.kpiIcon}>{k.icon}</Text>
                  <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* 사고 처리 파이프라인 */}
            <View style={styles.pipelineCard}>
              <Text style={styles.cardTitle}>🔄 사고 처리 파이프라인</Text>
              <View style={styles.pipelineRow}>
                {pipeline.map((p, i) => (
                  <React.Fragment key={p.status}>
                    <View style={styles.pipelineStep}>
                      <View style={[styles.pipelineDot, { backgroundColor: p.color }]}>
                        <Text style={styles.pipelineDotNum}>{p.count}</Text>
                      </View>
                      <Text style={styles.pipelineLabel}>{p.status}</Text>
                    </View>
                    {i < pipeline.length - 1 && (
                      <Text style={styles.pipelineArrow}>›</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
              {/* 진행률 바 */}
              <View style={styles.progressBarBg}>
                {pipeline.map((p) => (
                  <View
                    key={p.status}
                    style={[
                      styles.progressBarSeg,
                      {
                        flex: p.count > 0 ? p.count : 0.1,
                        backgroundColor: p.color,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.pipelineTotal}>전체 {totalAccidents}건 처리 중</Text>
            </View>

            {/* 파트너 현황 */}
            <View style={styles.partnerSummaryCard}>
              <Text style={styles.cardTitle}>🏢 파트너 현황</Text>
              <View style={styles.partnerSummaryRow}>
                {[
                  { label: "전체 파트너", value: partners.length, color: "#1A2B4C" },
                  { label: "활성", value: activePartners.length, color: "#38A169" },
                  { label: "승인 대기", value: pendingPartners.length, color: "#E53E3E" },
                  { label: "비활성", value: partners.filter((p: any) => p.status === "inactive").length, color: "#A0AEC0" },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <View style={styles.summaryDivider} />}
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.summaryLabel}>{s.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              {/* 업종별 분포 */}
              <View style={styles.categoryRow}>
                {Object.entries(
                  partners.reduce((acc: Record<string, number>, p: any) => {
                    acc[p.category] = (acc[p.category] ?? 0) + 1;
                    return acc;
                  }, {})
                ).map(([cat, cnt]) => (
                  <View key={cat} style={styles.categoryChip}>
                    <Text style={styles.categoryChipIcon}>{CATEGORY_ICON[cat] ?? "🏢"}</Text>
                    <Text style={styles.categoryChipText}>{cat} {cnt as number}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 빠른 관리 액션 */}
            <Text style={styles.sectionTitle}>⚡ 빠른 관리</Text>
            <View style={styles.actionGrid}>
              {[
                { label: "사고 관리", icon: "🚗", route: "/(tabs)/admin-dashboard", color: "#ED8936", desc: "접수·상태 변경" },
                { label: "파트너 승인", icon: "✅", route: "/(tabs)/admin-dashboard", color: "#38A169", desc: `대기 ${pendingPartners.length}건` },
                { label: "파트너 배정", icon: "🔗", route: "/(tabs)/admin-dashboard", color: "#3182CE", desc: "직접 매칭" },
                { label: "전체 통계", icon: "📊", route: "/(tabs)/admin-dashboard", color: "#805AD5", desc: "운영 현황" },
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
          </>
        )}

        {/* ── 승인 대기 탭 ── */}
        {activeTab === "pending" && (
          <>
            {pendingPartners.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>승인 대기 파트너가 없습니다</Text>
                <Text style={styles.emptySubText}>모든 파트너 신청이 처리되었습니다</Text>
              </View>
            ) : (
              <>
                <Text style={styles.pendingCount}>총 {pendingPartners.length}건 처리 필요</Text>
                {pendingPartners.map((p: any) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.pendingCard, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
                  >
                    <View style={styles.pendingTop}>
                      <View style={styles.pendingCategoryBadge}>
                        <Text style={styles.pendingCategoryIcon}>{CATEGORY_ICON[p.category] ?? "🏢"}</Text>
                        <Text style={styles.pendingCategoryText}>{p.category}</Text>
                      </View>
                      <Text style={styles.pendingTime}>{getTimeAgo(p.createdAt)}</Text>
                    </View>
                    <Text style={styles.pendingName}>{p.name}</Text>
                    <Text style={styles.pendingPhone}>📞 {p.phone}</Text>
                    <View style={styles.pendingActions}>
                      <Pressable
                        style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handlePartnerStatus(p.id, "active")}
                        disabled={processingId === p.id}
                      >
                        {processingId === p.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.approveBtnText}>✓ 승인</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handlePartnerStatus(p.id, "inactive")}
                        disabled={processingId === p.id}
                      >
                        <Text style={styles.rejectBtnText}>✕ 거절</Text>
                      </Pressable>
                      <View style={styles.pendingWaitBadge}>
                        <Text style={styles.pendingWaitText}>심사 중</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.goToDashBtn}
                  onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
                >
                  <Text style={styles.goToDashBtnText}>관리자 대시보드에서 일괄 처리 →</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        {/* ── 사고 현황 탭 ── */}
        {activeTab === "accidents" && (
          <>
            {/* 상태별 필터 요약 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <View style={styles.filterRow}>
                {pipeline.map((p) => (
                  <View key={p.status} style={[styles.filterChip, { borderColor: p.color, backgroundColor: p.color + "15" }]}>
                    <View style={[styles.filterDot, { backgroundColor: p.color }]} />
                    <Text style={[styles.filterText, { color: p.color }]}>{p.status} {p.count}건</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {recentAccidents.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🚗</Text>
                <Text style={styles.emptyText}>접수된 사고가 없습니다</Text>
              </View>
            ) : (
              recentAccidents.map((acc: any) => (
                <Pressable
                  key={acc.id}
                  style={({ pressed }) => [styles.accidentCard, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
                >
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
                    <View style={styles.accidentBottom}>
                      <Text style={styles.accidentDate}>{getTimeAgo(acc.createdAt)}</Text>
                      <Text style={styles.accidentManage}>관리 →</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
            <Pressable
              style={styles.goToDashBtn}
              onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
            >
              <Text style={styles.goToDashBtnText}>전체 사고 관리 →</Text>
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
  headerBadge: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "600", marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  // 긴급 배너
  urgentBanner: {
    backgroundColor: "#E53E3E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  urgentLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  urgentText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  urgentAction: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.9)" },
  // 탭
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
  },
  tabBtnActive: { backgroundColor: "#1A2B4C" },
  tabBtnText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  tabBtnTextActive: { color: "#FFFFFF" },
  // 스크롤
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  // KPI
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
  // 파이프라인
  pipelineCard: {
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
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  pipelineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pipelineStep: { alignItems: "center", gap: 4 },
  pipelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pipelineDotNum: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  pipelineLabel: { fontSize: 10, color: "#718096", fontWeight: "500" },
  pipelineArrow: { fontSize: 18, color: "#CBD5E0", marginBottom: 14 },
  progressBarBg: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#EDF2F7",
  },
  progressBarSeg: { height: 6 },
  pipelineTotal: { fontSize: 12, color: "#A0AEC0", textAlign: "right" },
  // 파트너 요약
  partnerSummaryCard: {
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
  partnerSummaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#A0AEC0" },
  summaryDivider: { width: 1, height: 32, backgroundColor: "#E2E8F0" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipIcon: { fontSize: 14 },
  categoryChipText: { fontSize: 12, color: "#4A5568", fontWeight: "500" },
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
  // 승인 대기 탭
  pendingCount: { fontSize: 13, color: "#E53E3E", fontWeight: "600" },
  pendingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#E53E3E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pendingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pendingCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F7FAFC",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingCategoryIcon: { fontSize: 14 },
  pendingCategoryText: { fontSize: 12, fontWeight: "600", color: "#4A5568" },
  pendingTime: { fontSize: 11, color: "#A0AEC0" },
  pendingName: { fontSize: 16, fontWeight: "700", color: "#1A2B4C" },
  pendingPhone: { fontSize: 13, color: "#718096" },
  pendingActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  pendingApproveHint: { backgroundColor: "#FFF5F5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pendingApproveHintText: { fontSize: 11, color: "#E53E3E" },
  pendingWaitBadge: { backgroundColor: "#FED7D7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pendingWaitText: { fontSize: 11, fontWeight: "700", color: "#E53E3E" },
  goToDashBtn: {
    backgroundColor: "#1A2B4C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  goToDashBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  // 사고 현황 탭
  filterScroll: { marginBottom: -4 },
  filterRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 12, fontWeight: "600" },
  accidentCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  accidentStatusBar: { width: 4 },
  accidentBody: { flex: 1, padding: 14, gap: 5 },
  accidentTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accidentType: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  accidentStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  accidentStatusText: { fontSize: 12, fontWeight: "600" },
  accidentLocation: { fontSize: 13, color: "#718096" },
  accidentBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accidentDate: { fontSize: 11, color: "#A0AEC0" },
  accidentManage: { fontSize: 12, fontWeight: "600", color: "#3182CE" },
  // 공통
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#4A5568" },
  emptySubText: { fontSize: 13, color: "#A0AEC0" },
  approveBtn: {
    backgroundColor: "#38A169",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: "center",
  },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  rejectBtn: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FC8181",
  },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: "#E53E3E" },
});
