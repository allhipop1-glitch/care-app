import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DriveModeStore, DriveModeSettings, BluetoothDevice } from "@/lib/drive-mode-store";

const BT_TYPES = [
  { key: "car_audio" as const, label: "차량 오디오", icon: "🔊" },
  { key: "handsfree" as const, label: "핸즈프리", icon: "🎧" },
  { key: "other" as const, label: "기타", icon: "📱" },
];

// 블루투스 기기 추가 모달
function AddBtDeviceModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (device: Omit<BluetoothDevice, "id" | "addedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BluetoothDevice["type"]>("car_audio");

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("입력 오류", "기기 이름을 입력해주세요.");
      return;
    }
    onAdd({ name: name.trim(), type });
    setName("");
    setType("car_audio");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>블루투스 기기 등록</Text>
          <Text style={modalStyles.subtitle}>
            차량 오디오나 핸즈프리 기기 이름을 등록하세요.{"\n"}
            연결될 때마다 드라이브 모드가 자동으로 시작됩니다.
          </Text>

          <Text style={modalStyles.label}>기기 이름</Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 내 차 블루투스, 아반떼 오디오"
            placeholderTextColor="#A0AEC0"
          />

          <Text style={modalStyles.label}>기기 종류</Text>
          <View style={modalStyles.typeRow}>
            {BT_TYPES.map((t) => (
              <Pressable
                key={t.key}
                style={[modalStyles.typeChip, type === t.key && modalStyles.typeChipActive]}
                onPress={() => setType(t.key)}
              >
                <Text style={modalStyles.typeChipIcon}>{t.icon}</Text>
                <Text style={[modalStyles.typeChipText, type === t.key && modalStyles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={modalStyles.hint}>
            <IconSymbol name="info.circle.fill" size={14} color="#3182CE" />
            <Text style={modalStyles.hintText}>
              iOS 사용자는 단축어 앱에서 블루투스 자동화를 추가로 설정하면 완전 자동 작동합니다.
            </Text>
          </View>

          <View style={modalStyles.btnRow}>
            <Pressable
              style={({ pressed }) => [modalStyles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelBtnText}>취소</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [modalStyles.addBtn, pressed && { opacity: 0.85 }]}
              onPress={handleAdd}
            >
              <Text style={modalStyles.addBtnText}>등록하기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DriveModeSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<DriveModeSettings>({
    gpsAutoDetect: false,
    gpsSpeedThreshold: 20,
    btAutoStart: false,
    batterySaver: true,
    autoStartOnboarded: false,
  });
  const [btDevices, setBtDevices] = useState<BluetoothDevice[]>([]);
  const [showAddBt, setShowAddBt] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [s, d] = await Promise.all([DriveModeStore.getSettings(), DriveModeStore.getBtDevices()]);
    setSettings(s);
    setBtDevices(d);
  };

  const updateSetting = async (key: keyof DriveModeSettings, value: boolean | number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await DriveModeStore.saveSettings({ [key]: value });
  };

  const handleAddBt = async (device: Omit<BluetoothDevice, "id" | "addedAt">) => {
    await DriveModeStore.addBtDevice(device);
    await loadAll();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveBt = (device: BluetoothDevice) => {
    Alert.alert(
      "기기 삭제",
      `"${device.name}"을(를) 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await DriveModeStore.removeBtDevice(device.id);
            await loadAll();
          },
        },
      ]
    );
  };

  const isAnyAutoEnabled = settings.gpsAutoDetect || settings.btAutoStart;

  return (
    <ScreenContainer containerClassName="bg-[#F7FAFC]">
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={22} color="#1A2B4C" />
        </Pressable>
        <Text style={styles.headerTitle}>드라이브 모드 자동 시작</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 현재 상태 배너 */}
        <View style={[styles.statusBanner, isAnyAutoEnabled ? styles.statusBannerOn : styles.statusBannerOff]}>
          <View style={[styles.statusDot, { backgroundColor: isAnyAutoEnabled ? "#38A169" : "#A0AEC0" }]} />
          <Text style={[styles.statusText, { color: isAnyAutoEnabled ? "#276749" : "#718096" }]}>
            {isAnyAutoEnabled
              ? "자동 시작 활성화됨 · 운전 시작 시 자동으로 켜집니다"
              : "자동 시작 비활성화 · 아래에서 설정해주세요"}
          </Text>
        </View>

        {/* 방식 A — 블루투스 자동 시작 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Text style={styles.sectionIconText}>🔵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>방식 A · 블루투스 자동 시작</Text>
              <Text style={styles.sectionDesc}>내 차 블루투스에 연결되면 자동 시작</Text>
            </View>
            <Switch
              value={settings.btAutoStart}
              onValueChange={(v) => updateSetting("btAutoStart", v)}
              trackColor={{ false: "#E2E8F0", true: "#3182CE" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {settings.btAutoStart && (
            <View style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <Text style={styles.subCardTitle}>등록된 블루투스 기기 ({btDevices.length})</Text>
                <Pressable
                  style={({ pressed }) => [styles.addChip, pressed && { opacity: 0.7 }]}
                  onPress={() => setShowAddBt(true)}
                >
                  <IconSymbol name="plus.circle.fill" size={14} color="#3182CE" />
                  <Text style={styles.addChipText}>기기 추가</Text>
                </Pressable>
              </View>

              {btDevices.length === 0 ? (
                <Pressable
                  style={({ pressed }) => [styles.emptyBt, pressed && { opacity: 0.8 }]}
                  onPress={() => setShowAddBt(true)}
                >
                  <Text style={styles.emptyBtText}>+ 차량 블루투스 기기를 등록하세요</Text>
                </Pressable>
              ) : (
                btDevices.map((device) => (
                  <View key={device.id} style={styles.btDeviceRow}>
                    <View style={styles.btDeviceIcon}>
                      <Text style={{ fontSize: 18 }}>
                        {BT_TYPES.find((t) => t.key === device.type)?.icon ?? "📱"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.btDeviceName}>{device.name}</Text>
                      <Text style={styles.btDeviceType}>
                        {BT_TYPES.find((t) => t.key === device.type)?.label}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                      onPress={() => handleRemoveBt(device)}
                    >
                      <IconSymbol name="minus.circle.fill" size={22} color="#FC8181" />
                    </Pressable>
                  </View>
                ))
              )}

              {/* iOS 단축어 안내 */}
              {Platform.OS === "ios" && (
                <View style={styles.iosHint}>
                  <IconSymbol name="info.circle.fill" size={14} color="#805AD5" />
                  <Text style={styles.iosHintText}>
                    <Text style={{ fontWeight: "700" }}>iOS 사용자 추가 설정:</Text> 단축어 앱 → 자동화 → 블루투스 연결 시 사고케어 열기를 설정하면 완전 자동으로 작동합니다.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 방식 B — GPS 속도 자동 감지 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Text style={styles.sectionIconText}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>방식 B · GPS 자동 감지</Text>
              <Text style={styles.sectionDesc}>20km/h 이상 주행 감지 시 자동 시작</Text>
            </View>
            <Switch
              value={settings.gpsAutoDetect}
              onValueChange={(v) => updateSetting("gpsAutoDetect", v)}
              trackColor={{ false: "#E2E8F0", true: "#38A169" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {settings.gpsAutoDetect && (
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>오탐 방지 필터</Text>
              <View style={styles.filterList}>
                {[
                  { icon: "🚗", text: "GPS 속도 20km/h 이상 30초 지속 시 활성화" },
                  { icon: "🚌", text: "버스·지하철 진동 패턴 구별로 대중교통 제외" },
                  { icon: "📶", text: "Wi-Fi AP 변화율로 실내 이동 제외" },
                ].map((item, i) => (
                  <View key={i} style={styles.filterItem}>
                    <Text style={styles.filterItemIcon}>{item.icon}</Text>
                    <Text style={styles.filterItemText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* 배터리 절약 모드 */}
              <View style={styles.batterySaverRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.batterySaverTitle}>⚡ 배터리 절약 모드</Text>
                  <Text style={styles.batterySaverDesc}>
                    평시에 가속도계만 사용, 움직임 감지 시 GPS 활성화{"\n"}
                    (GPS 상시 사용 대비 배터리 약 70% 절감)
                  </Text>
                </View>
                <Switch
                  value={settings.batterySaver}
                  onValueChange={(v) => updateSetting("batterySaver", v)}
                  trackColor={{ false: "#E2E8F0", true: "#38A169" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}
        </View>

        {/* 두 방식 비교 */}
        <View style={styles.section}>
          <Text style={styles.compareTitle}>어떤 방식이 나에게 맞을까?</Text>
          <View style={styles.compareCard}>
            {[
              { method: "블루투스", recommend: "차량 오디오/핸즈프리 사용자", pros: "가장 정확, 배터리 소모 없음", cons: "최초 1회 기기 등록 필요" },
              { method: "GPS 감지", recommend: "블루투스 미연결 사용자", pros: "설정 없이 바로 사용 가능", cons: "배터리 소모 약간 있음" },
            ].map((item, i) => (
              <View key={i} style={[styles.compareRow, i === 0 && styles.compareRowBorder]}>
                <Text style={styles.compareMethod}>{item.method}</Text>
                <Text style={styles.compareRecommend}>추천: {item.recommend}</Text>
                <Text style={styles.comparePros}>✅ {item.pros}</Text>
                <Text style={styles.compareCons}>⚠️ {item.cons}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 두 방식 모두 사용 추천 */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 두 방식 모두 켜두는 것을 추천해요</Text>
          <Text style={styles.tipDesc}>
            블루투스 연결 시에는 블루투스 방식이 우선 작동하고, 미연결 시에는 GPS 방식이 자동으로 대기합니다. 어떤 상황에서도 놓치지 않습니다.
          </Text>
        </View>

      </ScrollView>

      <AddBtDeviceModal
        visible={showAddBt}
        onClose={() => setShowAddBt(false)}
        onAdd={handleAddBt}
      />
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
    borderBottomColor: "#F0F4F8",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1A2B4C" },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  statusBannerOn: { backgroundColor: "#F0FFF4", borderColor: "#C6F6D5" },
  statusBannerOff: { backgroundColor: "#F7FAFC", borderColor: "#E2E8F0" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "600", flex: 1, lineHeight: 19 },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  sectionIconBg: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#F7FAFC", alignItems: "center", justifyContent: "center",
  },
  sectionIconText: { fontSize: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C", marginBottom: 2 },
  sectionDesc: { fontSize: 12, color: "#718096" },
  subCard: {
    backgroundColor: "#F7FAFC",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  subCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subCardTitle: { fontSize: 13, fontWeight: "700", color: "#4A5568" },
  addChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EBF4FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  addChipText: { fontSize: 12, color: "#3182CE", fontWeight: "700" },
  emptyBt: {
    borderWidth: 1.5, borderColor: "#BEE3F8", borderStyle: "dashed",
    borderRadius: 10, padding: 14, alignItems: "center",
  },
  emptyBtText: { fontSize: 13, color: "#3182CE", fontWeight: "600" },
  btDeviceRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", borderRadius: 10, padding: 12,
  },
  btDeviceIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#EBF4FF", alignItems: "center", justifyContent: "center",
  },
  btDeviceName: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  btDeviceType: { fontSize: 12, color: "#718096", marginTop: 2 },
  iosHint: {
    flexDirection: "row", gap: 8, backgroundColor: "#FAF5FF",
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#E9D8FD",
  },
  iosHintText: { fontSize: 12, color: "#553C9A", lineHeight: 18, flex: 1 },
  filterList: { gap: 8 },
  filterItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  filterItemIcon: { fontSize: 16, width: 24, textAlign: "center" },
  filterItemText: { fontSize: 13, color: "#4A5568", flex: 1, lineHeight: 19 },
  batterySaverRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFFFFF", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  batterySaverTitle: { fontSize: 13, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 },
  batterySaverDesc: { fontSize: 11, color: "#718096", lineHeight: 17 },
  compareTitle: { fontSize: 14, fontWeight: "700", color: "#4A5568", padding: 16, paddingBottom: 0 },
  compareCard: { padding: 12, gap: 0 },
  compareRow: { padding: 12, gap: 4 },
  compareRowBorder: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  compareMethod: { fontSize: 15, fontWeight: "800", color: "#1A2B4C", marginBottom: 2 },
  compareRecommend: { fontSize: 12, color: "#718096" },
  comparePros: { fontSize: 12, color: "#276749" },
  compareCons: { fontSize: 12, color: "#744210" },
  tipCard: {
    backgroundColor: "#EBF4FF", borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 1, borderColor: "#BEE3F8",
  },
  tipTitle: { fontSize: 14, fontWeight: "700", color: "#1A2B4C" },
  tipDesc: { fontSize: 13, color: "#2C5282", lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "800", color: "#1A2B4C", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#718096", marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#4A5568", marginBottom: 8 },
  input: { backgroundColor: "#F7FAFC", borderRadius: 12, padding: 14, fontSize: 15, color: "#1A2B4C", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 16 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#F7FAFC", gap: 4 },
  typeChipActive: { borderColor: "#3182CE", backgroundColor: "#EBF4FF" },
  typeChipIcon: { fontSize: 20 },
  typeChipText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  typeChipTextActive: { color: "#3182CE" },
  hint: { flexDirection: "row", gap: 8, backgroundColor: "#EBF4FF", borderRadius: 10, padding: 12, marginBottom: 16 },
  hintText: { fontSize: 12, color: "#2C5282", lineHeight: 18, flex: 1 },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: "#F7FAFC", borderRadius: 12, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: "#718096" },
  addBtn: { flex: 2, backgroundColor: "#3182CE", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  addBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});
