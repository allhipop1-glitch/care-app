import { ScrollView, Text, View, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Step = "type" | "location" | "evidence" | "match";

const EXPERT_CATEGORIES = [
  {
    id: "workshop",
    label: "공업사",
    icon: "wrench.fill" as const,
    color: "#3182CE",
    desc: "차량 수리 · 파손 견적",
    partners: [
      { name: "강남 최고공업사", rating: 4.9, reviews: 312, distance: "0.8km", eta: "15분 내 연락", badge: "사고케어 인증" },
      { name: "서초 KG모터스", rating: 4.7, reviews: 198, distance: "1.2km", eta: "20분 내 연락", badge: "빠른응답" },
      { name: "역삼 현대직영", rating: 4.8, reviews: 445, distance: "2.1km", eta: "30분 내 연락", badge: "" },
    ],
  },
  {
    id: "hospital",
    label: "병원",
    icon: "cross.fill" as const,
    color: "#E53E3E",
    desc: "부상 치료 · 진단서 발급",
    partners: [
      { name: "강남세브란스 정형외과", rating: 4.8, reviews: 521, distance: "1.5km", eta: "예약 가능", badge: "교통사고 전문" },
      { name: "선릉 나누리병원", rating: 4.6, reviews: 287, distance: "2.3km", eta: "당일 진료", badge: "" },
      { name: "강남 연세통증클리닉", rating: 4.7, reviews: 163, distance: "0.9km", eta: "즉시 방문 가능", badge: "빠른응답" },
    ],
  },
  {
    id: "rental",
    label: "렌터카",
    icon: "car.fill" as const,
    color: "#38A169",
    desc: "대차 · 임시 차량 제공",
    partners: [
      { name: "SK렌터카 강남점", rating: 4.7, reviews: 389, distance: "1.0km", eta: "30분 내 배차", badge: "사고케어 인증" },
      { name: "롯데렌터카 역삼점", rating: 4.5, reviews: 241, distance: "1.8km", eta: "1시간 내 배차", badge: "" },
      { name: "그린카 강남센터", rating: 4.6, reviews: 178, distance: "2.5km", eta: "즉시 배차", badge: "빠른응답" },
    ],
  },
  {
    id: "lawyer",
    label: "변호사",
    icon: "shield.fill" as const,
    color: "#805AD5",
    desc: "법률 상담 · 합의 지원",
    partners: [
      { name: "교통사고 전문 법률사무소", rating: 4.9, reviews: 156, distance: "온라인", eta: "무료 상담", badge: "교통사고 전문" },
      { name: "강남 로앤파트너스", rating: 4.8, reviews: 203, distance: "온라인", eta: "당일 상담", badge: "" },
      { name: "서초 한결법률사무소", rating: 4.7, reviews: 98, distance: "온라인", eta: "무료 상담", badge: "빠른응답" },
    ],
  },
];

const ACCIDENT_TYPES = [
  { id: "rear", label: "추돌 사고", icon: "car.fill" as const, color: "#E53E3E" },
  { id: "side", label: "측면 충돌", icon: "car.2.fill" as const, color: "#DD6B20" },
  { id: "pedestrian", label: "보행자 사고", icon: "person.fill" as const, color: "#805AD5" },
  { id: "parking", label: "주차장 사고", icon: "wrench.fill" as const, color: "#3182CE" },
  { id: "single", label: "단독 사고", icon: "exclamationmark.triangle.fill" as const, color: "#38A169" },
  { id: "other", label: "기타", icon: "info.circle.fill" as const, color: "#718096" },
];

const EVIDENCE_STEPS = [
  {
    step: 1,
    title: "현장 사진 촬영",
    desc: "차량 전체, 충돌 부위, 번호판을 다각도로 촬영하세요.",
    icon: "camera.fill" as const,
    color: "#3182CE",
    tips: ["차량 4면 전체 촬영", "충돌 부위 클로즈업", "상대방 번호판 필수"],
  },
  {
    step: 2,
    title: "현장 위치 기록",
    desc: "GPS 위치와 도로 상황(신호등, 차선 등)을 기록하세요.",
    icon: "location.fill" as const,
    color: "#38A169",
    tips: ["GPS 위치 자동 저장됨", "주변 CCTV 위치 확인", "도로 표지판 촬영"],
  },
  {
    step: 3,
    title: "목격자 정보 확보",
    desc: "가능하다면 목격자 연락처를 받아두세요.",
    icon: "person.fill" as const,
    color: "#805AD5",
    tips: ["목격자 이름·연락처", "블랙박스 영상 요청", "CCTV 보존 신청"],
  },
  {
    step: 4,
    title: "경찰 신고 & 보험 접수",
    desc: "112 신고 후 보험사에 사고 접수를 완료하세요.",
    icon: "shield.fill" as const,
    color: "#DD6B20",
    tips: ["112 신고 (부상 시 필수)", "보험사 사고 접수 전화", "사고 사실 확인서 요청"],
  },
];

export default function AccidentReportScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [location, setLocation] = useState("위치 자동 감지 중...");
  const [evidenceStep, setEvidenceStep] = useState(0);
  const [completedEvidence, setCompletedEvidence] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

  const handleBack = () => {
    if (currentStep === "type") {
      router.back();
    } else if (currentStep === "location") {
      setCurrentStep("type");
    } else if (currentStep === "evidence") {
      setCurrentStep("location");
    } else {
      setCurrentStep("evidence");
    }
  };

  const handleSelectType = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(id);
  };

  const handleNextFromType = () => {
    if (!selectedType) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocation("서울특별시 강남구 테헤란로 152");
    setCurrentStep("location");
  };

  const handleNextFromLocation = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep("evidence");
  };

  const handleCompleteEvidence = (stepIdx: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!completedEvidence.includes(stepIdx)) {
      setCompletedEvidence([...completedEvidence, stepIdx]);
    }
    if (stepIdx < EVIDENCE_STEPS.length - 1) {
      setEvidenceStep(stepIdx + 1);
    }
  };

  const handleFinish = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCurrentStep("match");
  };

  const handleGoToCare = () => {
    router.replace("/(tabs)/care" as never);
  };

  const stepNumber = currentStep === "type" ? 1 : currentStep === "location" ? 2 : currentStep === "evidence" ? 3 : 4;

  return (
    <ScreenContainer containerClassName="bg-[#1A2B4C]">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={handleBack}
        >
          <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>사고 접수</Text>
          <Text style={styles.headerStep}>{stepNumber} / 4</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(stepNumber / 4) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* STEP 1: 사고 유형 선택 */}
        {currentStep === "type" && (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>어떤 사고가 발생했나요?</Text>
              <Text style={styles.stepDesc}>사고 유형을 선택하면 맞춤 가이드를 제공합니다</Text>
            </View>
            <View style={styles.typeGrid}>
              {ACCIDENT_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={({ pressed }) => [
                    styles.typeCard,
                    selectedType === type.id && { borderColor: type.color, borderWidth: 2, backgroundColor: type.color + "10" },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleSelectType(type.id)}
                >
                  <View style={[styles.typeIconBox, { backgroundColor: type.color + "20" }]}>
                    <IconSymbol name={type.icon} size={28} color={type.color} />
                  </View>
                  <Text style={[styles.typeLabel, selectedType === type.id && { color: type.color }]}>
                    {type.label}
                  </Text>
                  {selectedType === type.id && (
                    <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                      <IconSymbol name="checkmark.circle.fill" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                !selectedType && styles.nextBtnDisabled,
                pressed && selectedType && { opacity: 0.85 },
              ]}
              onPress={handleNextFromType}
            >
              <Text style={styles.nextBtnText}>다음 단계</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* STEP 2: 위치 확인 */}
        {currentStep === "location" && (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>사고 위치를 확인해주세요</Text>
              <Text style={styles.stepDesc}>GPS로 자동 감지된 위치입니다. 수정이 필요하면 직접 입력하세요.</Text>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationMapPlaceholder}>
                <IconSymbol name="map.fill" size={40} color="#3182CE" />
                <Text style={styles.locationMapText}>현재 위치</Text>
              </View>
              <View style={styles.locationInfo}>
                <View style={styles.locationRow}>
                  <IconSymbol name="location.fill" size={16} color="#3182CE" />
                  <Text style={styles.locationAddress}>{location}</Text>
                </View>
                <TextInput
                  style={styles.locationInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="주소를 직접 입력하세요"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <IconSymbol name="info.circle.fill" size={16} color="#3182CE" />
              <Text style={styles.infoBoxText}>
                정확한 위치 기록은 보험 처리 시 중요한 증거가 됩니다
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
              onPress={handleNextFromLocation}
            >
              <Text style={styles.nextBtnText}>위치 확인 완료</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* STEP 3: 증거 확보 가이드 */}
        {currentStep === "evidence" && (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>증거를 확보하세요</Text>
              <Text style={styles.stepDesc}>
                각 단계를 완료하면 체크하세요. 증거 확보가 보상 금액을 결정합니다.
              </Text>
            </View>

            <View style={styles.evidenceProgress}>
              <Text style={styles.evidenceProgressText}>
                {completedEvidence.length} / {EVIDENCE_STEPS.length} 완료
              </Text>
              <View style={styles.evidenceProgressBar}>
                <View
                  style={[
                    styles.evidenceProgressFill,
                    { width: `${(completedEvidence.length / EVIDENCE_STEPS.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {EVIDENCE_STEPS.map((ev, idx) => {
              const isCompleted = completedEvidence.includes(idx);
              const isActive = evidenceStep === idx;
              return (
                <View
                  key={ev.step}
                  style={[
                    styles.evidenceCard,
                    isActive && { borderColor: ev.color, borderWidth: 1.5 },
                    isCompleted && styles.evidenceCardDone,
                  ]}
                >
                  <View style={styles.evidenceCardTop}>
                    <View style={[styles.evidenceIconBox, { backgroundColor: isCompleted ? "#38A169" + "20" : ev.color + "15" }]}>
                      <IconSymbol
                        name={isCompleted ? "checkmark.circle.fill" : ev.icon}
                        size={24}
                        color={isCompleted ? "#38A169" : ev.color}
                      />
                    </View>
                    <View style={styles.evidenceCardInfo}>
                      <Text style={[styles.evidenceCardTitle, isCompleted && { color: "#38A169" }]}>
                        {ev.step}. {ev.title}
                      </Text>
                      <Text style={styles.evidenceCardDesc}>{ev.desc}</Text>
                    </View>
                    {isCompleted && (
                      <View style={styles.evidenceDoneTag}>
                        <Text style={styles.evidenceDoneTagText}>완료</Text>
                      </View>
                    )}
                  </View>

                  {isActive && !isCompleted && (
                    <View style={styles.evidenceTips}>
                      {ev.tips.map((tip, i) => (
                        <View key={i} style={styles.evidenceTipRow}>
                          <View style={[styles.evidenceTipDot, { backgroundColor: ev.color }]} />
                          <Text style={styles.evidenceTipText}>{tip}</Text>
                        </View>
                      ))}
                      <Pressable
                        style={({ pressed }) => [
                          styles.evidenceCompleteBtn,
                          { backgroundColor: ev.color },
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => handleCompleteEvidence(idx)}
                      >
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                        <Text style={styles.evidenceCompleteBtnText}>완료 체크</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
              onPress={handleFinish}
            >
              <Text style={styles.nextBtnText}>
                {completedEvidence.length === EVIDENCE_STEPS.length ? "전문가 매칭 시작" : "일단 전문가 연결하기"}
              </Text>
              <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* STEP 4: 전문가 직접 선택 */}
        {currentStep === "match" && (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>전문가를 직접 선택하세요</Text>
              <Text style={styles.stepDesc}>필요한 분야를 선택하고 원하는 전문가에게 연결하세요</Text>
            </View>

            {/* 카테고리 탭 */}
            <View style={styles.categoryTabs}>
              {EXPERT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.categoryTab,
                    selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => { setSelectedCategory(cat.id); setSelectedPartner(null); }}
                >
                  <IconSymbol name={cat.icon} size={16} color={selectedCategory === cat.id ? "#FFFFFF" : cat.color} />
                  <Text style={[styles.categoryTabText, selectedCategory === cat.id && { color: "#FFFFFF" }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 선택된 카테고리 설명 */}
            {selectedCategory && (() => {
              const cat = EXPERT_CATEGORIES.find(c => c.id === selectedCategory)!;
              return (
                <View>
                  <Text style={[styles.categoryDesc, { color: cat.color }]}>{cat.desc}</Text>
                  {cat.partners.map((p) => (
                    <Pressable
                      key={p.name}
                      style={({ pressed }) => [
                        styles.partnerCard,
                        selectedPartner === p.name && { borderColor: cat.color, borderWidth: 2 },
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => setSelectedPartner(p.name)}
                    >
                      <View style={styles.partnerCardTop}>
                        <View style={styles.partnerCardLeft}>
                          <Text style={styles.partnerName}>{p.name}</Text>
                          <View style={styles.partnerMeta}>
                            <Text style={styles.partnerRating}>★ {p.rating}</Text>
                            <Text style={styles.partnerReviews}>후기 {p.reviews}개</Text>
                            <Text style={styles.partnerDistance}>{p.distance}</Text>
                          </View>
                          {p.badge ? (
                            <View style={[styles.partnerBadge, { backgroundColor: cat.color + "15" }]}>
                              <Text style={[styles.partnerBadgeText, { color: cat.color }]}>{p.badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.partnerCardRight}>
                          <Text style={[styles.partnerEta, { color: cat.color }]}>{p.eta}</Text>
                          {selectedPartner === p.name && (
                            <View style={[styles.partnerCheck, { backgroundColor: cat.color }]}>
                              <IconSymbol name="checkmark.circle.fill" size={18} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              );
            })()}

            {!selectedCategory && (
              <View style={styles.categoryEmptyBox}>
                <IconSymbol name="person.fill" size={36} color="#CBD5E0" />
                <Text style={styles.categoryEmptyText}>위에서 필요한 분야를 선택하세요</Text>
                <Text style={styles.categoryEmptySubText}>공업사, 병원, 렌터카, 변호사 중 원하는 전문가를 직접 고를 수 있습니다</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                { marginTop: 24 },
                !selectedPartner && styles.nextBtnDisabled,
                pressed && selectedPartner && { opacity: 0.85 },
              ]}
              onPress={() => {
                if (!selectedPartner) return;
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  "연결 요청 완료",
                  `${selectedPartner}에 연결 요청을 보냈습니다.\n잠시 후 담당자가 연락드립니다.`,
                  [{ text: "확인", onPress: handleGoToCare }]
                );
              }}
            >
              <Text style={styles.nextBtnText}>
                {selectedPartner ? `${selectedPartner} 연결 요청` : "전문가를 선택하세요"}
              </Text>
              {selectedPartner && <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
              onPress={handleGoToCare}
            >
              <Text style={styles.skipBtnText}>나중에 연결하기</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#1A2B4C",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerStep: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#DD6B20",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepHeader: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4C",
    marginBottom: 6,
    lineHeight: 30,
  },
  stepDesc: {
    fontSize: 14,
    color: "#718096",
    lineHeight: 22,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  typeCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
  },
  typeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
    padding: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A2B4C",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: "#1A2B4C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnDisabled: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  locationMapPlaceholder: {
    height: 140,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locationMapText: {
    fontSize: 13,
    color: "#3182CE",
    fontWeight: "600",
  },
  locationInfo: {
    padding: 16,
    gap: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2B4C",
    flex: 1,
  },
  locationInput: {
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1A2B4C",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EBF4FF",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: "#2C5282",
    lineHeight: 20,
  },
  evidenceProgress: {
    marginBottom: 16,
    gap: 8,
  },
  evidenceProgressText: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  evidenceProgressBar: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  evidenceProgressFill: {
    height: 6,
    backgroundColor: "#38A169",
    borderRadius: 3,
  },
  evidenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  evidenceCardDone: {
    backgroundColor: "#F0FFF4",
    borderColor: "#C6F6D5",
  },
  evidenceCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  evidenceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  evidenceCardInfo: {
    flex: 1,
  },
  evidenceCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 4,
  },
  evidenceCardDesc: {
    fontSize: 13,
    color: "#718096",
    lineHeight: 20,
  },
  evidenceDoneTag: {
    backgroundColor: "#C6F6D5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  evidenceDoneTagText: {
    fontSize: 11,
    color: "#276749",
    fontWeight: "700",
  },
  evidenceTips: {
    marginTop: 14,
    gap: 6,
  },
  evidenceTipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  evidenceTipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  evidenceTipText: {
    fontSize: 13,
    color: "#4A5568",
    lineHeight: 20,
  },
  evidenceCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  evidenceCompleteBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  matchSection: {
    alignItems: "center",
    paddingTop: 20,
  },
  matchSuccessIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FFF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A2B4C",
    marginBottom: 8,
  },
  matchDesc: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  matchCards: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
    gap: 12,
  },
  matchCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 44,
    alignItems: "center",
  },
  matchCardBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  matchCardInfo: {
    flex: 1,
  },
  matchCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  matchCardEta: {
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
  },
  categoryDesc: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 2,
  },
  partnerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  partnerCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerCardLeft: {
    flex: 1,
    gap: 4,
  },
  partnerCardRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
  },
  partnerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  partnerRating: {
    fontSize: 13,
    color: "#DD6B20",
    fontWeight: "600",
  },
  partnerReviews: {
    fontSize: 12,
    color: "#718096",
  },
  partnerDistance: {
    fontSize: 12,
    color: "#718096",
  },
  partnerBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  partnerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  partnerEta: {
    fontSize: 12,
    fontWeight: "700",
  },
  partnerCheck: {
    borderRadius: 12,
    padding: 1,
  },
  categoryEmptyBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  categoryEmptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A5568",
  },
  categoryEmptySubText: {
    fontSize: 13,
    color: "#A0AEC0",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "600",
  },
});
