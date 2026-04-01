import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Animated,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GuardianStore, Guardian, GuardianRelation } from "@/lib/guardian-store";

const RELATIONS: GuardianRelation[] = ["연인", "배우자", "부모", "자녀", "친구", "직장동료"];

const RELATION_COLORS: Record<GuardianRelation, string> = {
  연인: "#E53E3E",
  배우자: "#DD6B20",
  부모: "#805AD5",
  자녀: "#38A169",
  친구: "#3182CE",
  직장동료: "#718096",
};

const RELATION_ICONS: Record<GuardianRelation, "heart.fill" | "person.fill" | "person.2.fill"> = {
  연인: "heart.fill",
  배우자: "heart.fill",
  부모: "person.fill",
  자녀: "person.fill",
  친구: "person.2.fill",
  직장동료: "person.2.fill",
};

// SOS 카운트다운 모달
function SosCountdownModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [count, setCount] = useState(30);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      setCount(30);
      return;
    }
    setCount(30);
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(interval);
      pulse.stop();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={sosStyles.overlay}>
        <View style={sosStyles.container}>
          <Animated.View style={[sosStyles.countCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={sosStyles.countNumber}>{count}</Text>
            <Text style={sosStyles.countLabel}>초 후 발송</Text>
          </Animated.View>
          <Text style={sosStyles.title}>사고가 감지되었습니다</Text>
          <Text style={sosStyles.subtitle}>
            {count}초 안에 취소하지 않으면{"\n"}가디언에게 SOS 알림이 발송됩니다
          </Text>
          <Pressable
            style={({ pressed }) => [sosStyles.cancelBtn, pressed && { opacity: 0.8 }]}
            onPress={onCancel}
          >
            <Text style={sosStyles.cancelBtnText}>괜찮아요, 취소할게요</Text>
          </Pressable>
          <Text style={sosStyles.hint}>실제 사고라면 그냥 두세요. 자동으로 발송됩니다.</Text>
        </View>
      </View>
    </Modal>
  );
}

