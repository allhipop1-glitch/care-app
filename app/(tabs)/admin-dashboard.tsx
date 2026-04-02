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

type AdminTab = "대시보드" | "사고관리" | "파트너관리";

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

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>("대시보드");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<any>(null);
  const [assignPartnerId, setAssignPartnerId] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

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

  const renderDashboard = () => (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 핵심 지표 */}
      <Text style={styles.sectionTitle}>핵심 지표</Text>
      <View style={styles.statsGrid}>
        {[
          { label: "전체 사용자", value: stats?.totalUsers ?? 0, color: "#3182CE", icon: "👥" },
          { label: "활성 파트너", value: stats?.totalPartners ?? 0, color: "#38A169", icon: "🏢" },
          { label: "전체 사고", value: stats?.totalAccidents ?? 0, color: "#805AD5", icon: "🚗" },
          { label: "승인 대기", value: stats?.pendingPartners ?? 0, color: "#ED8936", icon: "⏳" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 사고 현황 */}
      <Text style={styles.sectionTitle}>사고 처리 현황</Text>
      <View style={styles.accidentStatusGrid}>
        {Object.entries(stats?.accidentStats ?? {})
          .filter(([k]) => k !== "total")
          .map(([status, count]) => (
            <View key={status} style={styles.accidentStatusItem}>
              <View
                style={[
                  styles.accidentStatusDot,
                  { backgroundColor: ACCIDENT_STATUS_COLOR[status] ?? "#718096" },
                ]}
              />
              <Text style={styles.accidentStatusLabel}>{status}</Text>
              <Text style={styles.accidentStatusCount}>{String(count)}</Text>
            </View>
          ))}
      </View>

      {/* 최근 사고 */}
      <Text style={styles.sectionTitle}>최근 사고 접수</Text>
      {accidents.slice(0, 5).map((item: any, idx: number) => {
        const acc = item.accident ?? item;
        const user = item.user ?? {};
        return (
          <View key={idx} style={styles.recentCard}>
            <View style={[styles.statusDot, { backgroundColor: ACCIDENT_STATUS_COLOR[acc.status] ?? "#718096" }]} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentType}>{acc.accidentType}</Text>
              <Text style={styles.recentUser} numberOfLines={1}>
                {user.name ?? "사용자"} · {acc.location ?? "위치 미상"}
              </Text>
            </View>
            <Text style={styles.recentStatus}>{acc.status}</Text>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderAccidents = () => (
    <FlatList
      data={accidents}
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
                {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("ko-KR") : ""}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{acc.accidentType}</Text>
            <Text style={styles.cardSub}>👤 {user.name ?? "사용자"}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>📍 {acc.location ?? "위치 미상"}</Text>

            <View style={styles.statusRow}>
              {(["접수", "증거수집", "파트너매칭", "처리중", "완료"] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.statusChip,
                    acc.status === s && { backgroundColor: ACCIDENT_STATUS_COLOR[s] },
                  ]}
                  onPress={() =>
                    updateAccidentMutation.mutate({ id: acc.id, status: s })
                  }
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      acc.status === s && { color: "#fff" },
                    ]}
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
          <Text style={styles.emptyTitle}>접수된 사고가 없습니다</Text>
        </View>
      }
    />
  );

  const renderPartners = () => (
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
              <Text style={styles.statusText}>{PARTNER_STATUS_LABEL[item.status] ?? item.status}</Text>
            </View>
            <Text style={styles.categoryBadge}>{item.category}</Text>
          </View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSub}>📞 {item.phone}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>📍 {item.address}</Text>
          <View style={styles.partnerStats}>
            <Text style={styles.partnerStat}>⭐ {Number(item.rating).toFixed(1)}</Text>
            <Text style={styles.partnerStat}>후기 {item.reviewCount}개</Text>
            <Text style={styles.partnerStat}>처리 {item.totalCases}건</Text>
          </View>

          <View style={styles.partnerActions}>
            {item.status !== "active" && (
              <Pressable
                style={[styles.partnerActionBtn, { backgroundColor: "#38A169" }]}
                onPress={() => updatePartnerStatusMutation.mutate({ id: item.id, status: "active" })}
              >
                <Text style={styles.partnerActionText}>승인</Text>
              </Pressable>
            )}
            {item.status !== "inactive" && (
              <Pressable
                style={[styles.partnerActionBtn, { backgroundColor: "#E53E3E" }]}
                onPress={() => updatePartnerStatusMutation.mutate({ id: item.id, status: "inactive" })}
              >
                <Text style={styles.partnerActionText}>정지</Text>
              </Pressable>
            )}
            {item.status !== "pending" && (
              <Pressable
                style={[styles.partnerActionBtn, { backgroundColor: "#718096" }]}
                onPress={() => updatePartnerStatusMutation.mutate({ id: item.id, status: "pending" })}
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
  );

  if (statsQuery.isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#3182CE" />
        <Text style={styles.loadingText}>관리자 데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ 관리자 대시보드</Text>
        <Pressable onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>새로고침</Text>
        </Pressable>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(["대시보드", "사고관리", "파트너관리"] as AdminTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* 콘텐츠 */}
      {activeTab === "대시보드" && renderDashboard()}
      {activeTab === "사고관리" && renderAccidents()}
      {activeTab === "파트너관리" && renderPartners()}

      {/* 파트너 배정 모달 */}
      <Modal visible={!!selectedAccident} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setSelectedAccident(null)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>파트너 직접 배정</Text>
          <Text style={styles.sheetSub}>
            사고 ID: {selectedAccident?.id} · {selectedAccident?.accidentType}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>파트너 ID 입력</Text>
            <TextInput
              style={styles.input}
              value={assignPartnerId}
              onChangeText={setAssignPartnerId}
              placeholder="파트너 ID를 입력하세요"
              keyboardType="numeric"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          {/* 활성 파트너 목록 */}
          <Text style={styles.inputLabel}>또는 목록에서 선택</Text>
          <ScrollView style={styles.partnerPickerList}>
            {partners
              .filter((p: any) => p.status === "active")
              .map((p: any) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.partnerPickerItem,
                    assignPartnerId === String(p.id) && styles.partnerPickerItemActive,
                  ]}
                  onPress={() => setAssignPartnerId(String(p.id))}
                >
                  <Text style={styles.partnerPickerName}>{p.name}</Text>
                  <Text style={styles.partnerPickerCat}>{p.category}</Text>
                </Pressable>
              ))}
          </ScrollView>

          <Pressable
            style={[styles.confirmBtn, !assignPartnerId && styles.confirmBtnDisabled]}
            onPress={() => {
              if (!assignPartnerId || !selectedAccident) return;
              assignPartnerMutation.mutate({
                accidentId: selectedAccident.id,
                partnerId: parseInt(assignPartnerId),
              });
            }}
            disabled={!assignPartnerId}
          >
            {assignPartnerMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>배정 확인</Text>
            )}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1A202C",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#3182CE" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#718096" },
  tabTextActive: { color: "#3182CE" },
  scroll: { flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A5568",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#718096" },
  accidentStatusGrid: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  accidentStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accidentStatusDot: { width: 10, height: 10, borderRadius: 5 },
  accidentStatusLabel: { flex: 1, fontSize: 14, color: "#4A5568" },
  accidentStatusCount: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  recentInfo: { flex: 1 },
  recentType: { fontSize: 14, fontWeight: "600", color: "#1A202C" },
  recentUser: { fontSize: 12, color: "#718096" },
  recentStatus: { fontSize: 12, fontWeight: "600", color: "#4A5568" },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  categoryBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3182CE",
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardDate: { fontSize: 12, color: "#A0AEC0" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  cardSub: { fontSize: 13, color: "#4A5568" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#EDF2F7",
  },
  statusChipText: { fontSize: 11, fontWeight: "600", color: "#4A5568" },
  assignBtn: {
    backgroundColor: "#EBF8FF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  assignBtnText: { fontSize: 14, fontWeight: "600", color: "#3182CE" },
  partnerStats: { flexDirection: "row", gap: 12, marginTop: 4 },
  partnerStat: { fontSize: 13, color: "#718096" },
  partnerActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  partnerActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  partnerActionText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#4A5568" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#718096" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "70%",
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#1A202C" },
  sheetSub: { fontSize: 13, color: "#718096" },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#4A5568" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1A202C",
    backgroundColor: "#F7FAFC",
  },
  partnerPickerList: { maxHeight: 160 },
  partnerPickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F7FAFC",
    marginBottom: 6,
  },
  partnerPickerItemActive: { backgroundColor: "#EBF8FF", borderWidth: 1, borderColor: "#3182CE" },
  partnerPickerName: { fontSize: 14, fontWeight: "600", color: "#1A202C" },
  partnerPickerCat: { fontSize: 12, color: "#718096" },
  confirmBtn: {
    backgroundColor: "#3182CE",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  confirmBtnDisabled: { backgroundColor: "#A0AEC0" },
  confirmBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
