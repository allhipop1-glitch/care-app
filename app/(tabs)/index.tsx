import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const DAILY_TIPS = [
  {
    id: 1,
    title: "렌트카는 최대 25일까지만 보장됩니다",
    desc: "보험 약관상 렌트카 지원은 최대 25일. 수리 지연 시 초과분은 자비 부담입니다.",
    tag: "보험 꿀팁",
    color: "#3182CE",
  },
  {
    id: 2,
    title: "사고 후 3일 이내 입원이 핵심입니다",
    desc: "사고 직후 3일 이내 입원 기록이 없으면 이후 보험 처리가 거부될 수 있습니다.",
    tag: "의료 꿀팁",
    color: "#38A169",
  },
  {
    id: 3,
    title: "CT·MRI도 보험 처리 가능합니다",
    desc: "사고 관련 진단이라면 CT·MRI 비용도 상대방 보험사에 청구 가능합니다.",
    tag: "보험 꿀팁",
    color: "#805AD5",
  },
];

const today = new Date();
const tipIndex = today.getDate() % DAILY_TIPS.length;
const todayTip = DAILY_TIPS[tipIndex];

export default function HomeScreen() {
  const router = useRouter();

  const handleSOS = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    router.push("/(tabs)/care" as never);
  };

  const QUICK_MENUS = [
    { icon: "wrench.fill" as const, label: "공업사 찾기", color: "#3182CE" },
    { icon: "cross.fill" as const, label: "병원 찾기", color: "#E53E3E" },
    { icon: "scale.3d" as const, label: "변호사 찾기", color: "#805AD5" },
    { icon: "car.2.fill" as const, label: "렌터카 찾기", color: "#38A169" },
  ];

  return (
    <ScreenContainer containerClassName="bg-[#1A2B4C]">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>안녕하세요 👋</Text>
          <Text style={styles.headerTitle}>차케어</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {}}
        >
          <IconSymbol name="bell.fill" size={22} color="#FFFFFF" />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 위험 구간 배너 */}
        <View style={styles.dangerBanner}>
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#DD6B20" />
          <Text style={styles.dangerBannerText}>
            현재 위치 반경 2km 내 사고 다발 구간이 있습니다
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/map" as never)}>
            <Text style={styles.dangerBannerLink}>확인 →</Text>
          </Pressable>
        </View>

        {/* 내 차량 카드 */}
        <View style={styles.carCard}>
          <View style={styles.carCardTop}>
            <View>
              <Text style={styles.carCardLabel}>내 차량</Text>
              <Text style={styles.carCardName}>현대 아반떼 CN7 (2022)</Text>
              <Text style={styles.carCardPlate}>123가 4567</Text>
            </View>
            <View style={styles.carValueBox}>
              <Text style={styles.carValueLabel}>예상 시세</Text>
              <Text style={styles.carValueAmount}>1,850만원</Text>
              <Text style={styles.carValueChange}>▼ 50만원 (지난달 대비)</Text>
            </View>
          </View>
          <View style={styles.carCardDivider} />
          <View style={styles.carCardBottom}>
            <View style={styles.carStat}>
              <IconSymbol name="shield.fill" size={14} color="#3182CE" />
              <Text style={styles.carStatText}>보험 갱신 D-47</Text>
            </View>
            <View style={styles.carStat}>
              <IconSymbol name="clock.fill" size={14} color="#38A169" />
              <Text style={styles.carStatText}>사고 이력 없음</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.carCardBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/(tabs)/my" as never)}
            >
              <Text style={styles.carCardBtnText}>상세보기</Text>
            </Pressable>
          </View>
        </View>

        {/* SOS 긴급 접수 버튼 */}
        <View style={styles.sosSection}>
          <Text style={styles.sosSectionLabel}>사고가 발생했나요?</Text>
          <Pressable
            style={({ pressed }) => [
              styles.sosButton,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
            onPress={handleSOS}
          >
            <View style={styles.sosInner}>
              <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#FFFFFF" />
              <Text style={styles.sosText}>긴급 SOS 사고 접수</Text>
              <Text style={styles.sosSubText}>탭하여 즉시 접수 시작</Text>
            </View>
          </Pressable>
          <Text style={styles.sosHint}>
            위치 자동 감지 · AI 파손 분석 · 전문가 즉시 연결
          </Text>
        </View>

        {/* 오늘의 꿀팁 */}
        <View style={styles.tipSection}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipHeaderTitle}>오늘의 교통사고 꿀팁</Text>
            <Pressable onPress={() => router.push("/(tabs)/feed" as never)}>
              <Text style={styles.tipHeaderMore}>더보기 →</Text>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.tipCard, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/(tabs)/feed" as never)}
          >
            <View style={[styles.tipTag, { backgroundColor: todayTip.color }]}>
              <Text style={styles.tipTagText}>{todayTip.tag}</Text>
            </View>
            <Text style={styles.tipTitle}>{todayTip.title}</Text>
            <Text style={styles.tipDesc}>{todayTip.desc}</Text>
          </Pressable>
        </View>

        {/* 빠른 메뉴 */}
        <View style={styles.quickMenuSection}>
          <Text style={styles.quickMenuTitle}>빠른 메뉴</Text>
          <View style={styles.quickMenuGrid}>
            {QUICK_MENUS.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.quickMenuItem, pressed && { opacity: 0.7 }]}
                onPress={() => router.push("/(tabs)/map" as never)}
              >
                <View style={[styles.quickMenuIcon, { backgroundColor: item.color + "20" }]}>
                  <IconSymbol name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.quickMenuLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#1A2B4C",
  },
  headerGreeting: {
    fontSize: 13,
    color: "#90CDF4",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DD6B20",
    borderWidth: 1.5,
    borderColor: "#1A2B4C",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  dangerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    borderBottomWidth: 1,
    borderBottomColor: "#FEEBC8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  dangerBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#744210",
    fontWeight: "500",
  },
  dangerBannerLink: {
    fontSize: 12,
    color: "#DD6B20",
    fontWeight: "700",
  },
  carCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  carCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  carCardLabel: {
    fontSize: 11,
    color: "#718096",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  carCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  carCardPlate: {
    fontSize: 13,
    color: "#718096",
  },
  carValueBox: {
    alignItems: "flex-end",
  },
  carValueLabel: {
    fontSize: 11,
    color: "#718096",
    marginBottom: 2,
  },
  carValueAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  carValueChange: {
    fontSize: 11,
    color: "#E53E3E",
    marginTop: 2,
  },
  carCardDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  carCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  carStatText: {
    fontSize: 11,
    color: "#4A5568",
    fontWeight: "500",
  },
  carCardBtn: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  carCardBtnText: {
    fontSize: 12,
    color: "#3182CE",
    fontWeight: "700",
  },
  sosSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  sosSectionLabel: {
    fontSize: 13,
    color: "#718096",
    marginBottom: 10,
    fontWeight: "500",
  },
  sosButton: {
    width: "100%",
    backgroundColor: "#DD6B20",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#DD6B20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sosInner: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  sosText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  sosSubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  sosHint: {
    fontSize: 11,
    color: "#A0AEC0",
    marginTop: 8,
    textAlign: "center",
  },
  tipSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tipHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
  },
  tipHeaderMore: {
    fontSize: 13,
    color: "#3182CE",
    fontWeight: "600",
  },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  tipTagText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 6,
    lineHeight: 22,
  },
  tipDesc: {
    fontSize: 13,
    color: "#718096",
    lineHeight: 20,
  },
  quickMenuSection: {
    paddingHorizontal: 16,
  },
  quickMenuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 12,
  },
  quickMenuGrid: {
    flexDirection: "row",
    gap: 10,
  },
  quickMenuItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickMenuLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4A5568",
    textAlign: "center",
  },
});
