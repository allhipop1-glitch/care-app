import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SAFE_DAYS = 127;
const TOTAL_POINTS = 12700;
const LEVEL_POINTS = 15000;

const HISTORY = [
  { id: "1", date: "2026.03.28", desc: "안전운전 7일 연속 달성", points: +700, type: "earn" },
  { id: "2", date: "2026.03.21", desc: "안전운전 7일 연속 달성", points: +700, type: "earn" },
  { id: "3", date: "2026.03.15", desc: "보험료 할인 쿠폰 교환", points: -3000, type: "use" },
  { id: "4", date: "2026.03.14", desc: "안전운전 7일 연속 달성", points: +700, type: "earn" },
  { id: "5", date: "2026.03.10", desc: "앱 리뷰 작성 보너스", points: +500, type: "earn" },
  { id: "6", date: "2026.03.07", desc: "안전운전 7일 연속 달성", points: +700, type: "earn" },
];

const REWARDS = [
  { id: "1", title: "보험료 1만원 할인 쿠폰", points: 3000, category: "보험", color: "#3182CE" },
  { id: "2", title: "주유 상품권 5천원", points: 5000, category: "주유", color: "#DD6B20" },
  { id: "3", title: "세차 무료 이용권", points: 2000, category: "세차", color: "#38A169" },
  { id: "4", title: "긴급출동 서비스 1회", points: 8000, category: "서비스", color: "#805AD5" },
];

