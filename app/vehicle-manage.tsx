import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

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

export default function VehicleManageScreen() {
  const router = useRouter();
  const numRef = useRef<TextInput>(null);

  // 차량번호 상태
  const [plateRegion, setPlateRegion] = useState("");
  const [plateChar, setPlateChar] = useState("");
  const [plateNum, setPlateNum] = useState("");
  const [showCharPicker, setShowCharPicker] = useState(false);

  // 보험사 상태
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [policyNumber, setPolicyNumber] = useState("");

  // 기타 정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const fullPlate = `${plateRegion}${plateChar} ${plateNum}`.trim();
  const isPlateValid = plateRegion.length >= 2 && /[가-힣]/.test(plateChar) && plateNum.length >= 4;

  // 기존 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem("userProfile");
        if (raw) {
          const p = JSON.parse(raw);
          if (p.name) setName(p.name);
          if (p.phone) setPhone(p.phone);
          if (p.policyNumber) setPolicyNumber(p.policyNumber);
          if (p.insurance) setSelectedInsurance(p.insurance);
          // 번호판 파싱: "12가 3456" → region=12, char=가, num=3456
          if (p.plate) {
            const m = p.plate.match(/^(\d{2,3})([가-힣])\s*(\d{4})$/);
            if (m) {
              setPlateRegion(m[1]);
              setPlateChar(m[2]);
              setPlateNum(m[3]);
            }
          }
        }
      } catch (e) {
        console.log("로드 오류", e);
      }
    };
    load();
  }, []);

  const handleSelectChar = useCallback((ch: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlateChar(ch);
    setShowCharPicker(false);
    setTimeout(() => numRef.current?.focus(), 100);
  }, []);

  const toggleInsurance = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInsurance((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!isPlateValid) {
      Alert.alert("입력 오류", "차량 번호를 올바르게 입력해주세요.\n예: 12가 3456");
      return;
    }
    try {
      const raw = await AsyncStorage.getItem("userProfile");
      const existing = raw ? JSON.parse(raw) : {};
      const updated = {
        ...existing,
        plate: fullPlate,
        insurance: selectedInsurance,
        policyNumber,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("userProfile", JSON.stringify(updated));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("저장 완료", "차량 정보가 업데이트되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("오류", "저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={22} color="#1A2B4C" />
        </Pressable>
        <Text style={styles.headerTitle}>내 차량 관리</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 차량번호 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: "#EBF4FF" }]}>
                <IconSymbol name="car.fill" size={18} color="#3182CE" />
              </View>
              <Text style={styles.sectionTitle}>차량 번호판</Text>
            </View>

            {/* 번호판 UI */}
            <View style={styles.plateContainer}>
              <View style={styles.plateTagRow}>
                <View style={styles.plateBlueTag}>
                  <Text style={styles.plateTagText}>🇰🇷 KOREA</Text>
                </View>
              </View>
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
                  <Pressable
                    style={[
                      styles.plateInput,
                      styles.plateInputChar,
                      styles.plateCharBtn,
                      showCharPicker && styles.plateCharBtnActive,
                    ]}
                    onPress={() => setShowCharPicker((v) => !v)}
                  >
                    <Text style={[styles.plateCharBtnText, !plateChar && styles.plateCharBtnPlaceholder]}>
                      {plateChar || "가"}
                    </Text>
                  </Pressable>
                  <TextInput
                    ref={numRef}
                    style={[styles.plateInput, styles.plateInputNum]}
                    value={plateNum}
                    onChangeText={(t) => setPlateNum(t.replace(/\D/g, "").slice(0, 4))}
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

              {isPlateValid && (
                <View style={styles.platePreview}>
                  <Text style={styles.platePreviewText}>
                    등록 번호: <Text style={styles.platePreviewBold}>{fullPlate}</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 보험사 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: "#F5F0FF" }]}>
                <IconSymbol name="doc.text.fill" size={18} color="#805AD5" />
              </View>
              <Text style={styles.sectionTitle}>가입 보험사</Text>
              <Text style={styles.sectionSubLabel}>복수 선택 가능</Text>
            </View>

            <View style={styles.insuranceGrid}>
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

            {/* 증권번호 입력 */}
            <View style={styles.policyBox}>
              <Text style={styles.policyLabel}>증권번호 (선택)</Text>
              <TextInput
                style={styles.policyInput}
                value={policyNumber}
                onChangeText={setPolicyNumber}
                placeholder="보험 증권번호를 입력하세요"
                placeholderTextColor="#A0AEC0"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* 안내 박스 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              차량 번호와 보험사 정보는 사고 발생 시 자동으로 입력되어 빠른 접수를 도와드립니다.
            </Text>
          </View>

          {/* 저장 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              !isPlateValid && styles.saveBtnDisabled,
              pressed && isPlateValid && { opacity: 0.85 },
            ]}
            onPress={handleSave}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>변경사항 저장</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 14,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B4C",
    flex: 1,
  },
  sectionSubLabel: {
    fontSize: 12,
    color: "#A0AEC0",
  },
  // 번호판
  plateContainer: {
    alignItems: "center",
    gap: 12,
  },
  plateTagRow: {
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  plateBlueTag: {
    backgroundColor: "#1A56DB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  plateTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  plate: {
    backgroundColor: "#FEFCE8",
    borderWidth: 2,
    borderColor: "#1A2B4C",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },
  plateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  plateInput: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A2B4C",
    borderBottomWidth: 2,
    borderBottomColor: "#CBD5E0",
    paddingVertical: 4,
    minWidth: 60,
  },
  plateInputRegion: {
    width: 72,
  },
  plateInputChar: {
    width: 50,
  },
  plateInputNum: {
    width: 90,
  },
  plateCharBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#EBF4FF",
    borderBottomWidth: 2,
    borderBottomColor: "#3182CE",
  },
  plateCharBtnActive: {
    backgroundColor: "#BEE3F8",
  },
  plateCharBtnText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  plateCharBtnPlaceholder: {
    color: "#B0B8C8",
  },
  charPicker: {
    width: "100%",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  charPickerTitle: {
    fontSize: 13,
    color: "#718096",
    marginBottom: 10,
    textAlign: "center",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2B4C",
  },
  charPickerBtnTextSelected: {
    color: "#FFFFFF",
  },
  platePreview: {
    backgroundColor: "#F0FFF4",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#9AE6B4",
  },
  platePreviewText: {
    fontSize: 14,
    color: "#2D6A4F",
  },
  platePreviewBold: {
    fontWeight: "800",
    fontSize: 16,
  },
  // 보험사
  insuranceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  insuranceCard: {
    width: "47%",
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 10,
    gap: 4,
  },
  insuranceCheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  checkMark: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  insuranceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A2B4C",
  },
  insuranceTel: {
    fontSize: 11,
    color: "#A0AEC0",
  },
  policyBox: {
    gap: 8,
  },
  policyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
  },
  policyInput: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A2B4C",
  },
  // 안내
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EBF4FF",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#2C5282",
    lineHeight: 20,
  },
  // 저장 버튼
  saveBtn: {
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
  saveBtnDisabled: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
