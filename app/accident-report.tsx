import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  Linking,
  Modal,
} from "react-native";
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

type Step = "call" | "type" | "location" | "evidence" | "match";

// ─── 파트너 상세 데이터 ────────────────────────────────────────────────────────
interface PartnerDetail {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  address: string;
  phone: string;
  open: boolean;
  tags: string[];
  description: string;
}

interface PartnerReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  tags: string[];
  helpful: number;
}

const PARTNER_DETAILS: Record<string, PartnerDetail> = {
  "강남 최고공업사": { id: "p1", name: "강남 최고공업사", category: "공업사", rating: 4.9, reviews: 312, distance: "0.8km", address: "서울 강남구 테헤란로 123", phone: "02-1234-5678", open: true, tags: ["수입차 전문", "24시간", "사고케어 인증"], description: "수입차·국산차 전 차종 수리 전문. 보험사 직접 청구 대행 서비스 제공. 24시간 긴급 출동 가능." },
  "서초 KG모터스": { id: "p2", name: "서초 KG모터스", category: "공업사", rating: 4.7, reviews: 198, distance: "1.2km", address: "서울 서초구 서초대로 456", phone: "02-2345-6789", open: true, tags: ["빠른응답", "국산차 전문"], description: "국산차 전문 공업사. 빠른 응답과 투명한 견적으로 신뢰받는 서비스 제공." },
  "역삼 현대직영": { id: "p3", name: "역삼 현대직영", category: "공업사", rating: 4.8, reviews: 445, distance: "2.1km", address: "서울 강남구 역삼동 789", phone: "02-3456-7890", open: true, tags: ["현대 공식", "보증 수리"], description: "현대자동차 공식 직영 공업사. 공식 부품 사용 및 보증 수리 서비스 제공." },
  "강남세브란스 정형외과": { id: "p4", name: "강남세브란스 정형외과", category: "병원", rating: 4.8, reviews: 521, distance: "1.5km", address: "서울 강남구 언주로 211", phone: "02-2019-3114", open: true, tags: ["교통사고 전문", "MRI 보유"], description: "교통사고 전문 정형외과. MRI·CT·초음파 당일 촬영 가능. 교통사고 환자 우선 진료." },
  "선릉 나누리병원": { id: "p5", name: "선릉 나누리병원", category: "병원", rating: 4.6, reviews: 287, distance: "2.3km", address: "서울 강남구 선릉로 100", phone: "02-4567-8901", open: true, tags: ["당일 진료", "재활 치료"], description: "교통사고 후 빠른 진료와 재활 치료 전문. 당일 진단서 발급 가능." },
  "강남 연세통증클리닉": { id: "p6", name: "강남 연세통증클리닉", category: "병원", rating: 4.7, reviews: 163, distance: "0.9km", address: "서울 강남구 논현동 321", phone: "02-111-2222", open: true, tags: ["빠른응답", "통증 전문"], description: "교통사고 후 통증 전문 클리닉. 즉시 방문 가능하며 교통사고 보험 처리 완벽 지원." },
  "SK렌터카 강남점": { id: "p7", name: "SK렌터카 강남점", category: "렌터카", rating: 4.7, reviews: 389, distance: "1.0km", address: "서울 강남구 역삼동 456", phone: "1588-0000", open: true, tags: ["사고케어 인증", "보험 연동"], description: "교통사고 피해자 전용 렌터카 서비스. 보험사 자동 연동으로 자기 부담금 없이 이용 가능." },
  "롯데렌터카 역삼점": { id: "p8", name: "롯데렌터카 역삼점", category: "렌터카", rating: 4.5, reviews: 241, distance: "1.8km", address: "서울 강남구 역삼동 100", phone: "1588-1230", open: true, tags: ["대형차 보유"], description: "다양한 차종 보유. 교통사고 피해자 우선 배차 서비스." },
  "그린카 강남센터": { id: "p9", name: "그린카 강남센터", category: "렌터카", rating: 4.6, reviews: 178, distance: "2.5km", address: "서울 강남구 삼성동 200", phone: "1600-0000", open: true, tags: ["빠른응답", "즉시 배차"], description: "즉시 배차 가능한 렌터카 서비스. 24시간 운영." },
  "교통사고 전문 법률사무소": { id: "p10", name: "교통사고 전문 법률사무소", category: "변호사", rating: 4.9, reviews: 156, distance: "온라인", address: "서울 강남구 삼성동 789", phone: "02-555-7777", open: true, tags: ["교통사고 전문", "무료 상담"], description: "교통사고 손해배상 전문 로펌. 초기 상담 무료. 성공보수제 운영." },
  "강남 로앤파트너스": { id: "p11", name: "강남 로앤파트너스", category: "변호사", rating: 4.8, reviews: 203, distance: "온라인", address: "서울 강남구 테헤란로 500", phone: "02-666-8888", open: true, tags: ["당일 상담", "합의 전문"], description: "교통사고 합의 전문. 당일 상담 가능. 보험사 대응 전략 수립 지원." },
  "서초 한결법률사무소": { id: "p12", name: "서초 한결법률사무소", category: "변호사", rating: 4.7, reviews: 98, distance: "온라인", address: "서울 서초구 서초대로 300", phone: "02-777-9999", open: true, tags: ["빠른응답", "무료 상담"], description: "교통사고 피해자 권리 보호 전문. 무료 초기 상담 및 빠른 대응." },
};

