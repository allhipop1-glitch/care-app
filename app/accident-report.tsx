import { ScrollView, Text, View, Pressable, StyleSheet, TextInput, Alert, Linking, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const INSURANCE_COMPANIES = [
  { id: "samsung", name: "삼성화재", tel: "1588-5114", color: "#1A56DB", logo: "🔵" },
  { id: "hyundai", name: "현대해상", tel: "1588-5656", color: "#E53E3E", logo: "🔴" },
  { id: "kb", name: "KB손해보험", tel: "1544-0114", color: "#F59E0B", logo: "🟡" },
  { id: "db", name: "DB손해보험", tel: "1588-0100", color: "#38A169", logo: "🟢" },
  { id: "meritz", name: "메리츠화재", tel: "1566-7711", color: "#805AD5", logo: "🟣" },
  { id: "lotte", name: "롯데손해보험", tel: "1588-3344", color: "#DD6B20", logo: "🟠" },
  { id: "hanwha", name: "한화손해보험", tel: "1566-8000", color: "#3182CE", logo: "🔷" },
  { id: "other", name: "기타 보험사", tel: "해당 보험사 연락", color: "#718096", logo: "📞" },
];

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

// 보행자 사고 전용 증거 수집 단계
const PEDESTRIAN_EVIDENCE_STEPS = [
  {
    step: 1,
    title: "119 신고 확인",
    desc: "부상자가 있다면 즉시 119에 신고하세요. 절대 이동시키지 마세요.",
    icon: "cross.fill" as const,
    color: "#E53E3E",
    tips: ["부상자 이동 금지 (2차 부상 위험)", "119 신고 후 안내에 따르기", "의식·호흡 확인 후 심폐소생술 준비"],
    urgent: true,
  },
  {
    step: 2,
    title: "부상 부위 사진 촬영",
    desc: "부상 부위와 피해자 상태를 기록하세요. 치료비 산정의 근거가 됩니다.",
    icon: "camera.fill" as const,
    color: "#805AD5",
    tips: ["부상 부위 클로즈업 촬영", "피해자 동의 하에 촬영", "혈흔·찰과상 등 외상 기록"],
    urgent: false,
  },
  {
    step: 3,
    title: "현장 사진 촬영",
    desc: "사고 현장(도로·인도·횡단보도 등)과 주변 환경을 기록하세요.",
    icon: "location.fill" as const,
    color: "#38A169",
    tips: ["횡단보도·신호등 상태 촬영", "스키드마크·충돌 흔적 촬영", "주변 CCTV 위치 확인"],
    urgent: false,
  },
  {
    step: 4,
    title: "목격자 & 경찰·보험 신고",
    desc: "목격자 연락처 확보 후 112 신고와 보험사 접수를 완료하세요.",
    icon: "shield.fill" as const,
    color: "#DD6B20",
    tips: ["목격자 이름·연락처 확보", "112 신고 (인피사고 필수)", "보험사 사고 접수"],
    urgent: false,
  },
];

// 보행자 사고 전용 전문가 카테고리
const PEDESTRIAN_EXPERT_CATEGORIES = [
  {
    id: "hospital",
    label: "병원",
    icon: "cross.fill" as const,
    color: "#E53E3E",
    desc: "교통사고 전문 치료 · 진단서 발급",
    priority: true,
    partners: [
      { name: "강남세브란스 정형외과", rating: 4.8, reviews: 521, distance: "1.5km", eta: "예약 가능", badge: "교통사고 전문" },
      { name: "선릉 나누리병원", rating: 4.6, reviews: 287, distance: "2.3km", eta: "당일 진료", badge: "" },
      { name: "강남 연세통증클리닉", rating: 4.7, reviews: 163, distance: "0.9km", eta: "즉시 방문 가능", badge: "빠른응답" },
    ],
  },
  {
    id: "lawyer",
    label: "변호사",
    icon: "shield.fill" as const,
    color: "#805AD5",
    desc: "합의금 산정 · 법률 상담 · 소송 지원",
    priority: true,
    partners: [
      { name: "교통사고 전문 법률사무소", rating: 4.9, reviews: 156, distance: "온라인", eta: "무료 상담", badge: "교통사고 전문" },
      { name: "강남 로앤파트너스", rating: 4.8, reviews: 203, distance: "온라인", eta: "당일 상담", badge: "" },
      { name: "서초 한결법률사무소", rating: 4.7, reviews: 98, distance: "온라인", eta: "무료 상담", badge: "빠른응답" },
    ],
  },
  {
    id: "adjuster",
    label: "손해사정사",
    icon: "doc.text.fill" as const,
    color: "#DD6B20",
    desc: "치료비·합의금 적정 금액 산정",
    priority: false,
    partners: [
      { name: "김민준 손해사정사", rating: 4.9, reviews: 234, distance: "온라인", eta: "무료 상담", badge: "교통사고 전문" },
      { name: "이서연 손해사정사", rating: 4.8, reviews: 187, distance: "온라인", eta: "당일 상담", badge: "" },
      { name: "박지훈 손해사정사", rating: 4.7, reviews: 142, distance: "온라인", eta: "무료 상담", badge: "빠른응답" },
    ],
  },
];

// 주차장 사고 전용 증거 수집 단계
const PARKING_EVIDENCE_STEPS = [
  {
    step: 1,
    title: "차량 파손 사진 촬영",
    desc: "긁힘·찌그러짐 부위를 클로즈업으로 촬영하세요. 수리비 산정의 핵심 근거입니다.",
    icon: "camera.fill" as const,
    color: "#3182CE",
    tips: ["파손 부위 클로즈업 촬영", "상대 차량 번호판 촬영", "내 차량 전체 촬영 (파손 범위 확인)"],
    urgent: false,
  },
  {
    step: 2,
    title: "CCTV 보존 신청",
    desc: "주차장 관리실에 즉시 CCTV 보존을 요청하세요. 시간이 지나면 덮어씌워집니다.",
    icon: "shield.fill" as const,
    color: "#E53E3E",
    tips: ["관리실에 즉시 방문 또는 전화", "사고 발생 시각 정확히 전달", "CCTV 보존 요청서 작성 (가능 시)"],
    urgent: true,
  },
  {
    step: 3,
    title: "관리실 신고 & 상대방 확인",
    desc: "관리실에 사고를 신고하고, 상대방 차량 정보를 확보하세요.",
    icon: "person.fill" as const,
    color: "#38A169",
    tips: ["관리실 사고 접수 요청", "상대방 차량 번호·연락처 확보", "뺑소니 시 CCTV 확인 요청"],
    urgent: false,
  },
  {
    step: 4,
    title: "보험 접수",
    desc: "보험사에 사고 접수를 완료하세요. 주차장 사고는 과실 비율이 중요합니다.",
    icon: "doc.text.fill" as const,
    color: "#DD6B20",
    tips: ["보험사 사고 접수 전화", "CCTV 영상 확보 후 제출", "주차장 측 과실 여부 확인"],
    urgent: false,
  },
];

// 주차장 사고 전용 전문가 카테고리
const PARKING_EXPERT_CATEGORIES = [
  {
    id: "workshop",
    label: "공업사",
    icon: "wrench.fill" as const,
    color: "#3182CE",
    desc: "긁힘·찌그러짐 수리 · 파손 견적",
    priority: true,
    partners: [
      { name: "강남 최고공업사", rating: 4.9, reviews: 312, distance: "0.8km", eta: "15분 내 연락", badge: "사고케어 인증" },
      { name: "서초 KG모터스", rating: 4.7, reviews: 198, distance: "1.2km", eta: "20분 내 연락", badge: "빠른응답" },
      { name: "역삼 현대직영", rating: 4.8, reviews: 445, distance: "2.1km", eta: "30분 내 연락", badge: "" },
    ],
  },
  {
    id: "adjuster",
    label: "손해사정사",
    icon: "doc.text.fill" as const,
    color: "#DD6B20",
    desc: "수리비·과실 비율 산정 · 보험 처리 지원",
    priority: true,
    partners: [
      { name: "김민준 손해사정사", rating: 4.9, reviews: 234, distance: "온라인", eta: "무료 상담", badge: "교통사고 전문" },
      { name: "이서연 손해사정사", rating: 4.8, reviews: 187, distance: "온라인", eta: "당일 상담", badge: "" },
      { name: "박지훈 손해사정사", rating: 4.7, reviews: 142, distance: "온라인", eta: "무료 상담", badge: "빠른응답" },
    ],
  },
  {
    id: "lawyer",
    label: "변호사",
    icon: "shield.fill" as const,
    color: "#805AD5",
    desc: "뺑소니·과실 분쟁 법률 상담",
    priority: false,
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
  const [policeReported, setPoliceReported] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  const [insuranceCalled, setInsuranceCalled] = useState(false);
  const [injuryLevel, setInjuryLevel] = useState<"severe" | "minor" | "unknown" | null>(null);
  const [ambulanceCalled, setAmbulanceCalled] = useState(false);

  // 사고 유형 파생 변수
  const isPedestrian = selectedType === "pedestrian";
  const isParking = selectedType === "parking";
  const activeEvidenceSteps = isPedestrian
    ? PEDESTRIAN_EVIDENCE_STEPS
    : isParking
    ? PARKING_EVIDENCE_STEPS
    : EVIDENCE_STEPS;
  const activeExpertCategories = isPedestrian
    ? PEDESTRIAN_EXPERT_CATEGORIES
    : isParking
    ? PARKING_EXPERT_CATEGORIES
    : EXPERT_CATEGORIES;

  // 등록된 보험사 자동 선택
  useEffect(() => {
    const loadInsurance = async () => {
      try {
        const raw = await AsyncStorage.getItem("userProfile");
        if (raw) {
          const profile = JSON.parse(raw);
          const list: string[] = profile.insurance || [];
          if (list.length > 0) {
            // 등록된 첫 번째 보험사 id로 직접 매칭
            const match = INSURANCE_COMPANIES.find(c => list.includes(c.id));
            if (match) setSelectedInsurance(match.id);
          }
        }
      } catch (e) {
        console.log("보험사 로드 오류", e);
      }
    };
    loadInsurance();
  }, []);

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
    if (stepIdx < activeEvidenceSteps.length - 1) {
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
              <Text style={styles.stepTitle}>
                {isPedestrian ? "보행자 사고 조치" : isParking ? "주차장 사고 조치" : "증거를 확보하세요"}
              </Text>
              <Text style={styles.stepDesc}>
                {isPedestrian
                  ? "보행자 사고는 신속한 응급 조치가 중요합니다. 아래 순서대로 진행하세요."
                  : isParking
                  ? "CCTV 보존이 가장 중요합니다. 아래 순서대로 빠르게 진행하세요."
                  : "각 단계를 완료하면 체크하세요. 증거 확보가 보상 금액을 결정합니다."}
              </Text>
            </View>

            {/* 보행자 사고 긴급 배너 */}
            {isPedestrian && (
              <View style={styles.pedestrianUrgentBanner}>
                <Text style={styles.pedestrianUrgentIcon}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedestrianUrgentTitle}>부상자가 있다면 절대 이동시키지 마세요</Text>
                  <Text style={styles.pedestrianUrgentDesc}>2차 부상 위험 · 119 먼저 신고 후 안내에 따르세요</Text>
                </View>
              </View>
            )}

            {/* 주차장 사고 긴급 배너 */}
            {isParking && (
              <View style={[styles.pedestrianUrgentBanner, { borderColor: "#E53E3E", backgroundColor: "#FFF5F5" }]}>
                <Text style={styles.pedestrianUrgentIcon}>📹</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pedestrianUrgentTitle, { color: "#E53E3E" }]}>CCTV는 덮어씌리기 전에 지금 즉시 보존 요청하세요</Text>
                  <Text style={[styles.pedestrianUrgentDesc, { color: "#C53030" }]}>대부분의 주차장 CCTV는 24~48시간 후 자동 덮어씌립니다</Text>
                </View>
              </View>
            )}

            {/* 부상 정도 선택 (보행자 사고 전용) */}
            {isPedestrian && !injuryLevel && (
              <View style={styles.injuryLevelBox}>
                <Text style={styles.injuryLevelTitle}>부상 정도를 선택하세요</Text>
                <View style={styles.injuryLevelRow}>
                  {([
                    { id: "severe", label: "중상", color: "#E53E3E", icon: "🚨" },
                    { id: "minor", label: "경상", color: "#DD6B20", icon: "⚠️" },
                    { id: "unknown", label: "불명", color: "#718096", icon: "❓" },
                  ] as const).map((level) => (
                    <Pressable
                      key={level.id}
                      style={({ pressed }) => [
                        styles.injuryLevelBtn,
                        { borderColor: level.color },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setInjuryLevel(level.id);
                      }}
                    >
                      <Text style={styles.injuryLevelBtnIcon}>{level.icon}</Text>
                      <Text style={[styles.injuryLevelBtnText, { color: level.color }]}>{level.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.evidenceProgress}>
              <Text style={styles.evidenceProgressText}>
                {completedEvidence.length} / {activeEvidenceSteps.length} 완료
              </Text>
              <View style={styles.evidenceProgressBar}>
                <View
                  style={[
                    styles.evidenceProgressFill,
                    { width: `${(completedEvidence.length / activeEvidenceSteps.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {activeEvidenceSteps.map((ev, idx) => {
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

                  {isActive && !isCompleted && ev.step !== 4 && (
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

                  {/* 4단계 전용 확장 UI: 경찰 신고 + 보험사 접수 */}
                  {isActive && !isCompleted && ev.step === 4 && (
                    <View style={styles.reportSection}>
                      {/* 112 신고 버튼 */}
                      <View style={styles.reportBlock}>
                        <View style={styles.reportBlockHeader}>
                          <View style={[styles.reportStepBadge, { backgroundColor: policeReported ? "#38A169" : "#E53E3E" }]}>
                            <Text style={styles.reportStepBadgeText}>{policeReported ? "✓" : "1"}</Text>
                          </View>
                          <Text style={styles.reportBlockTitle}>경찰 신고 (112)</Text>
                          {policeReported && <Text style={styles.reportDoneLabel}>신고 완료</Text>}
                        </View>
                        <Text style={styles.reportBlockDesc}>부상자가 있거나 상대방이 도주한 경우 반드시 신고하세요. 신고 접수 번호를 보험사에 전달해야 합니다.</Text>
                        <View style={styles.reportBtnRow}>
                          <Pressable
                            style={({ pressed }) => [styles.callBtn, { backgroundColor: "#E53E3E" }, pressed && { opacity: 0.85 }]}
                            onPress={() => {
                              if (Platform.OS !== "web") {
                                Linking.openURL("tel:112");
                              } else {
                                Alert.alert("112 신고", "112에 전화를 연결합니다.");
                              }
                            }}
                          >
                            <Text style={styles.callBtnIcon}>📞</Text>
                            <Text style={styles.callBtnText}>112 신고 전화</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.doneBtn,
                              policeReported && { backgroundColor: "#38A169" },
                              pressed && { opacity: 0.85 },
                            ]}
                            onPress={() => setPoliceReported(true)}
                          >
                            <Text style={[styles.doneBtnText, policeReported && { color: "#FFFFFF" }]}>
                              {policeReported ? "✓ 완료" : "신고 완료"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* 보험사 접수 */}
                      <View style={styles.reportBlock}>
                        <View style={styles.reportBlockHeader}>
                          <View style={[styles.reportStepBadge, { backgroundColor: insuranceCalled ? "#38A169" : "#DD6B20" }]}>
                            <Text style={styles.reportStepBadgeText}>{insuranceCalled ? "✓" : "2"}</Text>
                          </View>
                          <Text style={styles.reportBlockTitle}>보험사 사고 접수</Text>
                          {insuranceCalled && <Text style={styles.reportDoneLabel}>접수 완료</Text>}
                        </View>
                        <Text style={styles.reportBlockDesc}>내 보험사를 선택하고 사고 접수 전화를 하세요. 접수 즉시 출동 서비스가 시작됩니다.</Text>

                        {/* 보험사 선택 그리드 */}
                        <View style={styles.insuranceGrid}>
                          {INSURANCE_COMPANIES.map((ins) => (
                            <Pressable
                              key={ins.id}
                              style={({ pressed }) => [
                                styles.insuranceCard,
                                selectedInsurance === ins.id && { borderColor: ins.color, borderWidth: 2, backgroundColor: ins.color + "10" },
                                pressed && { opacity: 0.8 },
                              ]}
                              onPress={() => setSelectedInsurance(ins.id)}
                            >
                              <Text style={styles.insuranceLogo}>{ins.logo}</Text>
                              <Text style={[styles.insuranceName, selectedInsurance === ins.id && { color: ins.color, fontWeight: "700" }]}>
                                {ins.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>

                        {selectedInsurance && (() => {
                          const ins = INSURANCE_COMPANIES.find(i => i.id === selectedInsurance)!;
                          return (
                            <View style={styles.insuranceCallBox}>
                              <Text style={styles.insuranceCallNum}>{ins.tel}</Text>
                              <View style={styles.reportBtnRow}>
                                <Pressable
                                  style={({ pressed }) => [styles.callBtn, { backgroundColor: ins.color, flex: 1 }, pressed && { opacity: 0.85 }]}
                                  onPress={() => {
                                    if (Platform.OS !== "web") {
                                      Linking.openURL(`tel:${ins.tel.replace(/-/g, "")}`);
                                    } else {
                                      Alert.alert("보험사 접수", `${ins.name} ${ins.tel}에 연결합니다.`);
                                    }
                                  }}
                                >
                                  <Text style={styles.callBtnIcon}>📞</Text>
                                  <Text style={styles.callBtnText}>{ins.name} 접수 전화</Text>
                                </Pressable>
                                <Pressable
                                  style={({ pressed }) => [
                                    styles.doneBtn,
                                    insuranceCalled && { backgroundColor: "#38A169" },
                                    pressed && { opacity: 0.85 },
                                  ]}
                                  onPress={() => setInsuranceCalled(true)}
                                >
                                  <Text style={[styles.doneBtnText, insuranceCalled && { color: "#FFFFFF" }]}>
                                    {insuranceCalled ? "✓ 완료" : "접수 완료"}
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })()}
                      </View>

                      {/* 완료 버튼 */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.evidenceCompleteBtn,
                          { backgroundColor: (policeReported || insuranceCalled) ? "#DD6B20" : "#CBD5E0" },
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => {
                          if (!policeReported && !insuranceCalled) {
                            Alert.alert("확인", "112 신고 또는 보험사 접수 중 하나는 완료해야 합니다.");
                            return;
                          }
                          handleCompleteEvidence(idx);
                        }}
                      >
                        <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                        <Text style={styles.evidenceCompleteBtnText}>
                          {policeReported && insuranceCalled ? "신고 & 접수 완료" : policeReported ? "신고 완료 (보험 접수 권장)" : "접수 완료 (신고 권장)"}
                        </Text>
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
                {completedEvidence.length === activeEvidenceSteps.length ? "전문가 매칭 시작" : "일단 전문가 연결하기"}
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
              <Text style={styles.stepDesc}>
                {isPedestrian
                  ? "병원·변호사·손해사정사를 우선 연결하세요. 치료와 합의금 산정이 중요합니다."
                  : isParking
                  ? "공업사·손해사정사를 우선 연결하세요. 수리비와 과실 비율 산정이 중요합니다."
                  : "필요한 분야를 선택하고 원하는 전문가에게 연결하세요"}
              </Text>
            </View>

            {/* 보행자 사고 우선 안내 배너 */}
            {isPedestrian && (
              <View style={[styles.pedestrianUrgentBanner, { borderColor: "#805AD5", backgroundColor: "#FAF5FF" }]}>
                <Text style={styles.pedestrianUrgentIcon}>🏥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pedestrianUrgentTitle, { color: "#805AD5" }]}>병원 먼저 연결하세요</Text>
                  <Text style={[styles.pedestrianUrgentDesc, { color: "#553C9A" }]}>치료 후 변호사·손해사정사와 합의금을 산정하는 순서를 권장합니다</Text>
                </View>
              </View>
            )}

            {/* 주차장 사고 우선 안내 배너 */}
            {isParking && (
              <View style={[styles.pedestrianUrgentBanner, { borderColor: "#3182CE", backgroundColor: "#EBF8FF" }]}>
                <Text style={styles.pedestrianUrgentIcon}>🔧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pedestrianUrgentTitle, { color: "#3182CE" }]}>공업사 먼저 연결하세요</Text>
                  <Text style={[styles.pedestrianUrgentDesc, { color: "#2C5282" }]}>수리비 확정 후 손해사정사로 과실 비율을 산정하는 순서를 권장합니다</Text>
                </View>
              </View>
            )}

            {/* 카테고리 탭 */}
            <View style={styles.categoryTabs}>
              {activeExpertCategories.map((cat) => (
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
                  {(isPedestrian || isParking) && (cat as { priority?: boolean }).priority && (
                    <View style={[styles.pedestrianPriorityBadge, { marginLeft: 2, backgroundColor: isParking ? "#3182CE" : undefined }]}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: "#FFFFFF" }}>우선</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* 선택된 카테고리 설명 */}
            {selectedCategory && (() => {
              const cat = activeExpertCategories.find(c => c.id === selectedCategory)!;
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
                <Text style={styles.categoryEmptySubText}>
                  {isPedestrian
                    ? "병원(우선), 변호사(우선), 손해사정사 중 원하는 전문가를 직접 고를 수 있습니다"
                    : "공업사, 병원, 렌터카, 변호사 중 원하는 전문가를 직접 고를 수 있습니다"}
                </Text>
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
  reportSection: {
    marginTop: 14,
    gap: 12,
  },
  reportBlock: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  reportBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reportStepBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  reportBlockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    flex: 1,
  },
  reportDoneLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38A169",
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reportBlockDesc: {
    fontSize: 13,
    color: "#718096",
    lineHeight: 20,
  },
  reportBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  callBtnIcon: {
    fontSize: 16,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
  },
  insuranceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  insuranceCard: {
    width: "22%",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  insuranceLogo: {
    fontSize: 20,
  },
  insuranceName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4A5568",
    textAlign: "center",
  },
  insuranceCallBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
    gap: 8,
  },
  insuranceCallNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4C",
    textAlign: "center",
    letterSpacing: 1,
  },
  // 보행자 사고 전용 스타일
  pedestrianUrgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E53E3E",
    padding: 14,
    marginBottom: 16,
  },
  pedestrianUrgentIcon: {
    fontSize: 24,
  },
  pedestrianUrgentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E53E3E",
    marginBottom: 2,
  },
  pedestrianUrgentDesc: {
    fontSize: 12,
    color: "#C53030",
    lineHeight: 18,
  },
  injuryLevelBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  injuryLevelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 12,
  },
  injuryLevelRow: {
    flexDirection: "row",
    gap: 10,
  },
  injuryLevelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  injuryLevelBtnIcon: {
    fontSize: 22,
  },
  injuryLevelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pedestrianExpertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pedestrianPriorityBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "#E53E3E",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
