import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = ["공업사", "렉카", "병원", "변호사", "손해사정사"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Record<Category, string> = {
  공업사: "🔧",
  렉카: "🚛",
  병원: "🏥",
  변호사: "⚖️",
  손해사정사: "📋",
};

const CATEGORY_DESC: Record<Category, string> = {
  공업사: "차량 수리 및 판금 도색 전문",
  렉카: "사고 차량 견인 및 긴급 출동",
  병원: "사고 부상 치료 및 진단",
  변호사: "사고 법률 자문 및 소송 대리",
  손해사정사: "보험금 청구 및 손해 산정",
};

export default function PartnerRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 폼 상태
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [agreed, setAgreed] = useState(false);

  const meQuery = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  // 관리자에게 파트너 등록 요청 (admin.partners.register 사용)
  const registerMutation = trpc.partnerApply.applyPartner.useMutation({
    onSuccess: () => {
      utils.partner.myProfile.invalidate();
      setStep(3);
    },
    onError: (err) => {
      Alert.alert("등록 실패", err.message || "잠시 후 다시 시도해주세요.");
    },
  });

  const handleSubmit = () => {
    if (!selectedCategory || !name || !phone || !address) {
      Alert.alert("입력 오류", "필수 항목을 모두 입력해주세요.");
      return;
    }
    if (!agreed) {
      Alert.alert("약관 동의", "이용약관에 동의해주세요.");
      return;
    }
    if (!meQuery.data) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }
    registerMutation.mutate({
      name,
      category: selectedCategory,
      phone,
      address,
      description: description || undefined,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : router.back())} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>파트너 등록 신청</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 진행 단계 */}
      <View style={styles.stepRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
              {s === 1 ? "업종 선택" : s === 2 ? "업체 정보" : "완료"}
            </Text>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>

      {/* 단계 1: 업종 선택 */}
      {step === 1 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>어떤 업종으로 등록하시겠어요?</Text>
          <Text style={styles.sectionDesc}>사고 발생 시 매칭되는 전문 분야를 선택하세요.</Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.categoryCard, selectedCategory === cat && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={[styles.categoryName, selectedCategory === cat && styles.categoryNameActive]}>
                  {cat}
                </Text>
                <Text style={[styles.categoryDesc, selectedCategory === cat && styles.categoryDescActive]}>
                  {CATEGORY_DESC[cat]}
                </Text>
                {selectedCategory === cat && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.nextBtn, !selectedCategory && styles.nextBtnDisabled]}
            onPress={() => selectedCategory && setStep(2)}
            disabled={!selectedCategory}
          >
            <Text style={styles.nextBtnText}>다음 단계 →</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* 단계 2: 업체 정보 입력 */}
      {step === 2 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>업체 정보를 입력해주세요</Text>
          <Text style={styles.sectionDesc}>
            {selectedCategory && `${CATEGORY_ICONS[selectedCategory]} ${selectedCategory}`} 업체로 등록됩니다.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>업체명 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 강남 스피드 공업사"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>대표 전화번호 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="예: 02-1234-5678"
              keyboardType="phone-pad"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>주소 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="예: 서울시 강남구 테헤란로 123"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>업체 소개 (선택)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="업체 특징, 전문 분야, 운영 시간 등을 자유롭게 입력하세요"
              multiline
              numberOfLines={4}
              placeholderTextColor="#A0AEC0"
            />
          </View>

          {/* 약관 동의 */}
          <Pressable style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.agreeText}>
              파트너 이용약관 및 개인정보 처리방침에 동의합니다.{"\n"}
              <Text style={styles.agreeLink}>약관 보기</Text>
            </Text>
          </Pressable>

          <Pressable
            style={[styles.nextBtn, registerMutation.isPending && styles.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>등록 신청 완료</Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      {/* 단계 3: 완료 */}
      {step === 3 && (
        <View style={[styles.scroll, styles.successContainer]}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>등록 신청 완료!</Text>
          <Text style={styles.successDesc}>
            {selectedCategory && `${CATEGORY_ICONS[selectedCategory]} ${selectedCategory}`} 업체로 등록 신청이 완료되었습니다.{"\n\n"}
            관리자 검토 후 승인되면 파트너 대시보드에서{"\n"}
            새 의뢰를 받을 수 있습니다.{"\n\n"}
            승인까지 보통 1~2 영업일이 소요됩니다.
          </Text>
          <Pressable style={styles.doneBtn} onPress={() => router.replace("/(tabs)/my" as never)}>
            <Text style={styles.doneBtnText}>마이페이지로 돌아가기</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { width: 60 },
  backText: { fontSize: 14, color: "#3182CE", fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: "#3182CE" },
  stepNum: { fontSize: 13, fontWeight: "700", color: "#A0AEC0" },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 12, color: "#A0AEC0", fontWeight: "500" },
  stepLabelActive: { color: "#3182CE" },
  stepLine: { width: 32, height: 2, backgroundColor: "#E2E8F0", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: "#3182CE" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1A202C" },
  sectionDesc: { fontSize: 14, color: "#718096" },
  categoryGrid: { gap: 12 },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryCardActive: { borderColor: "#3182CE", backgroundColor: "#EBF8FF" },
  categoryIcon: { fontSize: 28 },
  categoryName: { fontSize: 16, fontWeight: "700", color: "#1A202C", flex: 0 },
  categoryNameActive: { color: "#3182CE" },
  categoryDesc: { fontSize: 12, color: "#718096", flex: 1 },
  categoryDescActive: { color: "#2B6CB0" },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3182CE",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { fontSize: 14, color: "#fff", fontWeight: "700" },
  nextBtn: {
    backgroundColor: "#3182CE",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  nextBtnDisabled: { backgroundColor: "#A0AEC0" },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  formGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#4A5568" },
  required: { color: "#E53E3E" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A202C",
    backgroundColor: "#fff",
  },
  inputMulti: { height: 100, textAlignVertical: "top" },
  agreeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  checkboxCheck: { fontSize: 13, color: "#fff", fontWeight: "700" },
  agreeText: { flex: 1, fontSize: 13, color: "#4A5568", lineHeight: 20 },
  agreeLink: { color: "#3182CE", textDecorationLine: "underline" },
  successContainer: { justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#1A202C" },
  successDesc: { fontSize: 15, color: "#4A5568", textAlign: "center", lineHeight: 24 },
  doneBtn: {
    backgroundColor: "#3182CE",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
