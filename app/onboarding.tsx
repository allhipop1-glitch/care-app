import { Text, View, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: 0,
    icon: "exclamationmark.triangle.fill" as const,
    iconColor: "#DD6B20",
    bgColor: "#FFF8F0",
    title: "사고 났을 때\n당황하지 마세요",
    desc: "교통사고 발생 즉시 SOS 버튼 하나로\n견인·병원·변호사·렌터카를 한번에 연결합니다",
    badge: "연간 120만 건 교통사고",
  },
  {
    id: 1,
    icon: "shield.fill" as const,
    iconColor: "#3182CE",
    bgColor: "#EBF8FF",
    title: "내 권리를 지키는\n정보 비대칭 해소",
    desc: "보험사가 알려주지 않는 렌트카 25일 한도,\nCT·MRI 청구 권리, 차량 가치 하락 보상까지",
    badge: "피해자 5명 중 1명 PTSD 경험",
  },
  {
    id: 2,
    icon: "flame.fill" as const,
    iconColor: "#805AD5",
    bgColor: "#FAF5FF",
    title: "안전운전하면\n포인트가 쌓여요",
    desc: "매일 앱을 켜고 안전하게 운전하면\n포인트가 적립되어 보험료 할인 혜택으로 돌아옵니다",
    badge: "무사고 운전 = 포인트 적립",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [carModel, setCarModel] = useState("");
  const [carPlate, setCarPlate] = useState("");

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowRegister(true);
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)" as never);
  };

  const handleStartApp = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)" as never);
  };

  const slide = SLIDES[currentSlide];

  if (showRegister) {
    return (
      <ScreenContainer containerClassName="bg-[#1A2B4C]">
        <View style={styles.registerContainer}>
          <View style={styles.registerHeader}>
            <Text style={styles.registerTitle}>내 차량을 등록하세요</Text>
            <Text style={styles.registerDesc}>
              차량 정보를 등록하면 맞춤 시세 정보와{"\n"}보험 갱신 알림을 받을 수 있습니다
            </Text>
          </View>

          <View style={styles.registerForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>차량 모델</Text>
              <View style={styles.formInput}>
                <IconSymbol name="car.fill" size={18} color="#3182CE" />
                <Text style={styles.formInputText}>
                  {carModel || "예: 현대 아반떼 CN7 (2022)"}
                </Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>차량 번호</Text>
              <View style={styles.formInput}>
                <IconSymbol name="doc.text.fill" size={18} color="#3182CE" />
                <Text style={styles.formInputText}>
                  {carPlate || "예: 123가 4567"}
                </Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>보험 만기일</Text>
              <View style={styles.formInput}>
                <IconSymbol name="clock.fill" size={18} color="#3182CE" />
                <Text style={styles.formInputText}>예: 2026년 10월 15일</Text>
              </View>
            </View>
          </View>

          <View style={styles.registerBtns}>
            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}
              onPress={handleStartApp}
            >
              <Text style={styles.startBtnText}>시작하기</Text>
              <IconSymbol name="arrow.right" size={18} color="#1A2B4C" />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.laterBtn, pressed && { opacity: 0.7 }]}
              onPress={handleStartApp}
            >
              <Text style={styles.laterBtnText}>나중에 등록하기</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName={`bg-[${slide.bgColor}]`} style={{ backgroundColor: slide.bgColor }}>
      {/* Skip 버튼 */}
      <View style={styles.skipRow}>
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipBtnText}>건너뛰기</Text>
        </Pressable>
      </View>

      {/* 슬라이드 콘텐츠 */}
      <View style={[styles.slideContent, { backgroundColor: slide.bgColor }]}>
        {/* 아이콘 */}
        <View style={[styles.slideIconWrap, { backgroundColor: slide.iconColor + "20" }]}>
          <View style={[styles.slideIconInner, { backgroundColor: slide.iconColor + "30" }]}>
            <IconSymbol name={slide.icon} size={56} color={slide.iconColor} />
          </View>
        </View>

        {/* 배지 */}
        <View style={[styles.slideBadge, { backgroundColor: slide.iconColor + "15" }]}>
          <Text style={[styles.slideBadgeText, { color: slide.iconColor }]}>{slide.badge}</Text>
        </View>

        {/* 텍스트 */}
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDesc}>{slide.desc}</Text>
      </View>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNav}>
        {/* 도트 인디케이터 */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentSlide && { ...styles.dotActive, backgroundColor: slide.iconColor },
              ]}
            />
          ))}
        </View>

        {/* 다음 버튼 */}
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: slide.iconColor },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {currentSlide === SLIDES.length - 1 ? "차량 등록하기" : "다음"}
          </Text>
          <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  slideIconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  slideIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  slideBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  slideBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A2B4C",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 15,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomNav: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E0",
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: "100%",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // 차량 등록 화면
  registerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  registerHeader: {
    marginTop: 20,
    gap: 10,
  },
  registerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 36,
  },
  registerDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
  },
  registerForm: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  formInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  formInputText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
  },
  registerBtns: {
    gap: 12,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6AD55",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: "#F6AD55",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  laterBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  laterBtnText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
});
