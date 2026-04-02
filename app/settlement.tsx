import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORY_ICONS: Record<string, string> = {
  공업사: "🔧", 렉카: "🚛", 병원: "🏥", 변호사: "⚖️", 손해사정사: "📋",
};

function formatMoney(val: string | number | null | undefined): string {
  if (!val) return "미입력";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "미입력";
  return n.toLocaleString("ko-KR") + "원";
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function SettlementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"monthly" | "detail">("monthly");
  const [feeModal, setFeeModal] = useState<{ matchingId: number; currentFee: string } | null>(null);
  const [feeInput, setFeeInput] = useState("");

  const monthlyQuery = trpc.settlement.monthly.useQuery();
  const completedQuery = trpc.settlement.completedList.useQuery();
  const utils = trpc.useUtils();

  const updateFeeMutation = trpc.settlement.updateFee.useMutation({
    onSuccess: () => {
      utils.settlement.completedList.invalidate();
      utils.settlement.monthly.invalidate();
      setFeeModal(null);
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const monthly = monthlyQuery.data ?? [];
  const completed = completedQuery.data ?? [];

  const totalRevenue = monthly.reduce((s, m) => s + Number(m.totalFee ?? 0), 0);
  const totalCases = monthly.reduce((s, m) => s + Number(m.count ?? 0), 0);

  const openFeeModal = (matchingId: number, currentFee: string | null | undefined) => {
    setFeeInput(currentFee ? String(parseFloat(currentFee)) : "");
    setFeeModal({ matchingId, currentFee: currentFee ?? "" });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>정산 관리</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 요약 카드 */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>총 완료 건수</Text>
          <Text style={styles.summaryValue}>{totalCases}건</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardAccent]}>
          <Text style={[styles.summaryLabel, { color: "#fff" }]}>총 매출</Text>
          <Text style={[styles.summaryValue, { color: "#fff" }]}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>평균 단가</Text>
          <Text style={styles.summaryValue}>
            {totalCases > 0 ? formatMoney(Math.round(totalRevenue / totalCases)) : "-"}
          </Text>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(["monthly", "detail"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "monthly" ? "📅 월별 정산" : "📋 건별 내역"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 월별 정산 탭 */}
      {activeTab === "monthly" && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {monthlyQuery.isLoading ? (
            <ActivityIndicator color="#3182CE" style={{ marginTop: 40 }} />
          ) : monthly.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>정산 내역이 없습니다</Text>
              <Text style={styles.emptyDesc}>완료된 의뢰가 생기면 월별 정산이 집계됩니다.</Text>
            </View>
          ) : (
            monthly.map((m, idx) => (
              <View key={idx} style={styles.monthCard}>
                <View style={styles.monthCardHeader}>
                  <Text style={styles.monthLabel}>{m.year}년 {m.month}월</Text>
                  <View style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>{Number(m.count)}건</Text>
                  </View>
                </View>
                <View style={styles.monthCardBody}>
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatLabel}>매출 합계</Text>
                    <Text style={styles.monthStatValue}>{formatMoney(m.totalFee)}</Text>
                  </View>
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatLabel}>건당 평균</Text>
                    <Text style={styles.monthStatValue}>
                      {Number(m.count) > 0 ? formatMoney(Math.round(Number(m.totalFee) / Number(m.count))) : "-"}
                    </Text>
                  </View>
                </View>
                {/* 간단한 막대 그래프 */}
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, (Number(m.totalFee) / Math.max(...monthly.map((x) => Number(x.totalFee)), 1)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* 건별 내역 탭 */}
      {activeTab === "detail" && (
        <FlatList
          data={completed}
          keyExtractor={(item) => String(item.matching.id)}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={
            completedQuery.isLoading ? (
              <ActivityIndicator color="#3182CE" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>완료된 의뢰가 없습니다</Text>
                <Text style={styles.emptyDesc}>의뢰를 완료하면 여기에 표시됩니다.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.detailCard}>
              <View style={styles.detailTop}>
                <View style={styles.detailLeft}>
                  <Text style={styles.detailType}>
                    {item.accident?.accidentType ?? "사고"}
                  </Text>
                  <Text style={styles.detailDate}>
                    완료일: {formatDate(item.matching.completedAt)}
                  </Text>
                  {item.user?.name && (
                    <Text style={styles.detailUser}>고객: {item.user.name}</Text>
                  )}
                  {item.accident?.location && (
                    <Text style={styles.detailLocation}>📍 {item.accident.location}</Text>
                  )}
                </View>
                <View style={styles.detailRight}>
                  <Text style={styles.detailFee}>{formatMoney(item.matching.fee)}</Text>
                  <Pressable
                    style={styles.editFeeBtn}
                    onPress={() => openFeeModal(item.matching.id, item.matching.fee)}
                  >
                    <Text style={styles.editFeeBtnText}>금액 수정</Text>
                  </Pressable>
                </View>
              </View>
              {item.matching.note && (
                <Text style={styles.detailNote}>메모: {item.matching.note}</Text>
              )}
            </View>
          )}
        />
      )}

      {/* 금액 수정 모달 */}
      <Modal visible={!!feeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>처리 금액 입력</Text>
            <Text style={styles.modalDesc}>이 의뢰의 처리 금액을 입력하세요 (원 단위)</Text>
            <TextInput
              style={styles.modalInput}
              value={feeInput}
              onChangeText={setFeeInput}
              keyboardType="numeric"
              placeholder="예: 320000"
              placeholderTextColor="#A0AEC0"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setFeeModal(null)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={() => {
                  if (!feeModal) return;
                  updateFeeMutation.mutate({
                    matchingId: feeModal.matchingId,
                    fee: feeInput,
                  });
                }}
              >
                {updateFeeMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>저장</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { width: 60 },
  backText: { fontSize: 14, color: "#3182CE", fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryCardAccent: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  summaryLabel: { fontSize: 11, color: "#718096", fontWeight: "500" },
  summaryValue: { fontSize: 16, fontWeight: "800", color: "#1A202C" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#3182CE" },
  tabText: { fontSize: 14, color: "#A0AEC0", fontWeight: "600" },
  tabTextActive: { color: "#3182CE" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#4A5568" },
  emptyDesc: { fontSize: 13, color: "#A0AEC0", textAlign: "center" },
  monthCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  monthCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthLabel: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  monthBadge: { backgroundColor: "#EBF8FF", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  monthBadgeText: { fontSize: 12, color: "#3182CE", fontWeight: "700" },
  monthCardBody: { flexDirection: "row", gap: 16 },
  monthStat: { gap: 2 },
  monthStatLabel: { fontSize: 11, color: "#718096" },
  monthStatValue: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  barBg: { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#3182CE", borderRadius: 3 },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  detailTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailLeft: { flex: 1, gap: 3 },
  detailType: { fontSize: 15, fontWeight: "700", color: "#1A202C" },
  detailDate: { fontSize: 12, color: "#718096" },
  detailUser: { fontSize: 12, color: "#4A5568" },
  detailLocation: { fontSize: 12, color: "#4A5568" },
  detailRight: { alignItems: "flex-end", gap: 6 },
  detailFee: { fontSize: 16, fontWeight: "800", color: "#3182CE" },
  editFeeBtn: {
    backgroundColor: "#EBF8FF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editFeeBtnText: { fontSize: 12, color: "#3182CE", fontWeight: "600" },
  detailNote: { fontSize: 12, color: "#718096", backgroundColor: "#F7FAFC", borderRadius: 6, padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A202C" },
  modalDesc: { fontSize: 13, color: "#718096" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A202C",
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#718096" },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: "#3182CE",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
