import { trpc } from "@/lib/trpc";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AdminTab = "운영현황" | "사고관리" | "파트너관리" | "정산관리" | "사용자관리";

const ACCIDENT_STATUS_COLOR: Record<string, string> = {
  접수: "#ED8936",
  증거수집: "#D69E2E",
  파트너매칭: "#3182CE",
  처리중: "#805AD5",
  완료: "#38A169",
};

const PARTNER_STATUS_COLOR: Record<string, string> = {
  active: "#38A169",
  inactive: "#718096",
  pending: "#ED8936",
};

const PARTNER_STATUS_LABEL: Record<string, string> = {
  active: "활성",
  inactive: "비활성",
  pending: "승인대기",
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

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>("운영현황");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<any>(null);
  const [assignPartnerId, setAssignPartnerId] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [accidentFilter, setAccidentFilter] = useState<string | null>(null);

  const statsQuery = trpc.admin.stats.useQuery();
  const accidentsQuery = trpc.admin.accidents.list.useQuery();
  const partnersQuery = trpc.admin.partners.list.useQuery();
  const utils = trpc.useUtils();

  const updateAccidentMutation = trpc.admin.accidents.updateStatus.useMutation({
    onSuccess: () => utils.admin.accidents.list.invalidate(),
    onError: (err) => Alert.alert("오류", err.message),
  });

  const assignPartnerMutation = trpc.admin.accidents.assignPartner.useMutation({
    onSuccess: () => {
      utils.admin.accidents.list.invalidate();
      setSelectedAccident(null);
      setAssignPartnerId("");
      Alert.alert("완료", "파트너가 배정되었습니다.");
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const updatePartnerStatusMutation = trpc.admin.partners.updateStatus.useMutation({
    onSuccess: () => {
      utils.admin.partners.list.invalidate();
      utils.admin.stats.invalidate();
      setSelectedPartner(null);
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      utils.admin.stats.invalidate(),
      utils.admin.accidents.list.invalidate(),
      utils.admin.partners.list.invalidate(),
    ]);
    setRefreshing(false);
  };

  const accidents = accidentsQuery.data ?? [];
  const partners = partnersQuery.data ?? [];
  const stats = statsQuery.data;

  // 필터링된 사고 목록
  const filteredAccidents = accidentFilter
    ? accidents.filter((item: any) => (item.accident ?? item).status === accidentFilter)
    : accidents;

  // 파트너 업종별 분포
  const partnersByCategory = partners.reduce((acc: Record<string, number>, p: any) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  // 파트너 성과 랭킹 (완료 건수 기준 상위 5개)
  const topPartners = [...partners]
    .sort((a: any, b: any) => (b.totalCases ?? 0) - (a.totalCases ?? 0))
    .slice(0, 5);

  // ─── 탭 1: 운영 현황 ────────────────────────────────────────────────────────
  const renderOperations = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 핵심 KPI */}
      <Text style={styles.sectionTitle}>📊 핵심 지표</Text>
      <View style={styles.kpiGrid}>
        {[
          { label: "전체 사용자", value: stats?.totalUsers ?? 0, color: "#3182CE", icon: "👥" },
          { label: "활성 파트너", value: stats?.totalPartners ?? 0, color: "#38A169", icon: "🏢" },
          { label: "전체 사고", value: stats?.totalAccidents ?? 0, color: "#805AD5", icon: "🚗" },
          { label: "승인 대기", value: stats?.pendingPartners ?? 0, color: "#ED8936", icon: "⏳" },
        ].map((k) => (
          <View key={k.label} style={[styles.kpiCard, { borderTopColor: k.color }]}>
            <Text style={styles.kpiIcon}>{k.icon}</Text>
            <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* 사고 처리 파이프라인 */}
      <Text style={styles.sectionTitle}>🔄 사고 처리 파이프라인</Text>
      <View style={styles.pipelineCard}>
        <View style={styles.pipelineRow}>
          {(["접수", "증거수집", "파트너매칭", "처리중", "완료"] as const).map((status, i, arr) => (
            <React.Fragment key={status}>
              <View style={styles.pipelineStep}>
                <View
                  style={[
                    styles.pipelineDot,
                    { backgroundColor: ACCIDENT_STATUS_COLOR[status] ?? "#718096" },
                  ]}
                >
                  <Text style={styles.pipelineDotNum}>
                    {stats?.accidentStats?.[status] ?? 0}
                  </Text>
                </View>
                <Text style={styles.pipelineLabel}>{status}</Text>
              </View>
              {i < arr.length - 1 && <Text style={styles.pipelineArrow}>›</Text>}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.progressBarBg}>
          {(["접수", "증거수집", "파트너매칭", "처리중", "완료"] as const).map((status) => {
            const count = stats?.accidentStats?.[status] ?? 0;
            return (
              <View
                key={status}
                style={[
                  styles.progressBarSeg,
                  {
                    flex: count > 0 ? count : 0.1,
                    backgroundColor: ACCIDENT_STATUS_COLOR[status] ?? "#718096",
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.pipelineTotal}>
          전체 {stats?.accidentStats?.total ?? 0}건 처리 중
        </Text>
      </View>

      {/* 파트너 현황 */}
      <Text style={styles.sectionTitle}>🏢 파트너 현황</Text>
      <View style={styles.partnerSummaryCard}>
        <View style={styles.partnerSummaryRow}>
          {[
            { label: "전체", value: partners.length, color: "#1A2B4C" },
            { label: "활성", value: partners.filter((p: any) => p.status === "active").length, color: "#38A169" },
            { label: "대기", value: stats?.pendingPartners ?? 0, color: "#ED8936" },
            { label: "비활성", value: partners.filter((p: any) => p.status === "inactive").length, color: "#718096" },
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
              <Text style={styles.categoryChipText}>
                {cat} {cnt as number}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 비즈니스 KPI (확장 예정) */}
      <Text style={styles.sectionTitle}>💰 비즈니스 지표</Text>
      <View style={styles.bizKpiCard}>
        <Text style={styles.bizKpiPlaceholder}>
          GMV, SLA, 파트너 응답률, 전환율 등 확장 지표는 서버 API 추가 후 표시됩니다.
        </Text>
      </View>
    </ScrollView>
  );

  // ─── 탭 2: 사고 관리 ────────────────────────────────────────────────────────
  const renderAccidents = () => (
    <View style={styles.tabContent}>
      {/* 상태 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, !accidentFilter && styles.filterChipActive]}
            onPress={() => setAccidentFilter(null)}
          >
            <Text style={[styles.filterText, !accidentFilter && styles.filterTextActive]}>
              전체 {accidents.length}
            </Text>
          </Pressable>
          {(["접수", "증거수집", "파트너매칭", "처리중", "완료"] as const).map((status) => {
            const count = accidents.filter((item: any) => (item.accident ?? item).status === status).length;
            return (
              <Pressable
                key={status}
                style={[
                  styles.filterChip,
                  accidentFilter === status && styles.filterChipActive,
                  { borderColor: ACCIDENT_STATUS_COLOR[status] },
                ]}
                onPress={() => setAccidentFilter(status)}
              >
                <View
                  style={[styles.filterDot, { backgroundColor: ACCIDENT_STATUS_COLOR[status] }]}
                />
                <Text
                  style={[
                    styles.filterText,
                    accidentFilter === status && styles.filterTextActive,
                  ]}
                >
                  {status} {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <FlatList
        data={filteredAccidents}
        keyExtractor={(item: any, idx) => String(item.accident?.id ?? idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: any }) => {
          const acc = item.accident ?? item;
          const user = item.user ?? {};
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: ACCIDENT_STATUS_COLOR[acc.status] ?? "#718096" },
                  ]}
                >
                  <Text style={styles.statusText}>{acc.status}</Text>
                </View>
                <Text style={styles.cardDate}>
                  {acc.createdAt ? getTimeAgo(acc.createdAt) : ""}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{acc.accidentType}</Text>
              <Text style={styles.cardSub}>👤 {user.name ?? "사용자"}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                📍 {acc.location ?? "위치 미상"}
              </Text>

              <View style={styles.statusRow}>
                {(["접수", "증거수집", "파트너매칭", "처리중", "완료"] as const).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.statusChip,
                      acc.status === s && { backgroundColor: ACCIDENT_STATUS_COLOR[s] },
                    ]}
                    onPress={() => updateAccidentMutation.mutate({ id: acc.id, status: s })}
                  >
                    <Text
                      style={[styles.statusChipText, acc.status === s && { color: "#fff" }]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={styles.assignBtn}
                onPress={() => setSelectedAccident(acc)}
              >
                <Text style={styles.assignBtnText}>파트너 직접 배정</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>
              {accidentFilter ? `${accidentFilter} 상태의 사고가 없습니다` : "접수된 사고가 없습니다"}
            </Text>
          </View>
        }
      />
    </View>
  );

  // ─── 탭 3: 파트너 관리 ──────────────────────────────────────────────────────
  const renderPartners = () => (
    <View style={styles.tabContent}>
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

      {/* 파트너 성과 랭킹 */}
      <View style={styles.rankingCard}>
        <Text style={styles.cardTitle}>🏆 파트너 성과 랭킹 (완료 건수 기준)</Text>
        {topPartners.map((p: any, i: number) => (
          <View key={p.id} style={styles.rankingItem}>
            <View style={styles.rankingLeft}>
              <View
                style={[
                  styles.rankingBadge,
                  i === 0 && { backgroundColor: "#FFD700" },
                  i === 1 && { backgroundColor: "#C0C0C0" },
                  i === 2 && { backgroundColor: "#CD7F32" },
                ]}
              >
                <Text style={styles.rankingBadgeText}>{i + 1}</Text>
              </View>
              <View>
                <Text style={styles.rankingName}>{p.name}</Text>
                <Text style={styles.rankingCategory}>{p.category}</Text>
              </View>
            </View>
            <View style={styles.rankingRight}>
              <Text style={styles.rankingValue}>{p.totalCases ?? 0}건</Text>
              <Text style={styles.rankingStar}>⭐ {Number(p.rating).toFixed(1)}</Text>
            </View>
          </View>
        ))}
      </View>

      <FlatList
        data={partners}
        keyExtractor={(item: any) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: PARTNER_STATUS_COLOR[item.status] ?? "#718096" },
                ]}
              >
                <Text style={styles.statusText}>
                  {PARTNER_STATUS_LABEL[item.status] ?? item.status}
                </Text>
              </View>
              <Text style={styles.categoryBadge}>{item.category}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>📞 {item.phone}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              📍 {item.address}
            </Text>
            <View style={styles.partnerStats}>
              <Text style={styles.partnerStat}>⭐ {Number(item.rating).toFixed(1)}</Text>
              <Text style={styles.partnerStat}>후기 {item.reviewCount}개</Text>
              <Text style={styles.partnerStat}>처리 {item.totalCases}건</Text>
            </View>

            <View style={styles.partnerActions}>
              {item.status !== "active" && (
                <Pressable
                  style={[styles.partnerActionBtn, { backgroundColor: "#38A169" }]}
                  onPress={() =>
                    updatePartnerStatusMutation.mutate({ id: item.id, status: "active" })
                  }
                >
                  <Text style={styles.partnerActionText}>승인</Text>
                </Pressable>
              )}
              {item.status !== "inactive" && (
                <Pressable
                  style={[styles.partnerActionBtn, { backgroundColor: "#E53E3E" }]}
                  onPress={() =>
                    updatePartnerStatusMutation.mutate({ id: item.id, status: "inactive" })
                  }
                >
                  <Text style={styles.partnerActionText}>정지</Text>
                </Pressable>
              )}
              {item.status !== "pending" && (
                <Pressable
                  style={[styles.partnerActionBtn, { backgroundColor: "#718096" }]}
                  onPress={() =>
                    updatePartnerStatusMutation.mutate({ id: item.id, status: "pending" })
                  }
                >
                  <Text style={styles.partnerActionText}>대기</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>등록된 파트너가 없습니다</Text>
          </View>
        }
      />
    </View>
  );

  // ─── 탭 4: 정산 관리 ────────────────────────────────────────────────────────
  const renderSettlement = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.sectionTitle}>💰 정산 관리</Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderIcon}>🚧</Text>
        <Text style={styles.placeholderTitle}>정산 관리 기능 준비 중</Text>
        <Text style={styles.placeholderText}>
          월별 GMV, 수수료 현황, 미정산 건 처리 등의 기능이 곧 추가됩니다.
        </Text>
      </View>
    </ScrollView>
  );

  // ─── 탭 5: 사용자 관리 ──────────────────────────────────────────────────────
  const renderUsers = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.sectionTitle}>👥 사용자 관리</Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderIcon}>🚧</Text>
        <Text style={styles.placeholderTitle}>사용자 관리 기능 준비 중</Text>
        <Text style={styles.placeholderText}>
          가입 현황, 사고 접수 이력, 사용자 상태 관리 등의 기능이 곧 추가됩니다.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBadge}>🛡️ 관리자</Text>
          <Text style={styles.headerTitle}>사고케어 운영 대시보드</Text>
        </View>
      </View>

      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {(["운영현황", "사고관리", "파트너관리", "정산관리", "사용자관리"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 탭 컨텐츠 */}
      {activeTab === "운영현황" && renderOperations()}
      {activeTab === "사고관리" && renderAccidents()}
      {activeTab === "파트너관리" && renderPartners()}
      {activeTab === "정산관리" && renderSettlement()}
      {activeTab === "사용자관리" && renderUsers()}

      {/* 파트너 배정 모달 */}
      <Modal visible={!!selectedAccident} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>파트너 직접 배정</Text>
            <Text style={styles.modalSub}>
              {selectedAccident?.accidentType} · {selectedAccident?.location}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="파트너 ID 입력"
              value={assignPartnerId}
              onChangeText={setAssignPartnerId}
              keyboardType="number-pad"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setSelectedAccident(null);
                  setAssignPartnerId("");
                }}
              >
                <Text style={styles.modalBtnCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={() => {
                  if (!assignPartnerId) {
                    Alert.alert("알림", "파트너 ID를 입력하세요.");
                    return;
                  }
                  assignPartnerMutation.mutate({
                    accidentId: selectedAccident.id,
                    partnerId: Number(assignPartnerId),
                  });
                }}
              >
                <Text style={styles.modalBtnConfirmText}>배정</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  header: {
    backgroundColor: "#1A2B4C",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerBadge: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "600", marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
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
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
  },
  tabBtnActive: { backgroundColor: "#1A2B4C" },
  tabBtnText: { fontSize: 11, fontWeight: "600", color: "#718096" },
  tabBtnTextActive: { color: "#FFFFFF" },
  tabContent: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C", marginBottom: 8 },
  // KPI
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
  // 비즈니스 KPI
  bizKpiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bizKpiPlaceholder: { fontSize: 13, color: "#A0AEC0", textAlign: "center", lineHeight: 20 },
  // 필터
  filterScroll: { marginBottom: 12, paddingHorizontal: 16 },
  filterRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: { backgroundColor: "#1A2B4C", borderColor: "#1A2B4C" },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  filterTextActive: { color: "#FFFFFF" },
  // 카드
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  cardDate: { fontSize: 11, color: "#A0AEC0" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4C" },
  cardSub: { fontSize: 13, color: "#718096" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  statusChip: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusChipText: { fontSize: 11, fontWeight: "600", color: "#718096" },
  assignBtn: {
    backgroundColor: "#3182CE",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  assignBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  categoryBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3182CE",
    backgroundColor: "#EBF8FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  partnerStats: { flexDirection: "row", gap: 12, marginTop: 4 },
  partnerStat: { fontSize: 12, color: "#718096" },
  partnerActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  partnerActionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  partnerActionText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  // 업종별 공급 현황
  categorySupplyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
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
  // 랭킹
  rankingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rankingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F7FAFC",
  },
  rankingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  rankingBadgeText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  rankingName: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  rankingCategory: { fontSize: 11, color: "#A0AEC0" },
  rankingRight: { alignItems: "flex-end", gap: 2 },
  rankingValue: { fontSize: 16, fontWeight: "800", color: "#3182CE" },
  rankingStar: { fontSize: 11, color: "#ED8936" },
  // Placeholder
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
  // Empty
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#4A5568" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B4C" },
  modalSub: { fontSize: 13, color: "#718096" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnCancel: { backgroundColor: "#F7FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  modalBtnCancelText: { fontSize: 14, fontWeight: "700", color: "#718096" },
  modalBtnConfirm: { backgroundColor: "#3182CE" },
  modalBtnConfirmText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
