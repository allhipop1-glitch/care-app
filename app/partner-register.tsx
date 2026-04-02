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
  Switch,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

// ─── 상수 ─────────────────────────────────────────────────────────────────────
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

// 카테고리별 서비스 금액 템플릿
const PRICING_TEMPLATES: Record<Category, { name: string; unit: string }[]> = {
  공업사: [
    { name: "판금 도색 (소)", unit: "건" },
    { name: "판금 도색 (대)", unit: "건" },
    { name: "엔진 오일 교환", unit: "회" },
    { name: "타이어 교체", unit: "개" },
  ],
  렉카: [
    { name: "기본 견인 (10km 이내)", unit: "회" },
    { name: "장거리 견인 (km당)", unit: "km" },
    { name: "야간/공휴일 할증", unit: "%" },
    { name: "긴급 출동비", unit: "회" },
  ],
  병원: [
    { name: "초진 진료비", unit: "회" },
    { name: "X-ray 촬영", unit: "회" },
    { name: "MRI 촬영", unit: "회" },
    { name: "물리치료", unit: "회" },
  ],
  변호사: [
    { name: "법률 상담", unit: "30분" },
    { name: "합의 대리", unit: "건" },
    { name: "소송 착수금", unit: "건" },
    { name: "성공 보수율", unit: "%" },
  ],
  손해사정사: [
    { name: "손해 사정 수수료", unit: "%" },
    { name: "보험금 청구 대리", unit: "건" },
    { name: "현장 조사비", unit: "회" },
    { name: "서류 작성 대행", unit: "건" },
  ],
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Day = (typeof DAYS)[number];
const DAY_LABELS: Record<Day, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

type DayHours = { open: string; close: string; closed: boolean };
type BusinessHours = Record<Day, DayHours>;

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: "09:00", close: "18:00", closed: false },
  tue: { open: "09:00", close: "18:00", closed: false },
  wed: { open: "09:00", close: "18:00", closed: false },
  thu: { open: "09:00", close: "18:00", closed: false },
  fri: { open: "09:00", close: "18:00", closed: false },
  sat: { open: "09:00", close: "13:00", closed: false },
  sun: { open: "09:00", close: "13:00", closed: true },
};

type PricingItem = { name: string; price: string; unit: string; desc: string };