const PARTNER_REVIEWS: Record<string, PartnerReview[]> = {
  "강남 최고공업사": [
    { id: "r1", author: "김**", rating: 5, date: "2025.12.14", text: "사고 직후 당황했는데 직원분이 너무 친절하게 안내해주셨어요. 수리도 깔끔하고 보험 처리도 알아서 다 해주셔서 정말 편했습니다.", tags: ["친절해요", "보험 처리 도움"], helpful: 24 },
    { id: "r2", author: "이**", rating: 5, date: "2025.11.28", text: "수입차 BMW 수리 맡겼는데 완벽하게 복원해줬어요. 견적도 처음 말한 금액 그대로라 신뢰가 가요.", tags: ["수리 품질 최고", "견적 투명"], helpful: 18 },
    { id: "r3", author: "박**", rating: 4, date: "2025.11.10", text: "전반적으로 만족스러웠어요. 수리 기간이 예상보다 하루 더 걸렸지만 중간에 연락 주셔서 괜찮았습니다.", tags: ["친절해요"], helpful: 9 },
  ],
  "서초 KG모터스": [
    { id: "r4", author: "정**", rating: 5, date: "2025.12.01", text: "빠른 응답 덕분에 사고 당일 바로 입고할 수 있었어요. 수리도 만족스럽습니다.", tags: ["빠른응답", "친절해요"], helpful: 15 },
    { id: "r5", author: "강**", rating: 4, date: "2025.11.15", text: "국산차 전문이라 믿고 맡겼어요. 결과물도 좋고 가격도 합리적이었습니다.", tags: ["견적 투명"], helpful: 11 },
  ],
  "강남세브란스 정형외과": [
    { id: "r6", author: "송**", rating: 5, date: "2025.12.10", text: "교통사고 후 목과 허리가 너무 아팠는데 여기서 MRI 찍고 바로 치료 시작했어요. 교통사고 전문이라 보험 처리도 잘 아십니다.", tags: ["교통사고 전문", "MRI 빠름"], helpful: 28 },
    { id: "r7", author: "한**", rating: 5, date: "2025.11.20", text: "사고 당일 응급으로 갔는데 대기 없이 바로 진료받았어요. 재활 치료도 꾸준히 받고 있는데 많이 좋아졌습니다.", tags: ["대기 짧음", "재활 치료 좋음"], helpful: 19 },
    { id: "r8", author: "오**", rating: 4, date: "2025.11.05", text: "진료는 만족스러웠어요. 선생님이 친절하고 설명도 잘 해주셨어요.", tags: ["진료 친절", "설명 자세히"], helpful: 7 },
  ],
  "SK렌터카 강남점": [
    { id: "r9", author: "윤**", rating: 5, date: "2025.12.01", text: "보험사 연동이 완벽해서 돈 한 푼 안 내고 이용했어요. 직원분이 보험 관련 서류도 도와주셔서 감사했습니다.", tags: ["보험 연동 편리", "가격 합리적"], helpful: 22 },
    { id: "r10", author: "임**", rating: 4, date: "2025.11.15", text: "당일 인도라고 해서 갔는데 실제로 1시간 내에 받을 수 있었어요. 차량 상태도 좋고 직원도 친절했습니다.", tags: ["빠른 인도", "친절해요"], helpful: 11 },
  ],
  "교통사고 전문 법률사무소": [
    { id: "r11", author: "조**", rating: 5, date: "2025.12.05", text: "무료 상담 받고 바로 계약했어요. 상대방 보험사가 말도 안 되는 과실 비율 제시했는데 변호사님이 싹 다 해결해주셨습니다.", tags: ["전문적", "결과 만족"], helpful: 41 },
    { id: "r12", author: "서**", rating: 4, date: "2025.11.12", text: "담당 변호사님이 진행 상황을 계속 알려주셔서 안심이 됐어요. 최종 합의금도 기대 이상이었습니다.", tags: ["소통 원활", "결과 만족"], helpful: 16 },
  ],
};

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
];

