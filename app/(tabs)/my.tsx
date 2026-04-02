import { ScrollView, Text, View, Pressable, StyleSheet, Switch } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { roleStore } from "@/lib/role-store";

const ACCIDENT_HISTORY = [
  {
    id: "1",
    date: "2026.03.10",
    title: "강남구 테헤란로 추돌사고",
    status: "처리 중",
    statusColor: "#DD6B20",
    amount: "수리비 320만원 (진행 중)",
  },
  {
    id: "2",
    date: "2024.08.22",
    title: "송파구 올림픽로 접촉사고",
    status: "완료",
    statusColor: "#38A169",
    amount: "합의금 150만원 수령",
  },
  {
    id: "3",
    date: "2023.11.05",
    title: "분당 주차장 후진 충돌",
    status: "완료",
    statusColor: "#38A169",
    amount: "수리비 45만원 처리",
  },
];

export default function MyScreen() {
  const router = useRouter();
  const [dangerAlertOn, setDangerAlertOn] = useState(true);
  const [insuranceAlertOn, setInsuranceAlertOn] = useState(true);
  const [marketPriceOn, setMarketPriceOn] = useState(true);

  // 파트너 신청 상태 조회
  const partnerStatusQuery = trpc.partnerApply.myApplicationStatus.useQuery(undefined, {
    retry: false,
  });

  // 현재 로그인 사용자 역할 조회
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const currentRole = meQuery.data?.role ?? "user";
  const [switchingRole, setSwitchingRole] = useState(false);
  const devSwitchRole = trpc.auth.devSwitchRole.useMutation({
    onSuccess: async (data) => {
      // DB 저장 완료 - roleStore는 이미 이전에 업데이트됨
      // trpc 캐시 무효화로 다음 요청에서 최신 role 반영
      await utils.auth.me.invalidate();
      setSwitchingRole(false);
    },
    onError: (err) => {
      // 실패 시 roleStore 롤백
      console.error("Role switch failed:", err);
      setSwitchingRole(false);
    },
  });

  // 온보딩 등록 데이터
  const [userName, setUserName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [insurances, setInsurances] = useState<string[]>([]);

  const INSURANCE_NAMES: Record<string, string> = {
    samsung: "삼성화재",
    hyundai: "현대해상",
    kb: "KB손해보험",
    db: "DB손해보험",
    meritz: "메리츠화재",
    lotte: "롯데손해보험",
    hanwha: "한화손해보험",
    mgen: "MG손해보험",
  };

  const refreshProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem("userProfile");
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile.name) setUserName(profile.name);
        if (profile.plate) setPlateNumber(profile.plate);
        if (profile.insurance && profile.insurance.length > 0) {
          setInsurances(profile.insurance.map((id: string) => INSURANCE_NAMES[id] || id));
        } else {
          setInsurances([]);
        }
      }
    } catch (e) {
      console.log("프로필 로드 오류", e);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  // 소화면 복귀 시 자동 갱신
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <IconSymbol name="person.fill" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName ? `${userName} 운전자님` : "운전자님"}</Text>
            <Text style={styles.profileSub}>
              {plateNumber ? `차량번호 ${plateNumber}` : "차량 미등록"}
              {insurances.length > 0 ? ` · ${insurances[0]} 외 ${insurances.length - 1}건` : ""}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/vehicle-manage" as never)}
          >
            <IconSymbol name="pencil" size={16} color="#3182CE" />
          </Pressable>
        </View>

        {/* 파트너 신청 상태 배너 */}
        {partnerStatusQuery.data && (
          <Pressable
            style={[
              styles.partnerBanner,
              partnerStatusQuery.data.status === "active" && styles.partnerBannerActive,
              partnerStatusQuery.data.status === "inactive" && styles.partnerBannerInactive,
            ]}
            onPress={() => {
              if (partnerStatusQuery.data?.status === "active") {
                // 파트너 대시보드는 탭에서 직접 접근
              }
            }}
          >
            <Text style={styles.partnerBannerIcon}>
              {partnerStatusQuery.data.status === "active" ? "✅" :
               partnerStatusQuery.data.status === "pending" ? "⏳" : "❌"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerBannerTitle}>
                {partnerStatusQuery.data.status === "active"
                  ? `파트너 업체 승인 완료`
                  : partnerStatusQuery.data.status === "pending"
                  ? `파트너 신청 심사 중`
                  : `파트너 신청 거절`}
              </Text>
              <Text style={styles.partnerBannerSub}>
                {partnerStatusQuery.data.name} · {partnerStatusQuery.data.category}
                {partnerStatusQuery.data.status === "pending" && " · 관리자 승인 대기 중"}
                {partnerStatusQuery.data.status === "active" && " · 업체 포털 탭에서 확인"}
                {partnerStatusQuery.data.status === "inactive" && " · 다시 신청하려면 관리자에 문의"}
              </Text>
            </View>
            {partnerStatusQuery.data.status === "active" && (
              <Text style={{ fontSize: 16, color: "#38A169" }}>›</Text>
            )}
          </Pressable>
        )}

        {/* 내 차량 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 차량 관리</Text>
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/vehicle-manage" as never)}
            >
              <IconSymbol name="pencil" size={16} color="#3182CE" />
              <Text style={styles.addBtnText}>수정</Text>
            </Pressable>
          </View>

          <View style={styles.carItem}>
            <View style={styles.carItemLeft}>
              <View style={styles.carIconBox}>
                <IconSymbol name="car.fill" size={22} color="#3182CE" />
              </View>
              <View>
                <Text style={styles.carItemName}>내 차량</Text>
                <Text style={styles.carItemPlate}>{plateNumber || "번호판 미등록"}</Text>
              </View>
            </View>
            <View style={styles.carItemRight}>
              <Text style={styles.carItemValue}>1,850만원</Text>
              <Text style={styles.carItemValueLabel}>예상 시세</Text>
            </View>
          </View>

          <View style={styles.insuranceBox}>
            <View style={styles.insuranceLeft}>
              <IconSymbol name="doc.text.fill" size={16} color="#805AD5" />
              <View>
                <Text style={styles.insuranceName}>
                  {insurances.length > 0 ? insurances.join(" · ") : "보험사 미등록"}
                </Text>
                <Text style={styles.insuranceSub}>등록된 보험사</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.insuranceBadge, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/insurance-save" as never)}
            >
              <Text style={styles.insuranceBadgeText}>보험료 절약 →</Text>
            </Pressable>
          </View>
        </View>

        {/* 사고 이력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사고 이력</Text>
          {ACCIDENT_HISTORY.map((item, idx) => (
            <View key={item.id} style={[styles.historyItem, idx < ACCIDENT_HISTORY.length - 1 && styles.historyItemBorder]}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyAmount}>{item.amount}</Text>
              </View>
              <View style={[styles.historyStatus, { backgroundColor: item.statusColor + "15" }]}>
                <Text style={[styles.historyStatusText, { color: item.statusColor }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: "#FFF5F0" }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#DD6B20" />
              </View>
              <View>
                <Text style={styles.settingLabel}>실시간 위험 구간 알림</Text>
                <Text style={styles.settingSub}>사고 다발 구간 진입 시 알림</Text>
              </View>
            </View>
            <Switch
              value={dangerAlertOn}
              onValueChange={setDangerAlertOn}
              trackColor={{ false: "#E2E8F0", true: "#BEE3F8" }}
              thumbColor={dangerAlertOn ? "#3182CE" : "#A0AEC0"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: "#F0FFF4" }]}>
                <IconSymbol name="shield.fill" size={16} color="#38A169" />
              </View>
              <View>
                <Text style={styles.settingLabel}>보험 갱신 알림</Text>
                <Text style={styles.settingSub}>갱신일 30일·7일·1일 전 알림</Text>
              </View>
            </View>
            <Switch
              value={insuranceAlertOn}
              onValueChange={setInsuranceAlertOn}
              trackColor={{ false: "#E2E8F0", true: "#BEE3F8" }}
              thumbColor={insuranceAlertOn ? "#3182CE" : "#A0AEC0"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: "#EBF4FF" }]}>
                <IconSymbol name="car.fill" size={16} color="#3182CE" />
              </View>
              <View>
                <Text style={styles.settingLabel}>내 차 시세 변동 알림</Text>
                <Text style={styles.settingSub}>월 1회 시세 업데이트 알림</Text>
              </View>
            </View>
            <Switch
              value={marketPriceOn}
              onValueChange={setMarketPriceOn}
              trackColor={{ false: "#E2E8F0", true: "#BEE3F8" }}
              thumbColor={marketPriceOn ? "#3182CE" : "#A0AEC0"}
            />
          </View>
        </View>

        {/* 기타 메뉴 */}
        <View style={styles.section}>
          {[
            { icon: "flame.fill" as const, label: "안전운전 포인트", color: "#DD6B20", route: "/reward" },
            { icon: "shield.fill" as const, label: "보험료 절약 알리미", color: "#3182CE", route: "/insurance-save" },
            { icon: "car.fill" as const, label: "내 차량 관리", color: "#3182CE", route: "/vehicle-manage" },
            { icon: "location.fill" as const, label: "드라이브 모드 자동 시작", color: "#38A169", route: "/drive-mode-settings" },
            { icon: "bell.fill" as const, label: "교통사고 꾸팟 알림", color: "#F59E0B", route: "/tip-notification-settings" },
            { icon: "building.2.fill" as const, label: "파트너 업체 등록 신청", color: "#805AD5", route: "/partner-register" },
            { icon: "doc.text.fill" as const, label: "정산 관리", color: "#38A169", route: "/settlement" },
            { icon: "info.circle.fill" as const, label: "앱 정보", color: "#718096", route: null },
            { icon: "gear" as const, label: "고객센터", color: "#718096", route: null },
          ].map((item, idx, arr) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                idx < arr.length - 1 && styles.menuItemBorder,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => item.route && router.push(item.route as never)}
            >
              <IconSymbol name={item.icon} size={18} color={item.color} />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              <IconSymbol name="chevron.right" size={16} color="#CBD5E0" />
            </Pressable>
          ))}
        </View>

        {/* 개발용 역할 전환 */}
        <View style={styles.devRoleSection}>
          <View style={styles.devRoleHeader}>
            <Text style={styles.devRoleTitle}>🛠️ 개발용 역할 전환</Text>
            <View style={styles.devRoleBadge}>
              <Text style={styles.devRoleBadgeText}>DEV ONLY</Text>
            </View>
          </View>
          <Text style={styles.devRoleDesc}>현재 역할: <Text style={{ fontWeight: "700", color: "#1A2B4C" }}>{currentRole === "admin" ? "관리자" : currentRole === "partner" ? "파트너" : "일반 사용자"}</Text></Text>
          <View style={styles.devRoleBtnRow}>
            {([
              { role: "user" as const, label: "일반 사용자", icon: "👤", color: "#3182CE" },
              { role: "partner" as const, label: "파트너", icon: "🏢", color: "#38A169" },
              { role: "admin" as const, label: "관리자", icon: "🛡️", color: "#805AD5" },
            ] as const).map((item) => (
              <Pressable
                key={item.role}
                style={({ pressed }) => [
                  styles.devRoleBtn,
                  currentRole === item.role && { borderColor: item.color, backgroundColor: item.color + "15" },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => {
                  if (switchingRole) return;
                  setSwitchingRole(true);
                  // 즉시 roleStore 업데이트 → HomeScreen/탭바 즉시 전환
                  roleStore.setRole(item.role);
                  // 홈으로 먼저 이동
                  router.replace("/(tabs)" as never);
                  // 백그라운드에서 DB 업데이트
                  devSwitchRole.mutate({ role: item.role });
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Text style={[
                  styles.devRoleBtnLabel,
                  currentRole === item.role && { color: item.color, fontWeight: "700" },
                ]}>{item.label}</Text>
                {currentRole === item.role && (
                  <View style={[styles.devRoleActiveDot, { backgroundColor: item.color }]} />
                )}
              </Pressable>
            ))}
          </View>
          {switchingRole && (
            <Text style={styles.devRoleSwitching}>⏳ 역할 전환 중...</Text>
          )}
        </View>

        <View style={styles.versionBox}>
          <Text style={styles.versionText}>사고케어 v1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A2B4C",
    padding: 20,
    gap: 14,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 13,
    color: "#90CDF4",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    color: "#3182CE",
    fontWeight: "600",
  },
  carItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  carItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  carItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  carItemPlate: {
    fontSize: 12,
    color: "#718096",
  },
  carItemRight: {
    alignItems: "flex-end",
  },
  carItemValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  carItemValueLabel: {
    fontSize: 11,
    color: "#A0AEC0",
    marginTop: 2,
  },
  insuranceBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAF5FF",
    borderRadius: 10,
    padding: 12,
  },
  insuranceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  insuranceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  insuranceSub: {
    fontSize: 11,
    color: "#718096",
  },
  insuranceBadge: {
    backgroundColor: "#E9D8FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  insuranceBadgeText: {
    fontSize: 11,
    color: "#805AD5",
    fontWeight: "700",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 11,
    color: "#A0AEC0",
    marginBottom: 3,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 3,
  },
  historyAmount: {
    fontSize: 12,
    color: "#718096",
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
    color: "#A0AEC0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "500",
  },
  versionBox: {
    alignItems: "center",
    padding: 24,
  },
  versionText: {
    fontSize: 12,
    color: "#CBD5E0",
  },
  partnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#F6AD55",
  },
  partnerBannerActive: {
    backgroundColor: "#F0FFF4",
    borderColor: "#68D391",
  },
  partnerBannerInactive: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FC8181",
  },
  partnerBannerIcon: { fontSize: 24 },
  partnerBannerTitle: { fontSize: 14, fontWeight: "700", color: "#1A202C" },
  partnerBannerSub: { fontSize: 12, color: "#718096", marginTop: 2 },
  // 개발용 역할 전환
  devRoleSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#1A2B4C",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  devRoleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  devRoleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  devRoleBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  devRoleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
  },
  devRoleDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  devRoleBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  devRoleBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    position: "relative",
  },
  devRoleBtnLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  devRoleActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  devRoleSwitching: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});
