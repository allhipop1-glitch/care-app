import { useState, useRef, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";

const STEPS = ["차량 등록", "내 정보", "보험 등록"] as const;
type StepType = (typeof STEPS)[number];

const INSURANCE_LIST = [
  { id: "samsung", name: "삼성화재", tel: "1588-5114", color: "#1A56DB" },
  { id: "hyundai", name: "현대해상", tel: "1588-5656", color: "#E53E3E" },
  { id: "kb", name: "KB손해보험", tel: "1544-0114", color: "#D97706" },
  { id: "db", name: "DB손해보험", tel: "1588-0100", color: "#38A169" },
  { id: "meritz", name: "메리츠화재", tel: "1566-7711", color: "#805AD5" },
  { id: "lotte", name: "롯데손해보험", tel: "1588-3344", color: "#DD6B20" },
  { id: "hanwha", name: "한화손해보험", tel: "1566-8000", color: "#3182CE" },
  { id: "mgen", name: "MG손해보험", tel: "1588-5959", color: "#2D3748" },
];

// 차량번호판 한글 35자 (고정)
const PLATE_CHARS = [
  "가","나","다","라","마",
  "거","너","더","러","머",
  "버","서","어","저",
  "고","노","도","로","모",
  "보","소","오","조",
  "구","누","두","루","무",
  "부","수","우","주",
  "하","허","호",
];

export default function RegisterScreen() {
  const [step, setStep] = useState<StepType>("차량 등록");
  const [plateRegion, setPlateRegion] = useState(""); // 앞 숫자 (12 or 123)
  const [plateChar, setPlateChar] = useState("");     // 가운데 한글
  const [plateNum, setPlateNum] = useState("");       // 뒤 숫자 (3456 or 4567)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [policyNumber, setPolicyNumber] = useState("");

  // 보험 단계 하위 상태
  // "detecting" : 자동 감지 애니메이션
  // "confirm"   : 감지된 보험사 확인 (예/아니오)
  // "manual"    : 직접 선택
  const [insuranceSubStep, setInsuranceSubStep] = useState<"detecting" | "confirm" | "manual">("detecting");
  const [detectedInsurance, setDetectedInsurance] = useState<string | null>(null);

  // 차량번호 기반 보험사 시뮬레이션 감지 (1초 딥)
  const simulateDetection = (plate: string) => {
    setInsuranceSubStep("detecting");
    setDetectedInsurance(null);
    setTimeout(() => {
      // 실제 서비스라면 서버 API 호출. 여기서는 번호판 마지막 숫자로 보험사 매핑 시뮬레이션
      const lastDigit = parseInt(plate.replace(/\D/g, "").slice(-1)) || 0;
      const mockMap: Record<number, string> = {
        0: "samsung", 1: "hyundai", 2: "kb", 3: "db",
        4: "meritz", 5: "lotte", 6: "hanwha", 7: "samsung",
        8: "hyundai", 9: "kb",
      };
      const detected = mockMap[lastDigit] ?? "samsung";
      setDetectedInsurance(detected);
      setInsuranceSubStep("confirm");
    }, 1200);
  };

  const [showCharPicker, setShowCharPicker] = useState(false);
  const numRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const birthRef = useRef<TextInput>(null);

  const handleSelectChar = useCallback((ch: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlateChar(ch);
    setShowCharPicker(false);
    setTimeout(() => numRef.current?.focus(), 100);
  }, []);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const toggleInsurance = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInsurance((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const fullPlate = `${plateRegion}${plateChar} ${plateNum}`.trim();
  // 완성된 한글(가-힣) 또는 조합 중인 자모(ㄱ-ㅎ, ㅏ-ㅣ) 모두 유효로 처리
  const isPlateValid = plateRegion.length >= 2 && /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(plateChar) && plateNum.length >= 4;

  const handleNext = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (step === "차량 등록") {
      if (!isPlateValid) {
        Alert.alert("입력 오류", "차량 번호를 올바르게 입력해주세요.");
        return;
      }
      setStep("내 정보");
    } else if (step === "내 정보") {
      if (!name.trim() || !phone.trim()) {
        Alert.alert("입력 오류", "이름과 연락처를 입력해주세요.");
        return;
      }
      setStep("보험 등록");
      // 보험 단계 진입 시 자동 감지 시작
      simulateDetection(fullPlate);
    } else {
      // 완료 — AsyncStorage에 저장
      const userData = {
        plate: fullPlate,
        name,
        phone,
        birthYear,
        insurance: selectedInsurance,
        policyNumber,
        registeredAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
      await AsyncStorage.setItem("onboardingDone", "true");
      router.replace("/(tabs)");
    }
  };

  const handleSkipInsurance = async () => {
    await AsyncStorage.setItem("userProfile", JSON.stringify({ plate: fullPlate, name, phone, birthYear, insurance: [], policyNumber: "" }));
    await AsyncStorage.setItem("onboardingDone", "true");
    router.replace("/(tabs)");
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  return (
    <ScreenContainer containerClassName="bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, stepIndex >= i && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, stepIndex >= i && styles.stepDotTextActive]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, stepIndex >= i && styles.stepLabelActive]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: 차량 번호판 */}
          {step === "차량 등록" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>내 차량을 등록하세요</Text>
              <Text style={styles.stepDesc}>
                차량 번호를 등록하면 사고 발생 시 빠른 접수와 보험 처리가 가능합니다.
              </Text>

              {/* 번호판 디자인 */}
              <View style={styles.plateContainer}>
                {/* 번호판 상단 태그 */}
                <View style={styles.plateTagRow}>
                  <View style={styles.plateBlueTag}>
                    <Text style={styles.plateTagText}>🇰🇷 KOREA</Text>
                  </View>
                </View>

                {/* 번호판 본체 */}
                <View style={styles.plate}>
                  <View style={styles.plateInputRow}>
                    <TextInput
                      style={[styles.plateInput, styles.plateInputRegion]}
                      value={plateRegion}
                      onChangeText={(t) => {
                        const digits = t.replace(/\D/g, "").slice(0, 3);
                        setPlateRegion(digits);
                        if (digits.length >= 2) setShowCharPicker(true);
                      }}
                      placeholder="12"
                      placeholderTextColor="#B0B8C8"
                      keyboardType="number-pad"
                      maxLength={3}
                      textAlign="center"
                    />
                    {/* 한글 선택 버튼 — TextInput 대신 탭으로 선택 */}
                    <Pressable
                      style={[styles.plateInput, styles.plateInputChar, styles.plateCharBtn,
                        showCharPicker && styles.plateCharBtnActive]}
                      onPress={() => setShowCharPicker((v) => !v)}
                    >
                      <Text style={[
                        styles.plateCharBtnText,
                        !plateChar && styles.plateCharBtnPlaceholder
                      ]}>
                        {plateChar || "가"}
                      </Text>
                    </Pressable>
                    <TextInput
                      ref={numRef}
                      style={[styles.plateInput, styles.plateInputNum]}
                      value={plateNum}
                      onChangeText={(t) => {
                        const digits = t.replace(/\D/g, "").slice(0, 4);
                        setPlateNum(digits);
                      }}
                      placeholder="3456"
                      placeholderTextColor="#B0B8C8"
                      keyboardType="number-pad"
                      maxLength={4}
                      textAlign="center"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* 한글 선택 키패드 */}
                {showCharPicker && (
                  <View style={styles.charPicker}>
                    <Text style={styles.charPickerTitle}>한글을 선택하세요</Text>
                    <View style={styles.charPickerGrid}>
                      {PLATE_CHARS.map((ch) => (
                        <Pressable
                          key={ch}
                          style={[styles.charPickerBtn, plateChar === ch && styles.charPickerBtnSelected]}
                          onPress={() => handleSelectChar(ch)}
                        >
                          <Text style={[styles.charPickerBtnText, plateChar === ch && styles.charPickerBtnTextSelected]}>
                            {ch}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* 미리보기 */}
                {isPlateValid && (
                  <View style={styles.platePreview}>
                    <Text style={styles.platePreviewText}>
                      등록 번호: <Text style={styles.platePreviewBold}>{fullPlate}</Text>
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxIcon}>💡</Text>
                <Text style={styles.infoBoxText}>
                  차량 번호는 보험 처리, 렌터카 대차, 공업사 수리 예약에 자동으로 사용됩니다.
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: 내 정보 */}
          {step === "내 정보" && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>기본 정보를 입력하세요</Text>
              <Text style={styles.stepDesc}>
                사고 발생 시 전문가 연결과 보험 접수에 사용됩니다.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>이름 <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="홍길동"
                  placeholderTextColor="#A0AEC0"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>연락처 <Text style={styles.required}>*</Text></Text>
                <TextInput
                  ref={phoneRef}
                  style={styles.formInput}
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  placeholder="010-0000-0000"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="phone-pad"
                  maxLength={13}
                  returnKeyType="next"
                  onSubmitEditing={() => birthRef.current?.focus()}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>출생연도 <Text style={styles.optional}>(선택)</Text></Text>
                <TextInput
                  ref={birthRef}
                  style={styles.formInput}
                  value={birthYear}
                  onChangeText={(t) => setBirthYear(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1990"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="number-pad"
                  maxLength={4}
                  returnKeyType="done"
                />
              </View>

              {/* 등록된 차량 번호 확인 */}
              <View style={styles.plateConfirmBox}>
                <Text style={styles.plateConfirmLabel}>등록 차량</Text>
                <View style={styles.plateConfirmPlate}>
                  <Text style={styles.plateConfirmText}>{fullPlate}</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: 보험 등록 */}
          {step === "보험 등록" && (
            <View style={styles.stepContent}>

              {/* ── 3-1: 자동 감지 중 ── */}
              {insuranceSubStep === "detecting" && (
                <View style={styles.detectingBox}>
                  <Text style={styles.detectingIcon}>🔍</Text>
                  <Text style={styles.detectingTitle}>보험사를 조회 중입니다</Text>
                  <Text style={styles.detectingDesc}>
                    차량번호 <Text style={{ fontWeight: "800", color: "#1A2B4C" }}>{fullPlate}</Text>를{"\n"}기반으로 가입 보험사를 확인하고 있어요.
                  </Text>
                  {/* 로딩 점 */}
                  <View style={styles.dotRow}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>
              )}

              {/* ── 3-2: 감지 결과 확인 (예/아니오) ── */}
              {insuranceSubStep === "confirm" && detectedInsurance && (() => {
                const ins = INSURANCE_LIST.find(i => i.id === detectedInsurance)!;
                return (
                  <View style={styles.confirmBox}>
                    <View style={styles.confirmIconWrap}>
                      <Text style={styles.confirmBigIcon}>🛡️</Text>
                    </View>
                    <Text style={styles.confirmTitle}>보험사를 찾았어요!</Text>
                    <Text style={styles.confirmDesc}>
                      차량번호 <Text style={{ fontWeight: "800", color: "#1A2B4C" }}>{fullPlate}</Text>는{"\n"}
                      <Text style={[styles.confirmInsName, { color: ins.color }]}>{ins.name}</Text>에 가입된 것으로 보입니다.
                    </Text>

                    <View style={[styles.confirmInsCard, { borderColor: ins.color }]}>
                      <View style={[styles.confirmInsColorBar, { backgroundColor: ins.color }]} />
                      <View style={styles.confirmInsInfo}>
                        <Text style={[styles.confirmInsCardName, { color: ins.color }]}>{ins.name}</Text>
                        <Text style={styles.confirmInsTel}>📞 {ins.tel}</Text>
                      </View>
                      <Text style={styles.confirmInsCheck}>✓</Text>
                    </View>

                    <Text style={styles.confirmQuestion}>이 보험사가 맞나요?</Text>

                    <View style={styles.confirmBtnRow}>
                      <Pressable
                        style={({ pressed }) => [styles.confirmBtnNo, pressed && { opacity: 0.8 }]}
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setInsuranceSubStep("manual");
                        }}
                      >
                        <Text style={styles.confirmBtnNoText}>아니오, 직접 선택할게요</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.confirmBtnYes, { backgroundColor: ins.color }, pressed && { opacity: 0.85 }]}
                        onPress={async () => {
                          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setSelectedInsurance([ins.id]);
                          const userData = {
                            plate: fullPlate, name, phone, birthYear,
                            insurance: [ins.id], policyNumber,
                            registeredAt: new Date().toISOString(),
                          };
                          await AsyncStorage.setItem("userProfile", JSON.stringify(userData));
                          await AsyncStorage.setItem("onboardingDone", "true");
                          router.replace("/(tabs)");
                        }}
                      >
                        <Text style={styles.confirmBtnYesText}>네, 맞아요!</Text>
                      </Pressable>
                    </View>

                    <Pressable style={styles.skipBtn} onPress={handleSkipInsurance}>
                      <Text style={styles.skipBtnText}>나중에 등록하기</Text>
                    </Pressable>
                  </View>
                );
              })()}

              {/* ── 3-3: 직접 선택 ── */}
              {insuranceSubStep === "manual" && (
                <View>
                  <Text style={styles.stepTitle}>보험사를 직접 선택하세요</Text>
                  <Text style={styles.stepDesc}>
                    가입된 보험사를 선택하면 사고 발생 시 즉시 접수 번호로 연결됩니다.
                  </Text>

                  <View style={[styles.insuranceGrid, { marginTop: 8 }]}>
                    {INSURANCE_LIST.map((ins) => {
                      const selected = selectedInsurance.includes(ins.id);
                      return (
                        <Pressable
                          key={ins.id}
                          style={({ pressed }) => [
                            styles.insuranceCard,
                            selected && { borderColor: ins.color, backgroundColor: ins.color + "12" },
                            pressed && { opacity: 0.8 },
                          ]}
                          onPress={() => toggleInsurance(ins.id)}
                        >
                          <View style={[styles.insuranceCheckDot, selected && { backgroundColor: ins.color }]}>
                            {selected && <Text style={styles.checkMark}>✓</Text>}
                          </View>
                          <Text style={[styles.insuranceName, selected && { color: ins.color, fontWeight: "700" }]}>
                            {ins.name}
                          </Text>
                          <Text style={styles.insuranceTel}>{ins.tel}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable style={styles.skipBtn} onPress={handleSkipInsurance}>
                    <Text style={styles.skipBtnText}>나중에 등록하기</Text>
                  </Pressable>
                </View>
              )}

            </View>
          )}
        </ScrollView>

        {/* 하단 버튼 — 보험 단계 confirm/detecting 에서는 숨김 */}
        {!(step === "보험 등록" && (insuranceSubStep === "detecting" || insuranceSubStep === "confirm")) && (
          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.nextBtn,
                !isPlateValid && step === "차량 등록" && styles.nextBtnDisabled,
                insuranceSubStep === "manual" && selectedInsurance.length === 0 && styles.nextBtnDisabled,
                pressed && { opacity: 0.88 },
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>
                {step === "보험 등록" ? "등록 완료 →" : "다음 →"}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginBottom: 16,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#1A2B4C",
    borderRadius: 2,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: "#1A2B4C",
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A0AEC0",
  },
  stepDotTextActive: {
    color: "#FFFFFF",
  },
  stepLabel: {
    fontSize: 11,
    color: "#A0AEC0",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#1A2B4C",
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepContent: {
    padding: 24,
    gap: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4C",
    lineHeight: 30,
  },
  stepDesc: {
    fontSize: 14,
    color: "#718096",
    lineHeight: 22,
    marginTop: -8,
  },

  // 번호판
  plateContainer: {
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  plateTagRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    maxWidth: 320,
  },
  plateBlueTag: {
    backgroundColor: "#1A56DB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  plateTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  plate: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#1A2B4C",
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  plateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  plateInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#CBD5E0",
    fontSize: 28,
    fontWeight: "800",
    color: "#1A2B4C",
    paddingBottom: 4,
  },
  plateInputRegion: {
    width: 70,
    letterSpacing: 4,
  },
  plateInputChar: {
    width: 44,
    fontSize: 32,
    letterSpacing: 0,
  },
  plateInputNum: {
    width: 100,
    letterSpacing: 6,
  },
  platePreview: {
    backgroundColor: "#F0F4F8",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  platePreviewText: {
    fontSize: 13,
    color: "#718096",
  },
  platePreviewBold: {
    fontWeight: "800",
    color: "#1A2B4C",
    fontSize: 15,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EBF8FF",
    borderRadius: 10,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  infoBoxIcon: {
    fontSize: 16,
  },
  infoBoxText: {
    fontSize: 13,
    color: "#2B6CB0",
    lineHeight: 20,
    flex: 1,
  },

  // 폼
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
  },
  required: {
    color: "#E53E3E",
  },
  optional: {
    fontSize: 12,
    color: "#A0AEC0",
    fontWeight: "400",
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A2B4C",
    backgroundColor: "#FAFAFA",
  },
  plateConfirmBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  plateConfirmLabel: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  plateConfirmPlate: {
    backgroundColor: "#1A2B4C",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  plateConfirmText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },

  // 보험사
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3748",
  },
  insuranceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  insuranceCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  insuranceCheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  checkMark: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  insuranceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
    flex: 1,
  },
  insuranceTel: {
    fontSize: 10,
    color: "#A0AEC0",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipBtnText: {
    fontSize: 14,
    color: "#A0AEC0",
    fontWeight: "600",
  },

  // 하단 버튼
  bottomBar: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
  },
  nextBtn: {
    backgroundColor: "#1A2B4C",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextBtnDisabled: {
    backgroundColor: "#CBD5E0",
  },
  // 한글 선택 버튼 (번호판)
  plateCharBtn: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#CBD5E0",
    backgroundColor: "#F7FAFC",
    borderRadius: 4,
  },
  plateCharBtnActive: {
    borderBottomColor: "#1A2B4C",
    backgroundColor: "#EBF4FF",
  },
  plateCharBtnText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A2B4C",
    textAlign: "center",
  },
  plateCharBtnPlaceholder: {
    color: "#B0B8C8",
  },
  // 한글 키패드
  charPicker: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  charPickerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718096",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  charPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  charPickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  charPickerBtnSelected: {
    backgroundColor: "#1A2B4C",
    borderColor: "#1A2B4C",
  },
  charPickerBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
  },
  charPickerBtnTextSelected: {
    color: "#FFFFFF",
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  // ── 보험 자동감지 스타일 ──
  detectingBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 14,
  },
  detectingIcon: {
    fontSize: 52,
  },
  detectingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2B4C",
    textAlign: "center",
  },
  detectingDesc: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    lineHeight: 22,
  },
  dotRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
  },
  dotActive: {
    backgroundColor: "#1A2B4C",
  },
  // ── 보험 확인 스타일 ──
  confirmBox: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  confirmIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EBF8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBigIcon: {
    fontSize: 40,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A2B4C",
    textAlign: "center",
  },
  confirmDesc: {
    fontSize: 15,
    color: "#4A5568",
    textAlign: "center",
    lineHeight: 24,
  },
  confirmInsName: {
    fontWeight: "800",
    fontSize: 15,
  },
  confirmInsCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmInsColorBar: {
    width: 6,
    alignSelf: "stretch",
  },
  confirmInsInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  confirmInsCardName: {
    fontSize: 17,
    fontWeight: "800",
  },
  confirmInsTel: {
    fontSize: 13,
    color: "#718096",
  },
  confirmInsCheck: {
    fontSize: 22,
    color: "#38A169",
    fontWeight: "900",
    paddingRight: 16,
  },
  confirmQuestion: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3748",
    textAlign: "center",
    marginTop: 4,
  },
  confirmBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmBtnNo: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnNoText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
    textAlign: "center",
  },
  confirmBtnYes: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnYesText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