export default function AccidentReportScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("call");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [location, setLocation] = useState("위치 자동 감지 중...");
  const [evidenceStep, setEvidenceStep] = useState(0);
  const [completedEvidence, setCompletedEvidence] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [policeReported, setPoliceReported] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  const [insuranceCalled, setInsuranceCalled] = useState(false);
  const [guardianAlertSent, setGuardianAlertSent] = useState(false);
  const [guardianCount, setGuardianCount] = useState(0);
  const [selectedDetailPartner, setSelectedDetailPartner] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Guardian 자동 알림 발송 함수
  const sendGuardianAlert = async (accidentType: string, locationStr: string) => {
    try {
      const raw = await AsyncStorage.getItem("guardians");
      if (!raw) return;
      const guardians: { id: string; name: string; phone: string; relation: string; notify: boolean }[] = JSON.parse(raw);
      const notifyList = guardians.filter((g) => g.notify);
      if (notifyList.length === 0) return;
      setGuardianCount(notifyList.length);
      setGuardianAlertSent(true);
      // 실제 서비스: expo-sms 또는 서버 API로 SMS 발송
      // 현재는 Alert으로 시뮬레이션
      const names = notifyList.map((g) => g.name).join(", ");
      Alert.alert(
        "🚨 보호자 자동 알림 발송",
        `${names}님(${notifyList.length}명)에게 사고 발생 알림과 현재 위치(${locationStr})를 자동 발송했습니다.`,
        [{ text: "확인" }]
      );
    } catch (e) {
      console.log("Guardian 알림 오류", e);
    }
  };

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
    if (currentStep === "call") {
      router.back();
    } else if (currentStep === "type") {
      setCurrentStep("call");
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
    const detectedLocation = "서울특별시 강남구 테헤란로 152";
    setLocation(detectedLocation);
    setCurrentStep("location");
    // 사고 유형 선택 → 다음 단계 진입 시 Guardian 자동 알림 발송
    sendGuardianAlert(selectedType, detectedLocation);
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

  const stepNumber = currentStep === "call" ? 1 : currentStep === "type" ? 2 : currentStep === "location" ? 3 : currentStep === "evidence" ? 4 : 5;

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
          <Text style={styles.headerStep}>{stepNumber} / 5</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(stepNumber / 5) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* STEP 1: 긴급 전화 (112 & 보험사) */}
        {currentStep === "call" && (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>지금 바로 신고하세요</Text>
              <Text style={styles.stepDesc}>사고 직후 가장 먼저 해야 할 일입니다. 신고 후 다음 단계를 진행하세요.</Text>
            </View>

            {/* 자동 선택된 보험사 안내 배너 */}
            {selectedInsurance && (() => {
              const autoIns = INSURANCE_COMPANIES.find(i => i.id === selectedInsurance);
              return (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#EBF8FF",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: "#3182CE",
                  gap: 8,
                }}>
                  <Text style={{ fontSize: 18 }}>🔍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#2B6CB0" }}>
                      등록된 차량 정보를 기반으로 {autoIns?.name}에 가입된 것으로 보입니다.
                    </Text>
                    <Text style={{ fontSize: 11, color: "#4A90D9", marginTop: 2 }}>
                      다른 보험사라면 아래에서 직접 선택해 주세요.
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* 112 신고 */}
            <View style={[styles.reportBlock, { marginBottom: 12 }]}>
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

            <Pressable
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const detectedLocation = "서울특별시 강남구 테헤란로 152";
                setLocation(detectedLocation);
                sendGuardianAlert("사고 발생", detectedLocation);
                setCurrentStep("type");
              }}
            >
              <Text style={styles.nextBtnText}>다음 단계 (사고 유형 선택)</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* STEP 2: 사고 유형 선택 */}
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
            {/* Guardian 자동 알림 발송 완료 배너 */}
            {guardianAlertSent && guardianCount > 0 && (
              <View style={{
                backgroundColor: "#FFF5F5",
                borderWidth: 1.5,
                borderColor: "#FC8181",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}>
                <Text style={{ fontSize: 22 }}>🚨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#C53030" }}>보호자 {guardianCount}명에게 자동 알림 발송 완료</Text>
                  <Text style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>Guardian에 등록된 보호자에게 사고 위치와 함께 긴급 알림이 발송되었습니다.</Text>
                </View>
              </View>
            )}
            {!guardianAlertSent && (
              <View style={{
                backgroundColor: "#EBF8FF",
                borderWidth: 1,
                borderColor: "#90CDF4",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}>
                <Text style={{ fontSize: 18 }}>👥</Text>
                <Text style={{ fontSize: 12, color: "#2B6CB0", flex: 1 }}>Guardian에 보호자를 등록하면 사고 시 자동으로 알림을 발송합니다.</Text>
              </View>
            )}
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
              {completedEvidence.length} / 3 완료
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
                      {/* 상세보기 버튼 */}
                      <Pressable
                        style={({ pressed }) => [styles.detailBtn, { borderColor: cat.color }, pressed && { opacity: 0.7 }]}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setSelectedDetailPartner(p.name);
                          setShowDetailModal(true);
                        }}
                      >
                        <Text style={[styles.detailBtnText, { color: cat.color }]}>후기 · 상세보기</Text>
                        <IconSymbol name="chevron.right" size={12} color={cat.color} />
                      </Pressable>
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

      {/* ── 파트너 상세 바텀시트 모달 ── */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDetailModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation?.()}>
            {/* 핸들 */}
            <View style={styles.modalHandle} />

            {(() => {
              if (!selectedDetailPartner) return null;
              const detail = PARTNER_DETAILS[selectedDetailPartner];
              const reviews = PARTNER_REVIEWS[selectedDetailPartner] ?? [];
              if (!detail) return null;

              // 현재 선택된 카테고리 색상
              const cat = EXPERT_CATEGORIES.find(c =>
                c.partners.some(p => p.name === selectedDetailPartner)
              );
              const accentColor = cat?.color ?? "#3182CE";

              return (
                <>
                  {/* 헤더 */}
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{detail.name}</Text>
                      <Text style={{ fontSize: 13, color: accentColor, fontWeight: "600", marginTop: 2 }}>
                        {detail.category} · {detail.open ? "영업 중" : "영업 종료"}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.6 }]}
                      onPress={() => setShowDetailModal(false)}
                    >
                      <IconSymbol name="xmark.circle.fill" size={26} color="#CBD5E0" />
                    </Pressable>
                  </View>

                  <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                    {/* 기본 정보 */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>기본 정보</Text>
                      <View style={styles.modalInfoRow}>
                        <Text style={{ fontSize: 16 }}>📍</Text>
                        <Text style={styles.modalInfoText}>{detail.address}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={{ fontSize: 16 }}>📞</Text>
                        <Text style={styles.modalInfoText}>{detail.phone}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={{ fontSize: 16 }}>📝</Text>
                        <Text style={styles.modalInfoText}>{detail.description}</Text>
                      </View>
                    </View>

                    {/* 전문 분야 태그 */}
                    {detail.tags.length > 0 && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>전문 분야</Text>
                        <View style={styles.modalSpecRow}>
                          {detail.tags.map((tag) => (
                            <View key={tag} style={[styles.modalSpecTag, { backgroundColor: accentColor + "15" }]}>
                              <Text style={[styles.modalSpecTagText, { color: accentColor }]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* 평점 & 후기 */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>고객 후기</Text>
                      <View style={styles.modalRatingRow}>
                        <Text style={styles.modalRatingBig}>{detail.rating.toFixed(1)}</Text>
                        <View>
                          <Text style={styles.modalRatingStars}>
                            {"★".repeat(Math.round(detail.rating))}{"☆".repeat(5 - Math.round(detail.rating))}
                          </Text>
                          <Text style={styles.modalRatingCount}>후기 {detail.reviews}개</Text>
                        </View>
                      </View>
                      {reviews.map((r) => (
                        <View key={r.id} style={styles.modalReviewCard}>
                          <View style={styles.modalReviewTop}>
                            <Text style={styles.modalReviewAuthor}>{r.author}</Text>
                            <Text style={styles.modalReviewStars}>{"★".repeat(r.rating)}</Text>
                          </View>
                          <Text style={styles.modalReviewText}>{r.text}</Text>
                          <Text style={styles.modalReviewDate}>{r.date}</Text>
                        </View>
                      ))}
                      {reviews.length === 0 && (
                        <Text style={{ fontSize: 13, color: "#A0AEC0", textAlign: "center", paddingVertical: 20 }}>
                          아직 등록된 후기가 없습니다.
                        </Text>
                      )}
                    </View>

                    <View style={{ height: 16 }} />
                  </ScrollView>

                  {/* 이 파트너 선택 버튼 */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalSelectBtn,
                      { backgroundColor: accentColor },
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => {
                      setSelectedPartner(selectedDetailPartner);
                      setShowDetailModal(false);
                      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={styles.modalSelectBtnText}>이 파트너 선택하기</Text>
                  </Pressable>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
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
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#FAFAFA",
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%" as any,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#718096",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: "#2D3748",
    flex: 1,
    lineHeight: 20,
  },
  modalRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  modalRatingBig: {
    fontSize: 40,
    fontWeight: "900",
    color: "#1A2B4C",
  },
  modalRatingStars: {
    fontSize: 22,
    color: "#F6AD55",
    marginBottom: 2,
  },
  modalRatingCount: {
    fontSize: 13,
    color: "#718096",
  },
  modalReviewCard: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalReviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalReviewAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3748",
  },
  modalReviewStars: {
    fontSize: 13,
    color: "#F6AD55",
  },
  modalReviewText: {
    fontSize: 13,
    color: "#4A5568",
    lineHeight: 20,
  },
  modalReviewDate: {
    fontSize: 11,
    color: "#A0AEC0",
    marginTop: 4,
  },
  modalSpecTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EBF8FF",
    marginRight: 8,
    marginBottom: 8,
  },
  modalSpecTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2B6CB0",
  },
  modalSpecRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  modalSelectBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSelectBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
