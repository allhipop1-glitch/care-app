import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";

// ─── 목업 데이터 ───────────────────────────────────────────
const MOCK_USERS = [
  { id: "u001", name: "김민준", phone: "010-1234-5678", plate: "12가 3456", insurance: "삼성화재", points: 2840, accidents: 1, joinDate: "2025-11-03", status: "active" },
  { id: "u002", name: "이서연", phone: "010-9876-5432", plate: "98나 7654", insurance: "현대해상", points: 1200, accidents: 0, joinDate: "2025-12-15", status: "active" },
  { id: "u003", name: "박도현", phone: "010-5555-1234", plate: "55다 1234", insurance: "KB손해보험", points: 450, accidents: 2, joinDate: "2026-01-08", status: "active" },
  { id: "u004", name: "최지우", phone: "010-3333-7890", plate: "33라 7890", insurance: "DB손해보험", points: 3100, accidents: 0, joinDate: "2025-10-22", status: "active" },
  { id: "u005", name: "정하은", phone: "010-7777-2345", plate: "77마 2345", insurance: "메리츠화재", points: 980, accidents: 1, joinDate: "2026-02-14", status: "inactive" },
  { id: "u006", name: "강지호", phone: "010-2222-6789", plate: "22바 6789", insurance: "삼성화재", points: 5200, accidents: 0, joinDate: "2025-09-01", status: "active" },
  { id: "u007", name: "윤서현", phone: "010-8888-3456", plate: "88사 3456", insurance: "현대해상", points: 760, accidents: 3, joinDate: "2026-01-30", status: "active" },
  { id: "u008", name: "임준혁", phone: "010-4444-8901", plate: "44아 8901", insurance: "롯데손해보험", points: 120, accidents: 0, joinDate: "2026-03-05", status: "active" },
];

type User = (typeof MOCK_USERS)[number];

const STATUS_COLORS: Record<string, string> = {
  active: "#38A169",
  inactive: "#A0AEC0",
};

