import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Animated,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";

// ─── 타입 ──────────────────────────────────────────────────
type Guardian = {
  id: string;
  name: string;
  phone: string;
  relation: "가족" | "연인" | "친구" | "기타";
  notify: boolean;
};

type AlertMode = "standby" | "sos_holding" | "sos_active" | "accident_detected";

const RELATION_OPTIONS: Guardian["relation"][] = ["가족", "연인", "친구", "기타"];
const RELATION_COLORS: Record<Guardian["relation"], string> = {
  가족: "#E53E3E",
  연인: "#D53F8C",
  친구: "#3182CE",
  기타: "#718096",
};

// ─── 메인 컴포넌트 ─────────────────────────────────────────
export default function GuardianScreen() {
  const [mode, setMode] = useState<AlertMode>("standby");
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState<Guardian["relation"]>("가족");
  const [sosCountdown, setSosCountdown] = useState(3);
  const [shieldActive, setShieldActive] = useState(true);
  const [accidentSensitivity, setAccidentSensitivity] = useState<"high" | "medium" | "low">("medium");

  // 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sosHoldProgress = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 펄스 애니메이션 (대기 중)
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // AsyncStorage에서 보호자 로드
  useEffect(() => {
    AsyncStorage.getItem("guardians").then((raw) => {
      if (raw) setGuardians(JSON.parse(raw));
    });
  }, []);

  const saveGuardians = async (list: Guardian[]) => {
    setGuardians(list);
    await AsyncStorage.setItem("guardians", JSON.stringify(list));
  };

  const addGuardian = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("입력 오류", "이름과 연락처를 입력해주세요.");
      return;
    }
    const newG: Guardian = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      relation: newRelation,
      notify: true,
    };
    await saveGuardians([...guardians, newG]);
    setNewName(""); setNewPhone(""); setNewRelation("가족");
    setShowAddForm(false);
  };

  const removeGuardian = async (id: string) => {
    await saveGuardians(guardians.filter((g) => g.id !== id));
  };

  const toggleNotify = async (id: string) => {
    await saveGuardians(guardians.map((g) => g.id === id ? { ...g, notify: !g.notify } : g));
  };

  // ─── SOS 버튼 길게 누르기 ────────────────────────────────
  const startSosHold = useCallback(() => {
    if (mode !== "standby") return;
    setMode("sos_holding");
    setSosCountdown(3);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.timing(sosHoldProgress, { toValue: 1, duration: 3000, useNativeDriver: false }).start();

    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setSosCountdown(count);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        activateSOS();
      }
    }, 1000);
  }, [mode]);

  const cancelSosHold = useCallback(() => {
    if (mode !== "sos_holding") return;
    clearInterval(countdownRef.current!);
    sosHoldProgress.stopAnimation();
    sosHoldProgress.setValue(0);
    setMode("standby");
    setSosCountdown(3);
  }, [mode]);

  const activateSOS = () => {
    sosHoldProgress.setValue(0);
    setMode("sos_active");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate([0, 500, 200, 500]);
    }
    // 실제 구현: 보호자에게 SMS/푸시 발송 + 위치 공유
    Alert.alert(
      "🚨 SOS 발송 완료",
      `${guardians.filter(g => g.notify).length}명의 보호자에게 현재 위치와 함께 긴급 알림을 발송했습니다.`,
      [{ text: "확인", onPress: () => setMode("standby") }]
    );
  };

  const cancelSOS = () => {
    setMode("standby");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── 사고 감지 시뮬레이션 ───────────────────────────────
  const simulateAccident = () => {
    setMode("accident_detected");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Vibration.vibrate([0, 300, 100, 300, 100, 300]);
    }
  };

  const confirmAccident = () => {
    setMode("sos_active");
    activateSOS();
  };

  const dismissAccident = () => {
    setMode("standby");
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  // ─── 사고 감지 팝업 ─────────────────────────────────────
  if (mode === "accident_detected") {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.accidentOverlay}>
          <View style={styles.accidentCard}>
            <Text style={styles.accidentIcon}>⚠️</Text>
            <Text style={styles.accidentTitle}>충격이 감지되었습니다</Text>
            <Text style={styles.accidentDesc}>
              강한 충격이 감지되었습니다.{"\n"}교통사고가 발생했나요?
            </Text>
            <Text style={styles.accidentTimer}>10초 후 자동으로 보호자에게 알림이 발송됩니다</Text>
            <View style={styles.accidentBtnRow}>
              <Pressable style={styles.accidentBtnYes} onPress={confirmAccident}>
                <Text style={styles.accidentBtnYesText}>🚨 사고 발생</Text>
              </Pressable>
              <Pressable style={styles.accidentBtnNo} onPress={dismissAccident}>
                <Text style={styles.accidentBtnNoText}>✓ 괜찮아요</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🛡️ 가디언</Text>
            <Text style={styles.headerSub}>가족·연인 긴급 알림 & 호신벨</Text>
          </View>
          <View style={[styles.shieldBadge, { backgroundColor: shieldActive ? "#F0FFF4" : "#FFF5F5" }]}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: shieldActive ? "#38A169" : "#E53E3E" }}>
              {shieldActive ? "🟢 보호 중" : "🔴 비활성"}
            </Text>
          </View>
        </View>

        {/* SOS 버튼 */}
        <View style={styles.sosSection}>
          <Text style={styles.sosSectionLabel}>
            {mode === "standby" ? "3초 길게 누르면 SOS 발송" :
             mode === "sos_holding" ? `${sosCountdown}초 후 발송...` :
             "SOS 발송 완료"}
          </Text>

          <Animated.View style={{ transform: [{ scale: mode === "standby" ? pulseAnim : 1 }] }}>
            <Pressable
              onPressIn={startSosHold}
              onPressOut={cancelSosHold}
              style={[
                styles.sosBtn,
                mode === "sos_holding" && styles.sosBtnHolding,
                mode === "sos_active" && styles.sosBtnActive,
              ]}
            >
              {mode === "sos_holding" ? (
                <>
                  <Text style={styles.sosBtnCountdown}>{sosCountdown}</Text>
                  <Text style={styles.sosBtnLabel}>발송 중...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.sosBtnIcon}>🆘</Text>
                  <Text style={styles.sosBtnLabel}>SOS</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* 홀드 진행바 */}
          {mode === "sos_holding" && (
            <View style={styles.holdProgressBg}>
              <Animated.View
                style={[
                  styles.holdProgressFill,
                  { width: sosHoldProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                ]}
              />
            </View>
          )}

          <Text style={styles.sosCancelHint}>
            {mode === "sos_holding" ? "손을 떼면 취소됩니다" : "보호자에게 위치와 함께 즉시 알림 발송"}
          </Text>
        </View>

        {/* 상시 보호 모드 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>상시 보호 모드</Text>
          </View>

          <View style={styles.shieldCard}>
            <View style={styles.shieldCardRow}>
              <View>
                <Text style={styles.shieldCardTitle}>충격 자동 감지</Text>
                <Text style={styles.shieldCardDesc}>
                  가속도 센서로 강한 충격 감지 시{"\n"}자동으로 보호자에게 알림 발송
                </Text>
              </View>
              <Pressable
                style={[styles.toggle, shieldActive && styles.toggleActive]}
                onPress={() => {
                  setShieldActive((v) => !v);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <View style={[styles.toggleThumb, shieldActive && styles.toggleThumbActive]} />
              </Pressable>
            </View>

            {shieldActive && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sensitivityLabel}>감지 민감도</Text>
                <View style={styles.sensitivityRow}>
                  {(["low", "medium", "high"] as const).map((s) => (
                    <Pressable
                      key={s}
                      style={[styles.sensitivityBtn, accidentSensitivity === s && styles.sensitivityBtnActive]}
                      onPress={() => setAccidentSensitivity(s)}
                    >
                      <Text style={[styles.sensitivityBtnText, accidentSensitivity === s && styles.sensitivityBtnTextActive]}>
                        {s === "low" ? "낮음" : s === "medium" ? "보통" : "높음"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* 테스트 버튼 */}
                <Pressable style={styles.testBtn} onPress={simulateAccident}>
                  <Text style={styles.testBtnText}>⚡ 충격 감지 테스트</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* 보호자 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>보호자 목록 ({guardians.length}명)</Text>
            <Pressable style={styles.addBtn} onPress={() => setShowAddForm((v) => !v)}>
              <Text style={styles.addBtnText}>+ 추가</Text>
            </Pressable>
          </View>

          {/* 추가 폼 */}
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.addFormTitle}>보호자 추가</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="이름"
                placeholderTextColor="#A0AEC0"
              />
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={(t) => setNewPhone(formatPhone(t))}
                placeholder="010-0000-0000"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                maxLength={13}
              />
              <View style={styles.relationRow}>
                {RELATION_OPTIONS.map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.relationBtn, newRelation === r && { backgroundColor: RELATION_COLORS[r], borderColor: RELATION_COLORS[r] }]}
                    onPress={() => setNewRelation(r)}
                  >
                    <Text style={[styles.relationBtnText, newRelation === r && { color: "#FFFFFF" }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.addFormBtnRow}>
                <Pressable style={styles.addFormCancelBtn} onPress={() => setShowAddForm(false)}>
                  <Text style={styles.addFormCancelText}>취소</Text>
                </Pressable>
                <Pressable style={styles.addFormSaveBtn} onPress={addGuardian}>
                  <Text style={styles.addFormSaveText}>저장</Text>
                </Pressable>
              </View>
            </View>
          )}

          {guardians.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>보호자를 추가하면{"\n"}긴급 상황 시 자동으로 알림이 발송됩니다</Text>
            </View>
          ) : (
            guardians.map((g) => (
              <View key={g.id} style={styles.guardianCard}>
                <View style={[styles.relationTag, { backgroundColor: RELATION_COLORS[g.relation] + "20" }]}>
                  <Text style={[styles.relationTagText, { color: RELATION_COLORS[g.relation] }]}>{g.relation}</Text>
                </View>
                <View style={styles.guardianInfo}>
                  <Text style={styles.guardianName}>{g.name}</Text>
                  <Text style={styles.guardianPhone}>{g.phone}</Text>
                </View>
                <View style={styles.guardianActions}>
                  <Pressable
                    style={[styles.notifyToggle, g.notify && styles.notifyToggleActive]}
                    onPress={() => toggleNotify(g.id)}
                  >
                    <Text style={{ fontSize: 10, color: g.notify ? "#38A169" : "#A0AEC0", fontWeight: "700" }}>
                      {g.notify ? "알림 ON" : "알림 OFF"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => removeGuardian(g.id)} style={styles.deleteBtn}>
                    <Text style={{ color: "#E53E3E", fontSize: 16 }}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 사용 안내 */}
        <View style={styles.section}>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>💡 가디언 사용 방법</Text>
            {[
              { icon: "1️⃣", text: "보호자(가족·연인)를 등록하세요" },
              { icon: "2️⃣", text: "상시 보호 모드를 켜두면 충격 감지 시 자동 알림" },
              { icon: "3️⃣", text: "위험 상황에서 SOS 버튼을 3초 누르면 즉시 발송" },
              { icon: "4️⃣", text: "사고 발생 시 사고케어 앱으로 바로 연결됩니다" },
            ].map((item) => (
              <View key={item.icon} style={styles.guideRow}>
                <Text style={styles.guideRowIcon}>{item.icon}</Text>
                <Text style={styles.guideRowText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── 스타일 ───────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1A2B4C" },
  headerSub: { fontSize: 12, color: "#718096", marginTop: 2 },
  shieldBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },

  // SOS
  sosSection: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 },
  sosSectionLabel: { fontSize: 13, color: "#718096", marginBottom: 20, fontWeight: "600" },
  sosBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "#E53E3E",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#E53E3E", shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  sosBtnHolding: { backgroundColor: "#C53030" },
  sosBtnActive: { backgroundColor: "#38A169" },
  sosBtnIcon: { fontSize: 48 },
  sosBtnLabel: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginTop: 4 },
  sosBtnCountdown: { fontSize: 56, fontWeight: "900", color: "#FFFFFF" },
  holdProgressBg: { width: 200, height: 6, backgroundColor: "#FED7D7", borderRadius: 3, marginTop: 20, overflow: "hidden" },
  holdProgressFill: { height: "100%", backgroundColor: "#E53E3E", borderRadius: 3 },
  sosCancelHint: { fontSize: 12, color: "#A0AEC0", marginTop: 12, textAlign: "center" },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4C" },
  addBtn: { backgroundColor: "#1A2B4C", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  // Shield Card
  shieldCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  shieldCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shieldCardTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 },
  shieldCardDesc: { fontSize: 12, color: "#718096", lineHeight: 18 },
  toggle: {
    width: 50, height: 28, borderRadius: 14,
    backgroundColor: "#E2E8F0", justifyContent: "center", paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: "#38A169" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFFFFF" },
  toggleThumbActive: { transform: [{ translateX: 22 }] },
  divider: { height: 1, backgroundColor: "#F7FAFC", marginVertical: 12 },
  sensitivityLabel: { fontSize: 12, color: "#718096", marginBottom: 8, fontWeight: "600" },
  sensitivityRow: { flexDirection: "row", gap: 8 },
  sensitivityBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "#E2E8F0",
    alignItems: "center", backgroundColor: "#F7FAFC",
  },
  sensitivityBtnActive: { backgroundColor: "#1A2B4C", borderColor: "#1A2B4C" },
  sensitivityBtnText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  sensitivityBtnTextActive: { color: "#FFFFFF" },
  testBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 8,
    backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FEB2B2",
    alignItems: "center",
  },
  testBtnText: { fontSize: 13, color: "#E53E3E", fontWeight: "700" },

  // Add Form
  addForm: {
    backgroundColor: "#F7FAFC", borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0", gap: 10,
  },
  addFormTitle: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  input: {
    borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#1A2B4C", backgroundColor: "#FFFFFF",
  },
  relationRow: { flexDirection: "row", gap: 8 },
  relationBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center",
  },
  relationBtnText: { fontSize: 12, fontWeight: "700", color: "#718096" },
  addFormBtnRow: { flexDirection: "row", gap: 8 },
  addFormCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  addFormCancelText: { fontSize: 14, color: "#718096", fontWeight: "600" },
  addFormSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#1A2B4C", alignItems: "center" },
  addFormSaveText: { fontSize: 14, color: "#FFFFFF", fontWeight: "700" },

  // Guardian Card
  guardianCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: "#E2E8F0",
  },
  relationTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  relationTagText: { fontSize: 11, fontWeight: "700" },
  guardianInfo: { flex: 1 },
  guardianName: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  guardianPhone: { fontSize: 12, color: "#718096", marginTop: 2 },
  guardianActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  notifyToggle: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F7FAFC",
  },
  notifyToggleActive: { borderColor: "#38A169", backgroundColor: "#F0FFF4" },
  deleteBtn: { padding: 4 },

  // Empty
  emptyBox: {
    alignItems: "center", paddingVertical: 32,
    backgroundColor: "#F7FAFC", borderRadius: 12,
    borderWidth: 1, borderColor: "#E2E8F0", borderStyle: "dashed",
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 13, color: "#A0AEC0", textAlign: "center", lineHeight: 20 },

  // Guide
  guideCard: {
    backgroundColor: "#EBF8FF", borderRadius: 12, padding: 16, gap: 10,
  },
  guideTitle: { fontSize: 14, fontWeight: "700", color: "#2B6CB0", marginBottom: 4 },
  guideRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  guideRowIcon: { fontSize: 16 },
  guideRowText: { flex: 1, fontSize: 13, color: "#2D3748", lineHeight: 20 },

  // Accident Overlay
  accidentOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  accidentCard: {
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 28,
    alignItems: "center", width: "100%", maxWidth: 360,
  },
  accidentIcon: { fontSize: 56, marginBottom: 16 },
  accidentTitle: { fontSize: 22, fontWeight: "800", color: "#1A2B4C", marginBottom: 8 },
  accidentDesc: { fontSize: 15, color: "#718096", textAlign: "center", lineHeight: 24, marginBottom: 12 },
  accidentTimer: { fontSize: 12, color: "#E53E3E", fontWeight: "600", marginBottom: 24, textAlign: "center" },
  accidentBtnRow: { flexDirection: "row", gap: 12, width: "100%" },
  accidentBtnYes: {
    flex: 1, backgroundColor: "#E53E3E", borderRadius: 12, paddingVertical: 16, alignItems: "center",
  },
  accidentBtnYesText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  accidentBtnNo: {
    flex: 1, backgroundColor: "#F0FFF4", borderRadius: 12, paddingVertical: 16,
    alignItems: "center", borderWidth: 1.5, borderColor: "#38A169",
  },
  accidentBtnNoText: { color: "#38A169", fontSize: 15, fontWeight: "800" },
});