// 가디언 추가 모달
function AddGuardianModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (g: Omit<Guardian, "id" | "addedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState<GuardianRelation>("친구");

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("입력 오류", "이름과 전화번호를 입력해주세요.");
      return;
    }
    onAdd({ name: name.trim(), phone: phone.trim(), relation, hasApp: false });
    setName("");
    setPhone("");
    setRelation("친구");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={addStyles.overlay}>
        <View style={addStyles.sheet}>
          <View style={addStyles.handle} />
          <Text style={addStyles.title}>가디언 추가</Text>
          <Text style={addStyles.subtitle}>사고 발생 시 즉시 알림을 받을 사람을 등록하세요</Text>

          <Text style={addStyles.label}>이름</Text>
          <TextInput
            style={addStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor="#A0AEC0"
          />

          <Text style={addStyles.label}>전화번호</Text>
          <TextInput
            style={addStyles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="010-0000-0000"
            placeholderTextColor="#A0AEC0"
            keyboardType="phone-pad"
          />

          <Text style={addStyles.label}>관계</Text>
          <View style={addStyles.relationGrid}>
            {RELATIONS.map((r) => (
              <Pressable
                key={r}
                style={[
                  addStyles.relationChip,
                  relation === r && { backgroundColor: RELATION_COLORS[r], borderColor: RELATION_COLORS[r] },
                ]}
                onPress={() => setRelation(r)}
              >
                <Text style={[addStyles.relationChipText, relation === r && { color: "#FFFFFF" }]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={addStyles.btnRow}>
            <Pressable
              style={({ pressed }) => [addStyles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
            >
              <Text style={addStyles.cancelBtnText}>취소</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [addStyles.addBtn, pressed && { opacity: 0.85 }]}
              onPress={handleAdd}
            >
              <Text style={addStyles.addBtnText}>등록하기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GuardianTabScreen() {
  const router = useRouter();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [sosConfirmed, setSosConfirmed] = useState(false);

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = async () => {
    const list = await GuardianStore.getAll();
    setGuardians(list);
  };

  const handleAdd = async (g: Omit<Guardian, "id" | "addedAt">) => {
    await GuardianStore.add(g);
    await loadGuardians();
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemove = (guardian: Guardian) => {
    Alert.alert(
      "가디언 삭제",
      `${guardian.name}님을 가디언 목록에서 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await GuardianStore.remove(guardian.id);
            await loadGuardians();
          },
        },
      ]
    );
  };

  const handleSosTrigger = () => {
    if (guardians.length === 0) {
      Alert.alert("가디언 없음", "먼저 가디언을 등록해주세요.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setShowSos(true);
    setSosConfirmed(false);
  };

  const handleSosCancel = () => {
    setShowSos(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSosConfirm = async () => {
    setShowSos(false);
    setSosConfirmed(true);
    await GuardianStore.triggerSos("서울시 강남구 테헤란로 123", guardians.map((g) => g.id));
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    Alert.alert(
      "🚨 SOS 발송 완료",
      `${guardians.length}명의 가디언에게 사고 알림이 발송되었습니다.\n\n사고 신고를 계속 진행하시겠습니까?`,
      [
        { text: "나중에", style: "cancel" },
        { text: "사고 신고 시작", onPress: () => router.push("/accident-report" as never) },
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#1A2B4C]">
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>가디언 알림 네트워크</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          onPress={() => setShowAdd(true)}
        >
          <IconSymbol name="person.badge.plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 상태 카드 */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconRow}>
            <View style={styles.infoIconBg}>
              <IconSymbol name="checkmark.shield.fill" size={28} color="#3182CE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>사고 발생 시 즉시 알림</Text>
              <Text style={styles.infoDesc}>
                교통사고가 나면 등록된 가디언에게{"\n"}위치와 상황이 즉시 전달됩니다
              </Text>
            </View>
          </View>
          <View style={styles.infoStats}>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>{guardians.length}</Text>
              <Text style={styles.infoStatLabel}>등록된 가디언</Text>
            </View>
            <View style={styles.infoStatDivider} />
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>5</Text>
              <Text style={styles.infoStatLabel}>최대 등록 가능</Text>
            </View>
            <View style={styles.infoStatDivider} />
            <View style={styles.infoStat}>
              <Text style={[styles.infoStatValue, { color: guardians.length > 0 ? "#38A169" : "#E53E3E" }]}>
                {guardians.length > 0 ? "활성" : "비활성"}
              </Text>
              <Text style={styles.infoStatLabel}>알림 상태</Text>
            </View>
          </View>
        </View>

        {/* 가디언 목록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 가디언 ({guardians.length}/5)</Text>
            {guardians.length < 5 && (
              <Pressable
                style={({ pressed }) => [styles.addChip, pressed && { opacity: 0.7 }]}
                onPress={() => setShowAdd(true)}
              >
                <IconSymbol name="plus.circle.fill" size={14} color="#3182CE" />
                <Text style={styles.addChipText}>추가</Text>
              </Pressable>
            )}
          </View>

          {guardians.length === 0 ? (
            <Pressable
              style={({ pressed }) => [styles.emptyCard, pressed && { opacity: 0.8 }]}
              onPress={() => setShowAdd(true)}
            >
              <IconSymbol name="person.badge.plus" size={36} color="#A0AEC0" />
              <Text style={styles.emptyTitle}>아직 가디언이 없어요</Text>
              <Text style={styles.emptyDesc}>
                가족, 연인, 친구를 등록하면{"\n"}사고 발생 시 즉시 알림이 갑니다
              </Text>
              <View style={styles.emptyAddBtn}>
                <Text style={styles.emptyAddBtnText}>+ 첫 번째 가디언 등록하기</Text>
              </View>
            </Pressable>
          ) : (
            guardians.map((guardian) => (
              <View key={guardian.id} style={styles.guardianCard}>
                <View
                  style={[
                    styles.guardianAvatar,
                    { backgroundColor: RELATION_COLORS[guardian.relation] + "20" },
                  ]}
                >
                  <IconSymbol
                    name={RELATION_ICONS[guardian.relation]}
                    size={22}
                    color={RELATION_COLORS[guardian.relation]}
                  />
                </View>
                <View style={styles.guardianInfo}>
                  <View style={styles.guardianNameRow}>
                    <Text style={styles.guardianName}>{guardian.name}</Text>
                    <View
                      style={[
                        styles.relationBadge,
                        { backgroundColor: RELATION_COLORS[guardian.relation] + "15" },
                      ]}
                    >
                      <Text style={[styles.relationBadgeText, { color: RELATION_COLORS[guardian.relation] }]}>
                        {guardian.relation}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.guardianPhone}>{guardian.phone}</Text>
                  <View style={styles.guardianStatusRow}>
                    <View style={[styles.appStatusDot, { backgroundColor: guardian.hasApp ? "#38A169" : "#A0AEC0" }]} />
                    <Text style={styles.appStatusText}>
                      {guardian.hasApp ? "앱 설치됨 · 푸시 알림" : "앱 미설치 · SMS 발송"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                  onPress={() => handleRemove(guardian)}
                >
                  <IconSymbol name="minus.circle.fill" size={22} color="#FC8181" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* 오탐 방지 시스템 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오탐 방지 시스템</Text>
          <View style={styles.filterCard}>
            {[
              { icon: "location.fill" as const, color: "#3182CE", title: "GPS 속도 필터", desc: "이동 중(15km/h 이상)에만 충격 감지 활성화" },
              { icon: "waveform.path.ecg" as const, color: "#805AD5", title: "복합 센서 융합", desc: "가속도계·자이로스코프·기압계·마이크 동시 판단" },
              { icon: "antenna.radiowaves.left.and.right" as const, color: "#38A169", title: "블루투스 차량 연결", desc: "차량 블루투스 연결 시 감지 신뢰도 가중치 상승" },
              { icon: "clock.fill" as const, color: "#DD6B20", title: "30초 확인 카운트다운", desc: "감지 후 30초간 사용자 직접 취소 가능" },
              { icon: "bell.fill" as const, color: "#E53E3E", title: "2단계 발송", desc: "예비 알림 → 60초 후 정식 SOS 순차 발송" },
            ].map((item, idx) => (
              <View key={idx} style={styles.filterItem}>
                <View style={[styles.filterIcon, { backgroundColor: item.color + "15" }]}>
                  <IconSymbol name={item.icon} size={16} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterTitle}>{item.title}</Text>
                  <Text style={styles.filterDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* SOS 버튼 */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.sosBtn,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
            onPress={handleSosTrigger}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={28} color="#FFFFFF" />
            <View>
              <Text style={styles.sosBtnTitle}>SOS 긴급 알림 발송</Text>
              <Text style={styles.sosBtnSub}>
                {guardians.length > 0
                  ? `${guardians.length}명의 가디언에게 즉시 발송`
                  : "가디언을 먼저 등록해주세요"}
              </Text>
            </View>
          </Pressable>
          {sosConfirmed && (
            <View style={styles.sosConfirmedBanner}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="#38A169" />
              <Text style={styles.sosConfirmedText}>가디언에게 SOS 알림이 발송되었습니다</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddGuardianModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      <SosCountdownModal visible={showSos} onCancel={handleSosCancel} onConfirm={handleSosConfirm} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#1A2B4C",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: "#F7FAFC" },
  scrollContent: { paddingBottom: 40 },
  infoCard: {
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIconRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  infoIconBg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#EBF4FF", alignItems: "center", justifyContent: "center",
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 },
  infoDesc: { fontSize: 13, color: "#718096", lineHeight: 19 },
  infoStats: { flexDirection: "row", backgroundColor: "#F7FAFC", borderRadius: 12, padding: 14 },
  infoStat: { flex: 1, alignItems: "center" },
  infoStatValue: { fontSize: 20, fontWeight: "800", color: "#1A2B4C", marginBottom: 2 },
  infoStatLabel: { fontSize: 11, color: "#718096" },
  infoStatDivider: { width: 1, backgroundColor: "#E2E8F0", marginHorizontal: 8 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A2B4C" },
  addChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EBF4FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  addChipText: { fontSize: 12, color: "#3182CE", fontWeight: "700" },
  emptyCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 32,
    alignItems: "center", gap: 8, borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#4A5568", marginTop: 8 },
  emptyDesc: { fontSize: 13, color: "#A0AEC0", textAlign: "center", lineHeight: 20 },
  emptyAddBtn: { marginTop: 12, backgroundColor: "#3182CE", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyAddBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  guardianCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  guardianAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  guardianInfo: { flex: 1, gap: 3 },
  guardianNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  guardianName: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  relationBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  relationBadgeText: { fontSize: 11, fontWeight: "700" },
  guardianPhone: { fontSize: 13, color: "#718096" },
  guardianStatusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  appStatusDot: { width: 6, height: 6, borderRadius: 3 },
  appStatusText: { fontSize: 11, color: "#A0AEC0" },
  removeBtn: { padding: 4 },
  filterCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  filterItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  filterIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  filterTitle: { fontSize: 13, fontWeight: "700", color: "#1A2B4C", marginBottom: 2 },
  filterDesc: { fontSize: 12, color: "#718096", lineHeight: 17 },
  sosBtn: {
    backgroundColor: "#DD6B20", borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#DD6B20", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  sosBtnTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  sosBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  sosConfirmedBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F0FFF4", borderRadius: 10, padding: 12, marginTop: 10,
    borderWidth: 1, borderColor: "#C6F6D5",
  },
  sosConfirmedText: { fontSize: 13, color: "#276749", fontWeight: "600" },
});

const sosStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 24 },
  container: { backgroundColor: "#1A2B4C", borderRadius: 24, padding: 32, alignItems: "center", width: "100%" },
  countCircle: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: "#E53E3E",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
    shadowColor: "#E53E3E", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  countNumber: { fontSize: 48, fontWeight: "900", color: "#FFFFFF", lineHeight: 56 },
  countLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#90CDF4", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  cancelBtn: { backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: "100%", alignItems: "center", marginBottom: 14 },
  cancelBtnText: { fontSize: 16, fontWeight: "800", color: "#1A2B4C" },
  hint: { fontSize: 12, color: "#718096", textAlign: "center" },
});

const addStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "800", color: "#1A2B4C", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#718096", marginBottom: 20, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: "700", color: "#4A5568", marginBottom: 8 },
  input: { backgroundColor: "#F7FAFC", borderRadius: 12, padding: 14, fontSize: 15, color: "#1A2B4C", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 16 },
  relationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  relationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#F7FAFC" },
  relationChipText: { fontSize: 13, fontWeight: "600", color: "#4A5568" },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: "#F7FAFC", borderRadius: 12, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#718096" },
  addBtn: { flex: 2, backgroundColor: "#3182CE", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  addBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});
