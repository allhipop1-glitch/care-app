import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

type AccidentStep = {
  id: string;
  label: string;
  status: "done" | "active" | "pending";
  date?: string;
  detail?: string;
};

const ACCIDENT_STEPS: AccidentStep[] = [
  { id: "1", label: "사고 접수 완료", status: "done", date: "2026.03.10", detail: "강남구 테헤란로 인근 추돌사고" },
  { id: "2", label: "견인 완료", status: "done", date: "2026.03.10", detail: "강남 최고공업사 입고" },
  { id: "3", label: "차량 수리 중", status: "active", date: "2026.03.11 ~", detail: "예상 완료: 2026.03.20 (D-2)" },
  { id: "4", label: "렌터카 이용 중", status: "active", date: "2026.03.11 ~", detail: "이용 기간: 10일 / 최대 25일 (D-15 남음)" },
  { id: "5", label: "병원 치료", status: "pending", detail: "목·허리 통증 진단 예정" },
  { id: "6", label: "보험 합의", status: "pending", detail: "수리 완료 후 진행 예정" },
];

const PARTNERS = [
  { id: "1", category: "공업사", name: "강남 최고공업사", rating: 4.9, distance: "0.3km", phone: "02-1234-5678", tag: "현재 수리 중" },
  { id: "2", category: "렌터카", name: "SK렌터카 강남점", rating: 4.7, distance: "0.5km", phone: "1588-0000", tag: "이용 중" },
  { id: "3", category: "병원", name: "강남세브란스 정형외과", rating: 4.8, distance: "1.2km", phone: "02-2019-3114", tag: "예약 권장" },
  { id: "4", category: "변호사", name: "교통사고 전문 법률사무소", rating: 4.6, distance: "0.8km", phone: "02-555-7777", tag: "상담 가능" },
];

const CATEGORY_COLORS: Record<string, string> = {
  공업사: "#3182CE",
  렌터카: "#38A169",
  병원: "#E53E3E",
  변호사: "#805AD5",
};

export default function CareScreen() {
  const [hasAccident] = useState(true);

  const handleCall = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>사고 처리</Text>
        {hasAccident && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>처리 중</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {hasAccident ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>진행 중인 사고 타임라인</Text>
              <Text style={styles.sectionSub}>2026년 3월 10일 접수 · 강남구 테헤란로</Text>

              <View style={styles.timeline}>
                {ACCIDENT_STEPS.map((step, idx) => (
                  <View key={step.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        step.status === "done" && styles.timelineDotDone,
                        step.status === "active" && styles.timelineDotActive,
                      ]}>
                        {step.status === "done" && (
                          <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                        )}
                        {step.status === "active" && (
                          <View style={styles.timelineActivePulse} />
                        )}
                      </View>
                      {idx < ACCIDENT_STEPS.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          step.status === "done" && styles.timelineLineDone,
                        ]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineRow}>
                        <Text style={[
                          styles.timelineLabel,
                          step.status === "pending" && styles.timelineLabelPending,
                        ]}>{step.label}</Text>
                        {step.status === "active" && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>진행 중</Text>
                          </View>
                        )}
                      </View>
                      {step.date && <Text style={styles.timelineDate}>{step.date}</Text>}
                      {step.detail && <Text style={styles.timelineDetail}>{step.detail}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>연결된 파트너</Text>
              {PARTNERS.map((partner) => (
                <View key={partner.id} style={styles.partnerCard}>
                  <View style={[styles.partnerCategoryBadge, { backgroundColor: CATEGORY_COLORS[partner.category] + "20" }]}>
                    <Text style={[styles.partnerCategoryText, { color: CATEGORY_COLORS[partner.category] }]}>
                      {partner.category}
                    </Text>
                  </View>
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    <View style={styles.partnerMeta}>
                      <IconSymbol name="star.fill" size={12} color="#F6AD55" />
                      <Text style={styles.partnerMetaText}>{partner.rating}</Text>
                      <Text style={styles.partnerMetaDot}>·</Text>
                      <Text style={styles.partnerMetaText}>{partner.distance}</Text>
                    </View>
                  </View>
                  <View style={styles.partnerRight}>
                    <View style={[styles.partnerTag, { backgroundColor: CATEGORY_COLORS[partner.category] + "15" }]}>
                      <Text style={[styles.partnerTagText, { color: CATEGORY_COLORS[partner.category] }]}>
                        {partner.tag}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.7 }]}
                      onPress={handleCall}
                    >
                      <IconSymbol name="phone.fill" size={14} color="#3182CE" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.noAccidentSection}>
            <View style={styles.noAccidentIcon}>
              <IconSymbol name="shield.fill" size={48} color="#3182CE" />
            </View>
            <Text style={styles.noAccidentTitle}>현재 진행 중인 사고가 없습니다</Text>
            <Text style={styles.noAccidentDesc}>
              사고 발생 시 홈 화면의 SOS 버튼을 눌러 즉시 접수하세요
            </Text>
            <Pressable style={({ pressed }) => [styles.aiTestBtn, pressed && { opacity: 0.8 }]}>
              <IconSymbol name="camera.fill" size={18} color="#FFFFFF" />
              <Text style={styles.aiTestBtnText}>AI 파손 분석 미리 체험하기</Text>
            </Pressable>
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
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEB2B2",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E53E3E",
  },
  activeBadgeText: {
    fontSize: 12,
    color: "#E53E3E",
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  section: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 16,
  },
  timeline: {},
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: "center",
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  timelineDotDone: {
    backgroundColor: "#38A169",
  },
  timelineDotActive: {
    backgroundColor: "#3182CE",
    borderWidth: 2,
    borderColor: "#BEE3F8",
  },
  timelineActivePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginTop: 2,
    marginBottom: 2,
  },
  timelineLineDone: {
    backgroundColor: "#38A169",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4C",
  },
  timelineLabelPending: {
    color: "#A0AEC0",
  },
  activeTag: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 10,
    color: "#3182CE",
    fontWeight: "700",
  },
  timelineDate: {
    fontSize: 11,
    color: "#718096",
    marginTop: 2,
  },
  timelineDetail: {
    fontSize: 12,
    color: "#4A5568",
    marginTop: 3,
    lineHeight: 18,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
    gap: 10,
  },
  partnerCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 44,
    alignItems: "center",
  },
  partnerCategoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 3,
  },
  partnerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  partnerMetaText: {
    fontSize: 12,
    color: "#718096",
  },
  partnerMetaDot: {
    fontSize: 12,
    color: "#CBD5E0",
  },
  partnerRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  partnerTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  partnerTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  noAccidentSection: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  noAccidentIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  noAccidentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 8,
    textAlign: "center",
  },
  noAccidentDesc: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  aiTestBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3182CE",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  aiTestBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
