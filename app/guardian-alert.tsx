import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

// 시뮬레이션용 사고 데이터
const MOCK_ACCIDENT = {
  victimName: "홍길동",
  victimPhone: "010-1234-5678",
  plate: "123가 4567",
  car: "현대 아반떼 CN7",
  location: "서울시 강남구 테헤란로 123",
  time: "오후 3:42",
  date: "2026년 4월 1일",
  status: "처리 중",
  steps: [
    { id: 1, label: "사고 접수", done: true, time: "15:42" },
    { id: 2, label: "긴급출동 요청", done: true, time: "15:43" },
    { id: 3, label: "공업사 배정", done: true, time: "15:45" },
    { id: 4, label: "보험사 접수", done: false, time: null },
    { id: 5, label: "처리 완료", done: false, time: null },
  ],
  partner: {
    name: "강남 현대공업사",
    phone: "02-1234-5678",
    eta: "약 15분 후 도착",
    rating: 4.8,
  },
};

export default function GuardianAlertScreen() {
  const router = useRouter();

  const handleCall = (phone: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleGoOut = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "출발 알림 전송",
      `${MOCK_ACCIDENT.victimName}님에게 출발 알림을 보내시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "알림 보내기",
          onPress: () => {
            Alert.alert("✅ 전송 완료", `${MOCK_ACCIDENT.victimName}님에게 "지금 출발할게요" 알림이 전송되었습니다.`);
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#1A2B4C]">
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>사고 현황</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 긴급 알림 배너 */}
        <View style={styles.alertBanner}>
          <View style={styles.alertBannerLeft}>
            <View style={styles.alertPulse}>
              <View style={styles.alertPulseInner} />
            </View>
            <Text style={styles.alertBannerText}>🚨 사고 발생 알림</Text>
          </View>
          <Text style={styles.alertBannerTime}>{MOCK_ACCIDENT.date} {MOCK_ACCIDENT.time}</Text>
        </View>

        {/* 사고 당사자 정보 */}
        <View style={styles.victimCard}>
          <View style={styles.victimAvatar}>
            <IconSymbol name="person.fill" size={28} color="#3182CE" />
          </View>
          <View style={styles.victimInfo}>
            <Text style={styles.victimName}>{MOCK_ACCIDENT.victimName}</Text>
            <Text style={styles.victimDetail}>{MOCK_ACCIDENT.car} · {MOCK_ACCIDENT.plate}</Text>
            <Text style={styles.victimPhone}>{MOCK_ACCIDENT.victimPhone}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
            onPress={() => handleCall(MOCK_ACCIDENT.victimPhone)}
          >
            <IconSymbol name="phone.fill" size={18} color="#FFFFFF" />
            <Text style={styles.callBtnText}>전화</Text>
          </Pressable>
        </View>

        {/* 위치 정보 */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <IconSymbol name="location.fill" size={16} color="#E53E3E" />
            <Text style={styles.locationTitle}>사고 위치</Text>
          </View>
          <Text style={styles.locationAddress}>{MOCK_ACCIDENT.location}</Text>
          {/* 지도 시뮬레이션 */}
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.mapGridRow}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <View key={j} style={styles.mapGridCell} />
                  ))}
                </View>
              ))}
            </View>
            <View style={styles.mapRoads}>
              <View style={[styles.mapRoad, styles.mapRoadH, { top: "40%" }]} />
              <View style={[styles.mapRoad, styles.mapRoadV, { left: "35%" }]} />
            </View>
            <View style={styles.mapPin}>
              <View style={styles.mapPinDot} />
              <View style={styles.mapPinShadow} />
            </View>
            <View style={styles.mapLabel}>
              <Text style={styles.mapLabelText}>📍 사고 위치</Text>
            </View>
          </View>
        </View>

        {/* 처리 타임라인 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>처리 현황</Text>
          <View style={styles.timeline}>
            {MOCK_ACCIDENT.steps.map((step, idx) => (
              <View key={step.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      step.done && styles.timelineDotDone,
                    ]}
                  >
                    {step.done && (
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#38A169" />
                    )}
                  </View>
                  {idx < MOCK_ACCIDENT.steps.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        step.done && styles.timelineLineDone,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      !step.done && styles.timelineLabelPending,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.time && (
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 배정된 파트너 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배정된 파트너</Text>
          <View style={styles.partnerCard}>
            <View style={styles.partnerIcon}>
              <IconSymbol name="wrench.fill" size={20} color="#3182CE" />
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{MOCK_ACCIDENT.partner.name}</Text>
              <View style={styles.partnerRatingRow}>
                <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                <Text style={styles.partnerRating}>{MOCK_ACCIDENT.partner.rating}</Text>
                <Text style={styles.partnerEta}> · {MOCK_ACCIDENT.partner.eta}</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.partnerCallBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleCall(MOCK_ACCIDENT.partner.phone)}
            >
              <IconSymbol name="phone.fill" size={16} color="#3182CE" />
            </Pressable>
          </View>
        </View>

        {/* 가디언 액션 버튼 */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.goOutBtn,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
            onPress={handleGoOut}
          >
            <IconSymbol name="location.fill" size={22} color="#FFFFFF" />
            <View>
              <Text style={styles.goOutBtnTitle}>지금 출발할게요</Text>
              <Text style={styles.goOutBtnSub}>{MOCK_ACCIDENT.victimName}님에게 알림이 전송됩니다</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.callVictimBtn, pressed && { opacity: 0.8 }]}
            onPress={() => handleCall(MOCK_ACCIDENT.victimPhone)}
          >
            <IconSymbol name="phone.fill" size={18} color="#3182CE" />
            <Text style={styles.callVictimBtnText}>{MOCK_ACCIDENT.victimName}님에게 전화하기</Text>
          </Pressable>
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
    paddingBottom: 16,
    backgroundColor: "#1A2B4C",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  alertBanner: {
    backgroundColor: "#FFF5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7D7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FED7D7",
    alignItems: "center",
    justifyContent: "center",
  },
  alertPulseInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E53E3E",
  },
  alertBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C53030",
  },
  alertBannerTime: {
    fontSize: 12,
    color: "#FC8181",
  },
  victimCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  victimAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  victimInfo: {
    flex: 1,
    gap: 3,
  },
  victimName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  victimDetail: {
    fontSize: 13,
    color: "#718096",
  },
  victimPhone: {
    fontSize: 13,
    color: "#4A5568",
    fontWeight: "500",
  },
  callBtn: {
    backgroundColor: "#38A169",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  locationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 12,
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: 12,
    backgroundColor: "#E8F4E8",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mapGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapGridRow: {
    flexDirection: "row",
    flex: 1,
  },
  mapGridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
    backgroundColor: "#EDF7ED",
  },
  mapRoads: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapRoad: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  mapRoadH: {
    left: 0,
    right: 0,
    height: 8,
  },
  mapRoadV: {
    top: 0,
    bottom: 0,
    width: 8,
  },
  mapPin: {
    alignItems: "center",
  },
  mapPinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53E3E",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  mapPinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 2,
  },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A2B4C",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 12,
  },
  timeline: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: "#68D391",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 1,
    paddingBottom: 12,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
  },
  timelineLabelPending: {
    color: "#A0AEC0",
    fontWeight: "500",
  },
  timelineTime: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  partnerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  partnerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerInfo: {
    flex: 1,
    gap: 4,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
  },
  partnerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  partnerRating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
  },
  partnerEta: {
    fontSize: 13,
    color: "#718096",
  },
  partnerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  goOutBtn: {
    backgroundColor: "#3182CE",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
    shadowColor: "#3182CE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  goOutBtnTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  goOutBtnSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  callVictimBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#BEE3F8",
  },
  callVictimBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3182CE",
  },
});