export default function RewardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"status" | "history" | "store">("status");

  const progressPct = Math.min((TOTAL_POINTS / LEVEL_POINTS) * 100, 100);

  const handleExchange = (points: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={22} color="#1A2B4C" />
        </Pressable>
        <Text style={styles.headerTitle}>안전운전 포인트</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 포인트 카드 */}
      <View style={styles.pointCard}>
        <View style={styles.pointCardTop}>
          <View>
            <Text style={styles.pointCardLabel}>보유 포인트</Text>
            <Text style={styles.pointCardAmount}>{TOTAL_POINTS.toLocaleString()}P</Text>
          </View>
          <View style={styles.safeBox}>
            <IconSymbol name="shield.fill" size={20} color="#FFFFFF" />
            <Text style={styles.safeBoxText}>무사고 {SAFE_DAYS}일</Text>
          </View>
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>다음 레벨까지</Text>
          <Text style={styles.levelRemain}>{(LEVEL_POINTS - TOTAL_POINTS).toLocaleString()}P 남음</Text>
        </View>
        <View style={styles.levelBar}>
          <View style={[styles.levelFill, { width: `${progressPct}%` }]} />
        </View>

        <View style={styles.pointStats}>
          <View style={styles.pointStat}>
            <Text style={styles.pointStatNum}>+100P</Text>
            <Text style={styles.pointStatLabel}>일일 적립</Text>
          </View>
          <View style={styles.pointStatDivider} />
          <View style={styles.pointStat}>
            <Text style={styles.pointStatNum}>+700P</Text>
            <Text style={styles.pointStatLabel}>주간 보너스</Text>
          </View>
          <View style={styles.pointStatDivider} />
          <View style={styles.pointStat}>
            <Text style={styles.pointStatNum}>골드</Text>
            <Text style={styles.pointStatLabel}>현재 등급</Text>
          </View>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        {(["status", "history", "store"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "status" ? "적립 현황" : tab === "history" ? "이용 내역" : "리워드 스토어"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 적립 현황 탭 */}
        {activeTab === "status" && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <IconSymbol name="info.circle.fill" size={18} color="#3182CE" />
              <Text style={styles.infoCardText}>
                앱을 켜고 운전하는 동안 사고 없이 주행하면 매일 100P가 자동 적립됩니다.
                7일 연속 달성 시 700P 보너스!
              </Text>
            </View>

            <Text style={styles.sectionTitle}>적립 방법</Text>
            {[
              { icon: "car.fill" as const, title: "안전운전 일일 적립", desc: "앱 켜고 운전 시 하루 100P", color: "#3182CE", points: "+100P/일" },
              { icon: "flame.fill" as const, title: "7일 연속 달성 보너스", desc: "7일 연속 무사고 운전", color: "#DD6B20", points: "+700P" },
              { icon: "heart.fill" as const, title: "앱 리뷰 작성", desc: "앱스토어 리뷰 작성", color: "#E53E3E", points: "+500P" },
              { icon: "magnifyingglass" as const, title: "꿀팁 콘텐츠 읽기", desc: "일일 꿀팁 3개 이상 읽기", color: "#38A169", points: "+50P/일" },
            ].map((item) => (
              <View key={item.title} style={styles.earnCard}>
                <View style={[styles.earnIcon, { backgroundColor: item.color + "15" }]}>
                  <IconSymbol name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.earnInfo}>
                  <Text style={styles.earnTitle}>{item.title}</Text>
                  <Text style={styles.earnDesc}>{item.desc}</Text>
                </View>
                <Text style={[styles.earnPoints, { color: item.color }]}>{item.points}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 이용 내역 탭 */}
        {activeTab === "history" && (
          <View style={styles.tabContent}>
            {HISTORY.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={[
                    styles.historyDot,
                    { backgroundColor: item.type === "earn" ? "#38A169" : "#E53E3E" },
                  ]} />
                  <View>
                    <Text style={styles.historyDesc}>{item.desc}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.historyPoints,
                  { color: item.type === "earn" ? "#38A169" : "#E53E3E" },
                ]}>
                  {item.type === "earn" ? "+" : ""}{item.points.toLocaleString()}P
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 리워드 스토어 탭 */}
        {activeTab === "store" && (
          <View style={styles.tabContent}>
            <Text style={styles.storeBalance}>보유: {TOTAL_POINTS.toLocaleString()}P</Text>
            {REWARDS.map((reward) => {
              const canAfford = TOTAL_POINTS >= reward.points;
              return (
                <View key={reward.id} style={styles.rewardCard}>
                  <View style={[styles.rewardCategoryBadge, { backgroundColor: reward.color + "15" }]}>
                    <Text style={[styles.rewardCategoryText, { color: reward.color }]}>{reward.category}</Text>
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={[styles.rewardPoints, { color: reward.color }]}>
                      {reward.points.toLocaleString()}P
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.exchangeBtn,
                      { backgroundColor: canAfford ? reward.color : "#CBD5E0" },
                      pressed && canAfford && { opacity: 0.8 },
                    ]}
                    onPress={() => canAfford && handleExchange(reward.points)}
                  >
                    <Text style={styles.exchangeBtnText}>교환</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A2B4C",
  },
  pointCard: {
    backgroundColor: "#1A2B4C",
    padding: 20,
    gap: 12,
  },
  pointCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pointCardLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  pointCardAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  safeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  safeBoxText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  levelLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  levelRemain: {
    fontSize: 12,
    color: "#F6AD55",
    fontWeight: "600",
  },
  levelBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
  },
  levelFill: {
    height: 6,
    backgroundColor: "#F6AD55",
    borderRadius: 3,
  },
  pointStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  pointStat: {
    alignItems: "center",
    gap: 4,
  },
  pointStatNum: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pointStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  pointStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#3182CE",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0AEC0",
  },
  tabTextActive: {
    color: "#3182CE",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  tabContent: {
    padding: 16,
    gap: 10,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EBF4FF",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: "#2C5282",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    marginTop: 4,
  },
  earnCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 3,
  },
  earnDesc: {
    fontSize: 12,
    color: "#718096",
  },
  earnPoints: {
    fontSize: 14,
    fontWeight: "800",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: "#A0AEC0",
  },
  historyPoints: {
    fontSize: 15,
    fontWeight: "800",
  },
  storeBalance: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
    marginBottom: 4,
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  rewardCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  rewardCategoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 3,
  },
  rewardPoints: {
    fontSize: 13,
    fontWeight: "700",
  },
  exchangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exchangeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
