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

type TabType = "대기" | "진행" | "완료" | "통계";

const STATUS_COLOR: Record<string, string> = {
  요청: "#ED8936",
  수락: "#3182CE",
  완료: "#38A169",
  거절: "#E53E3E",
};

export default function PartnerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("대기");
  const [selectedMatching, setSelectedMatching] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [feeText, setFeeText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const profileQuery = trpc.partner.myProfile.useQuery();
  const requestsQuery = trpc.partner.myRequests.useQuery();
  const statsQuery = trpc.partner.myStats.useQuery();
  const utils = trpc.useUtils();

  const respondMutation = trpc.partner.respondMatching.useMutation({
    onSuccess: () => {
      utils.partner.myRequests.invalidate();
      setSelectedMatching(null);
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const completeMutation = trpc.partner.completeMatching.useMutation({
    onSuccess: () => {
      utils.partner.myRequests.invalidate();
      setSelectedMatching(null);
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await utils.partner.myRequests.invalidate();
    await utils.partner.myStats.invalidate();
    setRefreshing(false);
  };

  const requests = requestsQuery.data ?? [];

  const filtered = requests.filter((r: any) => {
    const s = r.matching?.status ?? r.status;
    if (activeTab === "대기") return s === "요청";
    if (activeTab === "진행") return s === "수락";
    if (activeTab === "완료") return s === "완료" || s === "거절";
    return true;
  });

  const stats = statsQuery.data;
  const profile = profileQuery.data;

  const handleAccept = (item: any) => {
    setSelectedMatching({ ...item, action: "수락" });
    setNoteText("");
  };

  const handleReject = (item: any) => {
    setSelectedMatching({ ...item, action: "거절" });
    setNoteText("");
  };

  const handleComplete = (item: any) => {
    setSelectedMatching({ ...item, action: "완료" });
    setNoteText("");
    setFeeText("");
  };

  const confirmAction = () => {
    if (!selectedMatching) return;
    const matchingId = selectedMatching.matching?.id ?? selectedMatching.id;
    if (selectedMatching.action === "완료") {
      completeMutation.mutate({ matchingId, fee: feeText || undefined, note: noteText || undefined });
    } else {
      respondMutation.mutate({
        matchingId,
        action: selectedMatching.action,
        note: noteText || undefined,
      });
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const matching = item.matching ?? item;
    const accident = item.accident ?? {};
    const user = item.user ?? {};
    const status = matching.status;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[status] ?? "#718096" }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.cardDate}>
            {matching.requestedAt ? new Date(matching.requestedAt).toLocaleDateString("ko-KR") : ""}
          </Text>
        </View>

        <Text style={styles.accidentType}>{accident.accidentType ?? "사고 유형 미상"}</Text>
        <Text style={styles.accidentLocation} numberOfLines={1}>
          📍 {accident.location ?? "위치 정보 없음"}
        </Text>
        <Text style={styles.userName}>👤 {user.name ?? "사용자"}</Text>

        {accident.injuryLevel && accident.injuryLevel !== "없음" && (
          <View style={styles.injuryBadge}>
            <Text style={styles.injuryText}>부상: {accident.injuryLevel}</Text>
          </View>
        )}

        {matching.note ? (
          <Text style={styles.noteText} numberOfLines={2}>메모: {matching.note}</Text>
        ) : null}

        {status === "요청" && (
          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(item)}>
              <Text style={styles.actionBtnText}>수락</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(item)}>
              <Text style={styles.actionBtnText}>거절</Text>
            </Pressable>
          </View>
        )}

        {status === "수락" && (
          <Pressable style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleComplete(item)}>
            <Text style={styles.actionBtnText}>처리 완료</Text>
          </Pressable>
        )}
      </View>
    );
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#3182CE" />
        <Text style={styles.loadingText}>파트너 정보 불러오는 중...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>🏢</Text>
        <Text style={styles.emptyTitle}>파트너 계정이 아닙니다</Text>
        <Text style={styles.emptyDesc}>관리자에게 파트너 등록을 요청하세요.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{profile.name}</Text>
          <Text style={styles.headerSub}>{profile.category} · {profile.status === "active" ? "✅ 활성" : "⏸ 비활성"}</Text>
        </View>
        <View style={styles.ratingBox}>
          <Text style={styles.ratingNum}>⭐ {Number(profile.rating).toFixed(1)}</Text>
          <Text style={styles.ratingCount}>후기 {profile.reviewCount}개</Text>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(["대기", "진행", "완료", "통계"] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {tab !== "통계" && (
              <Text style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
                {tab === "대기"
                  ? requests.filter((r: any) => (r.matching?.status ?? r.status) === "요청").length
                  : tab === "진행"
                  ? requests.filter((r: any) => (r.matching?.status ?? r.status) === "수락").length
                  : requests.filter((r: any) => ["완료", "거절"].includes(r.matching?.status ?? r.status)).length}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* 콘텐츠 */}
      {activeTab === "통계" ? (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statsGrid}>
            {[
              { label: "전체 요청", value: stats?.total ?? 0, color: "#3182CE" },
              { label: "수락", value: stats?.수락 ?? 0, color: "#38A169" },
              { label: "완료", value: stats?.완료 ?? 0, color: "#805AD5" },
              { label: "거절", value: stats?.거절 ?? 0, color: "#E53E3E" },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>업체 정보</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>전화번호</Text>
              <Text style={styles.infoVal}>{profile.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>주소</Text>
              <Text style={styles.infoVal}>{profile.address}</Text>
            </View>
            {profile.description ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>소개</Text>
                <Text style={styles.infoVal}>{profile.description}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => String(item.matching?.id ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "대기" ? "대기 중인 요청이 없습니다" : activeTab === "진행" ? "진행 중인 건이 없습니다" : "처리 내역이 없습니다"}
              </Text>
            </View>
          }
        />
      )}

      {/* 수락/거절/완료 모달 */}
      <Modal visible={!!selectedMatching} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setSelectedMatching(null)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {selectedMatching?.action === "수락"
              ? "✅ 요청 수락"
              : selectedMatching?.action === "거절"
              ? "❌ 요청 거절"
              : "🏁 처리 완료"}
          </Text>

          {selectedMatching?.action === "완료" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>처리 금액 (원)</Text>
              <TextInput
                style={styles.input}
                value={feeText}
                onChangeText={setFeeText}
                placeholder="예: 150000"
                keyboardType="numeric"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>메모 (선택)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="고객에게 전달할 메모를 입력하세요"
              multiline
              numberOfLines={3}
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <Pressable
            style={[
              styles.confirmBtn,
              selectedMatching?.action === "거절" ? styles.confirmReject : styles.confirmAccept,
            ]}
            onPress={confirmAction}
          >
            {respondMutation.isPending || completeMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>확인</Text>
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A202C" },
  headerSub: { fontSize: 13, color: "#718096", marginTop: 2 },
  ratingBox: { alignItems: "flex-end" },
  ratingNum: { fontSize: 16, fontWeight: "700", color: "#D69E2E" },
  ratingCount: { fontSize: 12, color: "#718096" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#3182CE" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#718096" },
  tabTextActive: { color: "#3182CE" },
  tabCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#718096",
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountActive: { color: "#3182CE", backgroundColor: "#EBF8FF" },
  scroll: { flex: 1 },
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
  cardDate: { fontSize: 12, color: "#A0AEC0" },
  accidentType: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  accidentLocation: { fontSize: 13, color: "#4A5568" },
  userName: { fontSize: 13, color: "#4A5568" },
  injuryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF5F5",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  injuryText: { fontSize: 12, color: "#E53E3E", fontWeight: "600" },
  noteText: { fontSize: 12, color: "#718096", fontStyle: "italic" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtn: { backgroundColor: "#3182CE" },
  rejectBtn: { backgroundColor: "#E53E3E" },
  completeBtn: { backgroundColor: "#38A169", marginTop: 4 },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#4A5568" },
  emptyDesc: { fontSize: 14, color: "#718096", textAlign: "center" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
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
  },
  statValue: { fontSize: 32, fontWeight: "800" },
  statLabel: { fontSize: 13, color: "#718096", marginTop: 4 },
  infoSection: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: "#1A202C", marginBottom: 4 },
  infoRow: { flexDirection: "row", gap: 12 },
  infoKey: { fontSize: 13, color: "#718096", width: 64 },
  infoVal: { fontSize: 13, color: "#1A202C", flex: 1 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#718096" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#1A202C" },
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
  inputMulti: { height: 80, textAlignVertical: "top" },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  confirmAccept: { backgroundColor: "#3182CE" },
  confirmReject: { backgroundColor: "#E53E3E" },
  confirmBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
