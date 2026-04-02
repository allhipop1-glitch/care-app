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
  손해사정사: "📋",
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

type HomeTab = "현황" | "사고" | "파트너" | "정산" | "사용자";

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
  const [activeTab, setActiveTab] = useState<HomeTab>("현황");

  const stats = statsQuery.data;
  const accidents = (accidentsQuery.data ?? []) as any[];
  const partners = (partnersQuery.data ?? []) as any[];

  const pendingPartners = partners.filter((p: any) => p.status === "pending");
  const activePartners = partners.filter((p: any) => p.status === "active");

  // 사고 상태별 파이프라인
  const pipeline = ["접수", "증거수집", "파트너매칭", "처리중", "완료"].map((s) => ({
    status: s,
    count: accidents.filter((a: any) => (a.accident ?? a).status === s).length,
    color: STATUS_COLOR[s],
  }));
  const totalAccidents = pipeline.reduce((sum, p) => sum + p.count, 0);

  // 업종별 분포
  const partnersByCategory = partners.reduce((acc: Record<string, number>, p: any) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

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
          onPress={() => {
            setActiveTab("파트너");
            router.push("/(tabs)/admin-dashboard" as never);
          }}
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
          { key: "현황", label: "📊 현황" },
          { key: "사고", label: `🚨 사고${accidents.length > 0 ? ` (${accidents.length})` : ""}` },
          { key: "파트너", label: `🏢 파트너${pendingPartners.length > 0 ? ` (${pendingPartners.length})` : ""}` },
          { key: "정산", label: "💰 정산" },
          { key: "사용자", label: "👥 사용자" },
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
        {activeTab === "현황" && (
          <>
            {/* 핵심 KPI */}
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
                    {i < pipeline.length - 1 && <Text style={styles.pipelineArrow}>›</Text>}
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.progressBarBg}>
                {pipeline.map((p) => (
                  <View
                    key={p.status}
                    style={[styles.progressBarSeg, { flex: p.count > 0 ? p.count : 0.1, backgroundColor: p.color }]}
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
                  { label: "전체", value: partners.length, color: "#1A2B4C" },
                  { label: "활성", value: activePartners.length, color: "#38A169" },
                  { label: "대기", value: pendingPartners.length, color: "#E53E3E" },
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
              <View style={styles.categoryRow}>
                {Object.entries(partnersByCategory).map(([cat, cnt]) => (
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
                { label: "사고 관리", icon: "🚗", color: "#ED8936", desc: "접수·상태 변경", tab: "사고관리" },
                { label: "파트너 승인", icon: "✅", color: "#38A169", desc: `대기 ${pendingPartners.length}건`, tab: "파트너관리" },
                { label: "정산 관리", icon: "💰", color: "#3182CE", desc: "월별 GMV 확인", tab: "정산관리" },
                { label: "사용자 관리", icon: "👥", color: "#805AD5", desc: "가입·이탈 현황", tab: "사용자관리" },
              ].map((a) => (
                <Pressable
                  key={a.label}
                  style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
                  onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
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

        {/* ── 사고 탭 ── */}
        {activeTab === "사고" && (
          <>
            <View style={styles.filterChipRow}>
              {pipeline.map((p) => (
                <View key={p.status} style={[styles.filterChip, { borderColor: p.color, backgroundColor: p.color + "15" }]}>
                  <View style={[styles.filterDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.filterText, { color: p.color }]}>{p.status} {p.count}건</Text>
                </View>
              ))}
            </View>
            {accidents.slice(0, 10).map((item: any, idx: number) => {
              const acc = item.accident ?? item;
              const user = item.user ?? {};
              return (
                <Pressable
                  key={acc.id ?? idx}
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
                    {user.name && <Text style={styles.accidentUser}>👤 {user.name}</Text>}
                    {acc.location && <Text style={styles.accidentLocation} numberOfLines={1}>📍 {acc.location}</Text>}
                    <View style={styles.accidentBottom}>
                      <Text style={styles.accidentDate}>{getTimeAgo(acc.createdAt)}</Text>
                      <Text style={styles.accidentManage}>관리 →</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {accidents.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🚗</Text>
                <Text style={styles.emptyText}>접수된 사고가 없습니다</Text>
              </View>
            )}
            <Pressable
              style={styles.goToDashBtn}
              onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
            >
              <Text style={styles.goToDashBtnText}>전체 사고 관리 →</Text>
            </Pressable>
          </>
        )}

        {/* ── 파트너 탭 ── */}
        {activeTab === "파트너" && (
          <>
            {/* 업종별 공급 현황 */}
            <View style={styles.categorySupplyCard}>
              <Text style={styles.cardTitle}>📊 업종별 공급 현황</Text>
              <View style={styles.categorySupplyRow}>
                {Object.entries(partnersByCategory).map(([cat, cnt]) => (
                  <View key={cat} style={styles.categorySupplyItem}>
                    <Text style={styles.categorySupplyIcon}>{CATEGORY_ICON[cat] ?? "🏢"}</Text>
                    <Text style={styles.categorySupplyLabel}>{cat}</Text>
                    <Text style={styles.categorySupplyCount}>{cnt as number}개</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 승인 대기 */}
            {pendingPartners.length > 0 && (
              <>
                <Text style={styles.pendingCount}>⏳ 승인 대기 {pendingPartners.length}건</Text>
                {pendingPartners.map((p: any) => (
                  <View key={p.id} style={styles.pendingCard}>
                    <View style={styles.pendingTop}>
                      <View style={styles.pendingCategoryBadge}>
                        <Text style={styles.pendingCategoryIcon}>{CATEGORY_ICON[p.category] ?? "🏢"}</Text>
                        <Text style={styles.pendingCategoryText}>{p.category}</Text>
                      </View>
                      <Text style={styles.pendingTime}>{getTimeAgo(p.createdAt)}</Text>
                    </View>
                    <Text style={styles.pendingName}>{p.name}</Text>
                    <Text style={styles.pendingPhone}>📞 {p.phone}</Text>
                    <Text style={styles.pendingAddress} numberOfLines={1}>📍 {p.address}</Text>
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
                    </View>
                  </View>
                ))}
              </>
            )}
            {pendingPartners.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>승인 대기 파트너가 없습니다</Text>
              </View>
            )}
            <Pressable
              style={styles.goToDashBtn}
              onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
            >
              <Text style={styles.goToDashBtnText}>파트너 전체 관리 →</Text>
            </Pressable>
          </>
        )}

        {/* ── 정산 탭 ── */}
        {activeTab === "정산" && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>💰</Text>
            <Text style={styles.placeholderTitle}>정산 관리</Text>
            <Text style={styles.placeholderText}>
              월별 GMV, 수수료 현황, 미정산 건 처리 기능이 곧 추가됩니다.
            </Text>
            <Pressable
              style={styles.goToDashBtn}
              onPress={() => router.push("/(tabs)/admin-dashboard" as never)}
            >
              <Text style={styles.goToDashBtnText}>관리자 대시보드 →</Text>
            </Pressable>
          </View>
        )}

        {/* ── 사용자 탭 ── */}
        {activeTab === "사용자" && (
          <>
            <View style={styles.kpiGrid}>
              {[
                { label: "전체 사용자", value: stats?.totalUsers ?? 0, icon: "👥", color: "#3182CE", bg: "#EBF8FF" },
                { label: "파트너 전환", value: activePartners.length, icon: "🏢", color: "#38A169", bg: "#F0FFF4" },
              ].map((k) => (
                <View key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg, borderColor: k.color + "30" }]}>
                  <Text style={styles.kpiIcon}>{k.icon}</Text>
                  <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderIcon}>👥</Text>
              <Text style={styles.placeholderTitle}>사용자 관리</Text>
              <Text style={styles.placeholderText}>
                가입 현황, 사고 접수 이력, 사용자 상태 관리 기능이 곧 추가됩니다.
              </Text>
            </View>
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
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
  tabBtnText: { fontSize: 10, fontWeight: "600", color: "#718096" },
  tabBtnTextActive: { color: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
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
  filterChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
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
  accidentUser: { fontSize: 12, color: "#718096" },
  accidentLocation: { fontSize: 13, color: "#718096" },
  accidentBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accidentDate: { fontSize: 11, color: "#A0AEC0" },
  accidentManage: { fontSize: 12, fontWeight: "600", color: "#3182CE" },
  pendingCount: { fontSize: 13, color: "#E53E3E", fontWeight: "700" },
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
  pendingAddress: { fontSize: 12, color: "#A0AEC0" },
  pendingActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  approveBtn: {
    flex: 1,
    backgroundColor: "#38A169",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FC8181",
  },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: "#E53E3E" },
  goToDashBtn: {
    backgroundColor: "#1A2B4C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  goToDashBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  categorySupplyCard: {
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
  categorySupplyRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categorySupplyItem: {
    width: "30%",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    paddingVertical: 12,
  },
  categorySupplyIcon: { fontSize: 24 },
  categorySupplyLabel: { fontSize: 11, color: "#718096", fontWeight: "500" },
  categorySupplyCount: { fontSize: 16, fontWeight: "800", color: "#1A2B4C" },
  placeholderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  placeholderIcon: { fontSize: 48 },
  placeholderTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4C" },
  placeholderText: { fontSize: 13, color: "#A0AEC0", textAlign: "center", lineHeight: 20 },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#4A5568" },
});