export default function AdminUsersScreen() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const filtered = MOCK_USERS.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.includes(q) || u.phone.includes(q) || u.plate.includes(q);
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPoints = MOCK_USERS.reduce((s, u) => s + u.points, 0);
  const totalAccidents = MOCK_USERS.reduce((s, u) => s + u.accidents, 0);

  if (selectedUser) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => setSelectedUser(null)}>
            <Text style={styles.backBtnText}>← 목록</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>사용자 상세</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 24, gap: 16 }}>
          {/* 프로필 */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{selectedUser.name[0]}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{selectedUser.name}</Text>
              <Text style={styles.profilePhone}>{selectedUser.phone}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedUser.status] + "20" }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[selectedUser.status] }]}>
                  {selectedUser.status === "active" ? "활성" : "비활성"}
                </Text>
              </View>
            </View>
          </View>

          {/* 차량/보험 */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>차량 & 보험</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>차량번호</Text>
              <Text style={styles.detailValue}>{selectedUser.plate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>보험사</Text>
              <Text style={styles.detailValue}>{selectedUser.insurance}</Text>
            </View>
          </View>

          {/* 통계 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{selectedUser.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>보유 포인트</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: selectedUser.accidents > 0 ? "#E53E3E" : "#38A169" }]}>
                {selectedUser.accidents}건
              </Text>
              <Text style={styles.statLabel}>사고 이력</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{selectedUser.joinDate}</Text>
              <Text style={styles.statLabel}>가입일</Text>
            </View>
          </View>

          {/* 사고 이력 (목업) */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>사고 이력</Text>
            {selectedUser.accidents === 0 ? (
              <Text style={styles.emptyText}>사고 이력이 없습니다.</Text>
            ) : (
              Array.from({ length: selectedUser.accidents }).map((_, i) => (
                <View key={i} style={styles.accidentRow}>
                  <View style={styles.accidentDot} />
                  <View>
                    <Text style={styles.accidentTitle}>교통사고 #{i + 1}</Text>
                    <Text style={styles.accidentDate}>2025-{String(10 + i).padStart(2, "0")}-15 · 처리 완료</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 포인트 내역 (목업) */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>포인트 내역</Text>
            {[
              { label: "캐쉬드라이브 적립", amount: "+120", date: "2026-03-30" },
              { label: "앱 리뷰 작성", amount: "+50", date: "2026-03-28" },
              { label: "포인트 출금", amount: "-5,000", date: "2026-03-20" },
            ].map((item, i) => (
              <View key={i} style={styles.pointRow}>
                <View>
                  <Text style={styles.pointLabel}>{item.label}</Text>
                  <Text style={styles.pointDate}>{item.date}</Text>
                </View>
                <Text style={[styles.pointAmount, { color: item.amount.startsWith("+") ? "#38A169" : "#E53E3E" }]}>
                  {item.amount}원
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← 대시보드</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>사용자 관리</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* 요약 통계 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{MOCK_USERS.length}</Text>
            <Text style={styles.summaryLabel}>전체 사용자</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#38A169" }]}>
              {MOCK_USERS.filter((u) => u.status === "active").length}
            </Text>
            <Text style={styles.summaryLabel}>활성 사용자</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#805AD5" }]}>
              {totalPoints.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>총 포인트</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#E53E3E" }]}>{totalAccidents}</Text>
            <Text style={styles.summaryLabel}>총 사고</Text>
          </View>
        </View>

        {/* 검색 */}
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="이름, 연락처, 차량번호 검색"
          placeholderTextColor="#A0AEC0"
        />

        {/* 상태 필터 */}
        <View style={styles.filterRow}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterBtn, filterStatus === f && styles.filterBtnActive]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[styles.filterBtnText, filterStatus === f && styles.filterBtnTextActive]}>
                {f === "all" ? "전체" : f === "active" ? "활성" : "비활성"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 사용자 목록 */}
        {filtered.map((user) => (
          <Pressable
            key={user.id}
            style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.85 }]}
            onPress={() => setSelectedUser(user)}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name[0]}</Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[user.status] + "20" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[user.status] }]}>
                    {user.status === "active" ? "활성" : "비활성"}
                  </Text>
                </View>
              </View>
              <Text style={styles.userPhone}>{user.phone} · {user.plate}</Text>
              <Text style={styles.userInsurance}>{user.insurance}</Text>
            </View>
            <View style={styles.userStats}>
              <Text style={styles.userPoints}>{user.points.toLocaleString()}P</Text>
              {user.accidents > 0 && (
                <Text style={styles.userAccidents}>사고 {user.accidents}건</Text>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 52 : 16, paddingBottom: 12,
    backgroundColor: "#1A2B4C",
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  scroll: { flex: 1 },

  summaryRow: { flexDirection: "row", gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0",
  },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#1A2B4C" },
  summaryLabel: { fontSize: 10, color: "#718096", marginTop: 2, textAlign: "center" },

  searchInput: {
    backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#1A2B4C", borderWidth: 1, borderColor: "#E2E8F0",
  },

  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF",
  },
  filterBtnActive: { backgroundColor: "#1A2B4C", borderColor: "#1A2B4C" },
  filterBtnText: { fontSize: 13, color: "#718096", fontWeight: "600" },
  filterBtnTextActive: { color: "#FFFFFF" },

  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#EBF8FF", alignItems: "center", justifyContent: "center",
  },
  userAvatarText: { fontSize: 18, fontWeight: "700", color: "#3182CE" },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  userName: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "700" },
  userPhone: { fontSize: 12, color: "#718096" },
  userInsurance: { fontSize: 11, color: "#A0AEC0", marginTop: 2 },
  userStats: { alignItems: "flex-end" },
  userPoints: { fontSize: 14, fontWeight: "700", color: "#805AD5" },
  userAccidents: { fontSize: 11, color: "#E53E3E", marginTop: 2 },

  // 상세 화면
  profileCard: {
    flexDirection: "row", gap: 16, backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#E2E8F0",
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#EBF8FF", alignItems: "center", justifyContent: "center",
  },
  profileAvatarText: { fontSize: 28, fontWeight: "700", color: "#3182CE" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: "800", color: "#1A2B4C" },
  profilePhone: { fontSize: 14, color: "#718096" },

  detailCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0", gap: 10,
  },
  detailCardTitle: { fontSize: 14, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 13, color: "#718096" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#1A2B4C" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0",
  },
  statValue: { fontSize: 16, fontWeight: "800", color: "#1A2B4C" },
  statLabel: { fontSize: 10, color: "#718096", marginTop: 4, textAlign: "center" },

  emptyText: { fontSize: 13, color: "#A0AEC0", textAlign: "center", paddingVertical: 8 },

  accidentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  accidentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E53E3E", marginTop: 5 },
  accidentTitle: { fontSize: 13, fontWeight: "600", color: "#1A2B4C" },
  accidentDate: { fontSize: 11, color: "#718096", marginTop: 2 },

  pointRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pointLabel: { fontSize: 13, fontWeight: "600", color: "#1A2B4C" },
  pointDate: { fontSize: 11, color: "#A0AEC0", marginTop: 2 },
  pointAmount: { fontSize: 14, fontWeight: "700" },
});
