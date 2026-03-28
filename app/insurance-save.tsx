import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const CURRENT_PREMIUM = 520000;
const ESTIMATED_SAVE = 78000;
const RENEWAL_DAYS = 47;

const TIPS = [
  {
    id: "1",
    title: "블랙박스 장착 할인",
    desc: "블랙박스 장착 시 대부분 보험사에서 3~7% 할인 적용",
    saving: "연 15,600원",
    color: "#3182CE",
    icon: "camera.fill" as const,
    action: "할인 신청하기",
  },
  {
    id: "2",
    title: "마일리지 특약 가입",
    desc: "연간 주행거리 1만km 이하 시 최대 30% 할인",
    saving: "연 156,000원",
    color: "#38A169",
    icon: "car.fill" as const,
    action: "마일리지 확인",
  },
  {
    id: "3",
    title: "안전운전 점수 할인",
    desc: "사고케어 안전운전 점수 85점 이상 시 5% 추가 할인",
    saving: "연 26,000원",
    color: "#805AD5",
    icon: "shield.fill" as const,
    action: "점수 확인",
  },
  {
    id: "4",
    title: "다이렉트 보험 비교",
    desc: "현재 보험료보다 저렴한 다이렉트 상품이 있습니다",
    saving: "연 78,000원",
    color: "#DD6B20",
    icon: "magnifyingglass" as const,
    action: "비교 견적 받기",
  },
];

const ALERTS = [
  {
    id: "1",
    type: "urgent",
    title: "보험 갱신 D-47",
    desc: "갱신 전 비교 견적을 받으면 평균 15% 절약 가능합니다",
    color: "#E53E3E",
    icon: "bell.fill" as const,
  },
  {
    id: "2",
    type: "info",
    title: "마일리지 특약 신청 기간",
    desc: "이번 달 신청 시 다음 갱신부터 적용됩니다",
    color: "#3182CE",
    icon: "info.circle.fill" as const,
  },
  {
    id: "3",
    type: "success",
    title: "안전운전 할인 조건 달성",
    desc: "무사고 127일로 5% 할인 조건을 충족했습니다",
    color: "#38A169",
    icon: "checkmark.circle.fill" as const,
  },
];

export default function InsuranceSaveScreen() {
  const router = useRouter();
  const [expandedTip, setExpandedTip] = useState<string | null>("1");

  const handleToggle = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedTip(expandedTip === id ? null : id);
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
        <Text style={styles.headerTitle}>보험료 절약 알리미</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 절약 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>현재 연간 보험료</Text>
              <Text style={styles.summaryAmount}>{CURRENT_PREMIUM.toLocaleString()}원</Text>
            </View>
            <View style={styles.renewalBadge}>
              <IconSymbol name="clock.fill" size={14} color="#E53E3E" />
              <Text style={styles.renewalBadgeText}>갱신 D-{RENEWAL_DAYS}</Text>
            </View>
          </View>

          <View style={styles.savingBox}>
            <View style={styles.savingLeft}>
              <Text style={styles.savingLabel}>절약 가능 금액</Text>
              <Text style={styles.savingAmount}>연 {ESTIMATED_SAVE.toLocaleString()}원</Text>
            </View>
            <View style={styles.savingRight}>
              <Text style={styles.savingPct}>-{Math.round((ESTIMATED_SAVE / CURRENT_PREMIUM) * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* 알림 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지금 확인이 필요한 알림</Text>
          {ALERTS.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, { borderLeftColor: alert.color, borderLeftWidth: 3 }]}>
              <View style={[styles.alertIcon, { backgroundColor: alert.color + "15" }]}>
                <IconSymbol name={alert.icon} size={18} color={alert.color} />
              </View>
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 절약 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>절약 방법 {TIPS.length}가지</Text>
          {TIPS.map((tip) => (
            <Pressable
              key={tip.id}
              style={({ pressed }) => [styles.tipCard, pressed && { opacity: 0.9 }]}
              onPress={() => handleToggle(tip.id)}
            >
              <View style={styles.tipTop}>
                <View style={[styles.tipIcon, { backgroundColor: tip.color + "15" }]}>
                  <IconSymbol name={tip.icon} size={20} color={tip.color} />
                </View>
                <View style={styles.tipInfo}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={[styles.tipSaving, { color: tip.color }]}>절약 {tip.saving}</Text>
                </View>
                <IconSymbol
                  name={expandedTip === tip.id ? "xmark.circle.fill" : "chevron.right"}
                  size={18}
                  color="#A0AEC0"
                />
              </View>

              {expandedTip === tip.id && (
                <View style={styles.tipExpanded}>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.tipActionBtn,
                      { backgroundColor: tip.color },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.tipActionBtnText}>{tip.action}</Text>
                    <IconSymbol name="arrow.right" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* 비교 견적 CTA */}
        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          >
            <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
            <Text style={styles.ctaBtnText}>지금 비교 견적 받기</Text>
          </Pressable>
          <Text style={styles.ctaHint}>평균 15분 내 최저가 보험 확인</Text>
        </View>
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
  scroll: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  summaryCard: {
    backgroundColor: "#1A2B4C",
    padding: 20,
    gap: 16,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  renewalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  renewalBadgeText: {
    fontSize: 12,
    color: "#E53E3E",
    fontWeight: "700",
  },
  savingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    justifyContent: "space-between",
  },
  savingLeft: {},
  savingLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  savingAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F6AD55",
  },
  savingRight: {
    backgroundColor: "#F6AD55",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  savingPct: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A2B4C",
  },
  section: {
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 4,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 3,
  },
  alertDesc: {
    fontSize: 12,
    color: "#718096",
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tipTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 3,
  },
  tipSaving: {
    fontSize: 13,
    fontWeight: "700",
  },
  tipExpanded: {
    marginTop: 14,
    gap: 12,
  },
  tipDesc: {
    fontSize: 13,
    color: "#4A5568",
    lineHeight: 20,
  },
  tipActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  tipActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ctaSection: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
    gap: 8,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3182CE",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: "100%",
    shadowColor: "#3182CE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ctaHint: {
    fontSize: 12,
    color: "#A0AEC0",
  },
});