const STEP_LABELS = ["업종 선택", "기본 정보", "운영 시간", "사진 & 금액", "완료"];

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────
export default function PartnerRegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ── 단계 1: 업종
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // ── 단계 2: 기본 정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [parkingAvailable, setParkingAvailable] = useState(false);

  // ── 단계 3: 운영 시간
  const [businessHours, setBusinessHours] = useState<BusinessHours>({ ...DEFAULT_HOURS });

  // ── 단계 4: 사진 & 금액
  const [photos, setPhotos] = useState<string[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [agreed, setAgreed] = useState(false);

  const meQuery = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const registerMutation = trpc.partnerApply.applyPartner.useMutation({
    onSuccess: () => {
      utils.partner.myProfile.invalidate();
      setStep(5);
    },
    onError: (err) => {
      Alert.alert("등록 실패", err.message || "잠시 후 다시 시도해주세요.");
    },
  });

  // ── 사진 선택
  const handlePickPhoto = async () => {
    if (photos.length >= 8) {
      Alert.alert("사진 제한", "최대 8장까지 등록 가능합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8 - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a: ImagePicker.ImagePickerAsset) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 8));
    }
  };

  // ── 가격 항목 초기화 (카테고리 선택 시)
  const initPricing = (cat: Category) => {
    const templates = PRICING_TEMPLATES[cat];
    setPricing(templates.map((t) => ({ name: t.name, price: "", unit: t.unit, desc: "" })));
  };

  // ── 운영시간 업데이트
  const updateHours = (day: Day, field: keyof DayHours, value: string | boolean) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // ── 전체 요일 일괄 적용
  const applyAllWeekdays = (open: string, close: string) => {
    const weekdays: Day[] = ["mon", "tue", "wed", "thu", "fri"];
    setBusinessHours((prev) => {
      const next = { ...prev };
      weekdays.forEach((d) => {
        next[d] = { ...next[d], open, close, closed: false };
      });
      return next;
    });
  };

  // ── 제출
  const handleSubmit = () => {
    if (!selectedCategory || !name || !phone || !address) {
      Alert.alert("입력 오류", "필수 항목을 모두 입력해주세요.");
      return;
    }
    if (photos.length < 3) {
      Alert.alert("사진 부족", "대표 사진을 최소 3장 이상 등록해주세요.");
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

    const filledPricing = pricing.filter((p) => p.price.trim() !== "");

    registerMutation.mutate({
      name,
      category: selectedCategory,
      phone,
      address,
      description: description || undefined,
      businessHours: JSON.stringify(businessHours),
      photoUrls: JSON.stringify(photos),
      pricingInfo: filledPricing.length > 0 ? JSON.stringify(filledPricing) : undefined,
      website: website || undefined,
      parkingAvailable,
    });
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as typeof step);
    else router.back();
  };

  const goNext = () => {
    if (step === 1 && !selectedCategory) {
      Alert.alert("업종 선택", "업종을 선택해주세요.");
      return;
    }
    if (step === 2) {
      if (!name.trim()) { Alert.alert("입력 오류", "업체명을 입력해주세요."); return; }
      if (!phone.trim()) { Alert.alert("입력 오류", "전화번호를 입력해주세요."); return; }
      if (!address.trim()) { Alert.alert("입력 오류", "주소를 입력해주세요."); return; }
    }
    setStep((s) => (s + 1) as typeof step);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>파트너 등록 신청</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 진행 단계 바 */}
      <View style={styles.stepBar}>
        {STEP_LABELS.map((label, idx) => {
          const s = idx + 1;
          const isActive = step >= s;
          const isCurrent = step === s;
          return (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isCurrent && styles.stepCircleCurrent]}>
                {step > s ? (
                  <Text style={styles.stepCheckText}>✓</Text>
                ) : (
                  <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>{s}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isCurrent && styles.stepLabelCurrent]}>
                {label}
              </Text>
              {s < STEP_LABELS.length && (
                <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
              )}
            </View>
          );
        })}
      </View>

      {/* ── 단계 1: 업종 선택 ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>어떤 업종으로 등록하시겠어요?</Text>
          <Text style={styles.sectionDesc}>사고 발생 시 매칭되는 전문 분야를 선택하세요.</Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.categoryCard, selectedCategory === cat && styles.categoryCardActive]}
                onPress={() => { setSelectedCategory(cat); initPricing(cat); }}
              >
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryName, selectedCategory === cat && styles.categoryNameActive]}>
                    {cat}
                  </Text>
                  <Text style={[styles.categoryDesc, selectedCategory === cat && styles.categoryDescActive]}>
                    {CATEGORY_DESC[cat]}
                  </Text>
                </View>
                {selectedCategory === cat && (
                  <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.nextBtn, !selectedCategory && styles.nextBtnDisabled]}
            onPress={goNext}
            disabled={!selectedCategory}
          >
            <Text style={styles.nextBtnText}>다음 단계 →</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── 단계 2: 기본 정보 ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>업체 기본 정보</Text>
          <Text style={styles.sectionDesc}>
            {selectedCategory && `${CATEGORY_ICONS[selectedCategory]} ${selectedCategory}`} 업체로 등록됩니다.
          </Text>

          {/* 업체명 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>업체명 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 강남 스피드 공업사"
              placeholderTextColor="#A0AEC0"
              returnKeyType="next"
            />
          </View>

          {/* 전화번호 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>대표 전화번호 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="예: 02-1234-5678"
              keyboardType="phone-pad"
              placeholderTextColor="#A0AEC0"
              returnKeyType="next"
            />
          </View>

          {/* 주소 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>주소 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="예: 서울시 강남구 테헤란로 123"
              placeholderTextColor="#A0AEC0"
              returnKeyType="next"
            />
          </View>

          {/* 업체 소개 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>업체 소개</Text>
            <Text style={styles.inputHint}>전문 분야, 보유 장비, 경력 등을 자유롭게 작성해주세요</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="예: 20년 경력의 판금 도색 전문점으로, 최신 독일산 도색 장비를 보유하고 있습니다. 보험 수리 전문이며 렌터카 연계 서비스도 제공합니다."
              multiline
              numberOfLines={5}
              placeholderTextColor="#A0AEC0"
              textAlignVertical="top"
            />
          </View>

          {/* 웹사이트 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>웹사이트 / SNS</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="예: https://www.mygarage.co.kr"
              keyboardType="url"
              autoCapitalize="none"
              placeholderTextColor="#A0AEC0"
              returnKeyType="done"
            />
          </View>

          {/* 주차 가능 여부 */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>주차 가능</Text>
              <Text style={styles.switchDesc}>고객 차량 주차 공간 제공 여부</Text>
            </View>
            <Switch
              value={parkingAvailable}
              onValueChange={setParkingAvailable}
              trackColor={{ false: "#CBD5E0", true: "#3182CE" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>다음: 운영 시간 →</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── 단계 3: 운영 시간 ─────────────────────────────────────────────────── */}
      {step === 3 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>운영 시간 설정</Text>
          <Text style={styles.sectionDesc}>요일별 운영 시간을 설정해주세요.</Text>

          {/* 평일 일괄 적용 */}
          <View style={styles.bulkApplyCard}>
            <Text style={styles.bulkApplyTitle}>⚡ 평일 일괄 적용</Text>
            <View style={styles.bulkApplyRow}>
              <TextInput
                style={[styles.timeInput, { flex: 1 }]}
                defaultValue="09:00"
                placeholder="09:00"
                placeholderTextColor="#A0AEC0"
                onEndEditing={(e) => applyAllWeekdays(e.nativeEvent.text, businessHours.mon.close)}
              />
              <Text style={styles.timeSeparator}>~</Text>
              <TextInput
                style={[styles.timeInput, { flex: 1 }]}
                defaultValue="18:00"
                placeholder="18:00"
                placeholderTextColor="#A0AEC0"
                onEndEditing={(e) => applyAllWeekdays(businessHours.mon.open, e.nativeEvent.text)}
              />
              <Pressable
                style={styles.bulkApplyBtn}
                onPress={() => applyAllWeekdays(businessHours.mon.open, businessHours.mon.close)}
              >
                <Text style={styles.bulkApplyBtnText}>적용</Text>
              </Pressable>
            </View>
          </View>

          {/* 요일별 설정 */}
          {DAYS.map((day) => {
            const h = businessHours[day];
            const isWeekend = day === "sat" || day === "sun";
            return (
              <View key={day} style={[styles.dayRow, isWeekend && styles.dayRowWeekend]}>
                <View style={styles.dayLabelCol}>
                  <Text style={[styles.dayLabel, isWeekend && styles.dayLabelWeekend]}>
                    {DAY_LABELS[day]}
                  </Text>
                  {h.closed && <Text style={styles.closedBadge}>휴무</Text>}
                </View>

                {h.closed ? (
                  <View style={styles.closedRow}>
                    <Text style={styles.closedText}>정기 휴무일</Text>
                  </View>
                ) : (
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      value={h.open}
                      onChangeText={(v) => updateHours(day, "open", v)}
                      placeholder="09:00"
                      placeholderTextColor="#A0AEC0"
                      keyboardType="numbers-and-punctuation"
                    />
                    <Text style={styles.timeSeparator}>~</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={h.close}
                      onChangeText={(v) => updateHours(day, "close", v)}
                      placeholder="18:00"
                      placeholderTextColor="#A0AEC0"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                )}

                <Switch
                  value={h.closed}
                  onValueChange={(v) => updateHours(day, "closed", v)}
                  trackColor={{ false: "#CBD5E0", true: "#E53E3E" }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>
            );
          })}

          {/* 공휴일 안내 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              💡 공휴일 운영 여부는 업체 소개란에 별도 기재해주세요.
            </Text>
          </View>

          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>다음: 사진 & 금액 →</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── 단계 4: 사진 & 금액 ───────────────────────────────────────────────── */}
      {step === 4 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>대표 사진 & 서비스 금액</Text>
          <Text style={styles.sectionDesc}>사진과 금액 정보는 고객의 선택에 큰 영향을 줍니다.</Text>

          {/* ── 대표 사진 ── */}
          <View style={styles.photoSection}>
            <View style={styles.photoHeader}>
              <Text style={styles.photoTitle}>대표 사진</Text>
              <Text style={styles.photoCount}>
                <Text style={[styles.photoCountNum, photos.length < 3 && styles.photoCountNumWarn]}>
                  {photos.length}
                </Text>
                /8장 (최소 3장 필수)
              </Text>
            </View>

            <View style={styles.photoGrid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoThumbImg} />
                  {idx === 0 && (
                    <View style={styles.photoMainBadge}>
                      <Text style={styles.photoMainBadgeText}>대표</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.photoDeleteBtn}
                    onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Text style={styles.photoDeleteText}>✕</Text>
                  </Pressable>
                </View>
              ))}

              {photos.length < 8 && (
                <Pressable style={styles.photoAddBtn} onPress={handlePickPhoto}>
                  <Text style={styles.photoAddIcon}>📷</Text>
                  <Text style={styles.photoAddText}>사진 추가</Text>
                </Pressable>
              )}
            </View>

            {photos.length < 3 && (
              <View style={styles.photoWarnBox}>
                <Text style={styles.photoWarnText}>
                  ⚠️ 최소 3장 이상 등록해야 신청이 완료됩니다.
                </Text>
              </View>
            )}

            <View style={styles.photoTipBox}>
              <Text style={styles.photoTipTitle}>📸 좋은 사진 촬영 팁</Text>
              <Text style={styles.photoTipText}>• 업체 외관 전경 (낮 시간대 촬영 권장)</Text>
              <Text style={styles.photoTipText}>• 내부 작업 공간 또는 진료실</Text>
              <Text style={styles.photoTipText}>• 보유 장비 또는 시설</Text>
              <Text style={styles.photoTipText}>• 완료된 작업 사례 (전/후 비교)</Text>
            </View>
          </View>

          {/* ── 서비스 금액표 ── */}
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>서비스 금액표</Text>
            <Text style={styles.pricingDesc}>
              대략적인 금액을 입력해주세요. 실제 금액은 상황에 따라 다를 수 있습니다.
            </Text>

            {pricing.map((item, idx) => (
              <View key={idx} style={styles.pricingRow}>
                <View style={styles.pricingNameCol}>
                  <Text style={styles.pricingName}>{item.name}</Text>
                  <Text style={styles.pricingUnit}>/ {item.unit}</Text>
                </View>
                <View style={styles.pricingInputCol}>
                  <TextInput
                    style={styles.pricingInput}
                    value={item.price}
                    onChangeText={(v) => {
                      const next = [...pricing];
                      next[idx] = { ...next[idx], price: v };
                      setPricing(next);
                    }}
                    placeholder="금액 입력"
                    keyboardType="numeric"
                    placeholderTextColor="#A0AEC0"
                  />
                  <Text style={styles.pricingWon}>원</Text>
                </View>
              </View>
            ))}

            {/* 항목 추가 버튼 */}
            <Pressable
              style={styles.addPricingBtn}
              onPress={() => setPricing((prev) => [...prev, { name: "", price: "", unit: "건", desc: "" }])}
            >
              <Text style={styles.addPricingBtnText}>+ 항목 추가</Text>
            </Pressable>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                💡 금액 미입력 항목은 표시되지 않습니다. 협의 가능한 항목은 비워두세요.
              </Text>
            </View>
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
            style={[styles.nextBtn, (registerMutation.isPending || !agreed) && styles.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={registerMutation.isPending || !agreed}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>🚀 등록 신청 완료</Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      {/* ── 단계 5: 완료 ─────────────────────────────────────────────────────── */}
      {step === 5 && (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>등록 신청 완료!</Text>
          <View style={styles.successInfoCard}>
            <Text style={styles.successInfoRow}>
              {selectedCategory && `${CATEGORY_ICONS[selectedCategory]} `}
              <Text style={styles.successInfoBold}>{name}</Text>
            </Text>
            <Text style={styles.successInfoRow}>📍 {address}</Text>
            <Text style={styles.successInfoRow}>📞 {phone}</Text>
            <Text style={styles.successInfoRow}>📸 대표 사진 {photos.length}장 등록</Text>
          </View>
          <Text style={styles.successDesc}>
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

// ─── 스타일 ───────────────────────────────────────────────────────────────────
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

  // 진행 단계 바
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 0,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: "#BEE3F8" },
  stepCircleCurrent: { backgroundColor: "#3182CE" },
  stepCheckText: { fontSize: 11, fontWeight: "800", color: "#2B6CB0" },
  stepNum: { fontSize: 11, fontWeight: "700", color: "#A0AEC0" },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 10, color: "#A0AEC0", fontWeight: "500", marginLeft: 4 },
  stepLabelActive: { color: "#4A90D9" },
  stepLabelCurrent: { color: "#3182CE", fontWeight: "700" },
  stepLine: { width: 20, height: 2, backgroundColor: "#E2E8F0", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: "#3182CE" },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1A202C" },
  sectionDesc: { fontSize: 14, color: "#718096", marginTop: -8 },

  // 업종 선택
  categoryGrid: { gap: 10 },
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
  categoryName: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  categoryNameActive: { color: "#3182CE" },
  categoryDesc: { fontSize: 12, color: "#718096", marginTop: 2 },
  categoryDescActive: { color: "#2B6CB0" },
  checkBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#3182CE", alignItems: "center", justifyContent: "center",
  },
  checkText: { fontSize: 14, color: "#fff", fontWeight: "700" },

  // 폼
  formGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#4A5568" },
  required: { color: "#E53E3E" },
  inputHint: { fontSize: 12, color: "#A0AEC0", marginTop: -4 },
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
  inputMulti: { minHeight: 110, textAlignVertical: "top" },

  // 스위치 행
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  switchLabel: { fontSize: 14, fontWeight: "600", color: "#4A5568" },
  switchDesc: { fontSize: 12, color: "#A0AEC0", marginTop: 2 },

  // 운영시간
  bulkApplyCard: {
    backgroundColor: "#EBF8FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BEE3F8",
    gap: 10,
  },
  bulkApplyTitle: { fontSize: 13, fontWeight: "700", color: "#2B6CB0" },
  bulkApplyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bulkApplyBtn: {
    backgroundColor: "#3182CE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkApplyBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  dayRowWeekend: { backgroundColor: "#FFFAF0", borderColor: "#FEEBC8" },
  dayLabelCol: { width: 36, alignItems: "center", gap: 2 },
  dayLabel: { fontSize: 15, fontWeight: "700", color: "#4A5568" },
  dayLabelWeekend: { color: "#C05621" },
  closedBadge: {
    fontSize: 9, fontWeight: "700", color: "#E53E3E",
    backgroundColor: "#FFF5F5", borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  timeRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  closedRow: { flex: 1, alignItems: "center" },
  closedText: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic" },
  timeInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: "#1A202C",
    backgroundColor: "#F7FAFC",
    textAlign: "center",
    width: 70,
  },
  timeSeparator: { fontSize: 16, color: "#A0AEC0", fontWeight: "600" },
  infoBox: {
    backgroundColor: "#EBF8FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BEE3F8",
  },
  infoBoxText: { fontSize: 12, color: "#2B6CB0", lineHeight: 18 },

  // 사진
  photoSection: { gap: 12 },
  photoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  photoTitle: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  photoCount: { fontSize: 13, color: "#718096" },
  photoCountNum: { fontWeight: "800", color: "#3182CE" },
  photoCountNumWarn: { color: "#E53E3E" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumb: {
    width: 100, height: 100, borderRadius: 10,
    overflow: "hidden", position: "relative",
  },
  photoThumbImg: { width: "100%", height: "100%" },
  photoMainBadge: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(49,130,206,0.85)",
    paddingVertical: 3, alignItems: "center",
  },
  photoMainBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  photoDeleteBtn: {
    position: "absolute", top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  photoDeleteText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  photoAddBtn: {
    width: 100, height: 100, borderRadius: 10,
    borderWidth: 2, borderColor: "#CBD5E0", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
    backgroundColor: "#F7FAFC",
  },
  photoAddIcon: { fontSize: 24 },
  photoAddText: { fontSize: 11, color: "#718096", fontWeight: "600" },
  photoWarnBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  photoWarnText: { fontSize: 12, color: "#C53030", lineHeight: 18 },
  photoTipBox: {
    backgroundColor: "#F0FFF4",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C6F6D5",
    gap: 4,
  },
  photoTipTitle: { fontSize: 13, fontWeight: "700", color: "#276749", marginBottom: 4 },
  photoTipText: { fontSize: 12, color: "#2F855A", lineHeight: 20 },

  // 금액표
  pricingSection: { gap: 12 },
  pricingTitle: { fontSize: 16, fontWeight: "700", color: "#1A202C" },
  pricingDesc: { fontSize: 13, color: "#718096", marginTop: -6 },
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  pricingNameCol: { flex: 1.2, gap: 2 },
  pricingName: { fontSize: 13, fontWeight: "600", color: "#4A5568" },
  pricingUnit: { fontSize: 11, color: "#A0AEC0" },
  pricingInputCol: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  pricingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1A202C",
    backgroundColor: "#F7FAFC",
    textAlign: "right",
  },
  pricingWon: { fontSize: 14, color: "#4A5568", fontWeight: "600" },
  addPricingBtn: {
    borderWidth: 1.5,
    borderColor: "#3182CE",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  addPricingBtnText: { fontSize: 14, color: "#3182CE", fontWeight: "700" },

  // 약관
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
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: "#CBD5E0",
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  checkboxChecked: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  checkboxCheck: { fontSize: 13, color: "#fff", fontWeight: "700" },
  agreeText: { flex: 1, fontSize: 13, color: "#4A5568", lineHeight: 20 },
  agreeLink: { color: "#3182CE", textDecorationLine: "underline" },

  // 버튼
  nextBtn: {
    backgroundColor: "#3182CE",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  nextBtnDisabled: { backgroundColor: "#A0AEC0" },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // 완료
  successContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: 32, gap: 16,
  },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#1A202C" },
  successInfoCard: {
    backgroundColor: "#EBF8FF",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: "#BEE3F8",
  },
  successInfoRow: { fontSize: 14, color: "#2B6CB0", lineHeight: 22 },
  successInfoBold: { fontWeight: "700" },
  successDesc: { fontSize: 14, color: "#4A5568", textAlign: "center", lineHeight: 22 },
  doneBtn: {
    backgroundColor: "#3182CE",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
