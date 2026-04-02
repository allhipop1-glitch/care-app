import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  ACCIDENT_TIPS,
  AccidentTip,
  TipNotificationSettings,
  loadTipSettings,
  saveTipSettings,
  scheduleTipNotifications,
  cancelAllTipNotifications,
  requestNotificationPermission,
} from "@/lib/tip-notification-store";

const CATEGORY_COLORS: Record<AccidentTip["category"], string> = {
  "사고 직후": "#EF4444",
  "보험": "#3B82F6",
  "법률": "#8B5CF6",
  "예방": "#10B981",
  "건강": "#F59E0B",
};

const HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export default function TipNotificationSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<TipNotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  useEffect(() => {
    loadTipSettings().then(setSettings);
  }, []);

  const handleSave = async (newSettings: TipNotificationSettings) => {
    setSaving(true);
    try {
      if (newSettings.enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            "알림 권한 필요",
            "꿀팁 알림을 받으려면 설정에서 알림 권한을 허용해주세요.",
            [{ text: "확인" }]
          );
          setSaving(false);
          return;
        }
        await scheduleTipNotifications(newSettings);
      } else {
        await cancelAllTipNotifications();
      }
      await saveTipSettings(newSettings);
      setSettings(newSettings);
    } catch (e) {
      Alert.alert("오류", "설정 저장 중 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const toggleEnabled = () => {
    if (!settings) return;
    handleSave({ ...settings, enabled: !settings.enabled });
  };

  const toggleMorning = () => {
    if (!settings) return;
    handleSave({ ...settings, morningEnabled: !settings.morningEnabled });
  };

  const toggleEvening = () => {
    if (!settings) return;
    handleSave({ ...settings, eveningEnabled: !settings.eveningEnabled });
  };

  const setMorningHour = (hour: number) => {
    if (!settings) return;
    setShowMorningPicker(false);
    handleSave({ ...settings, morningHour: hour });
  };

  const setEveningHour = (hour: number) => {
    if (!settings) return;
    setShowEveningPicker(false);
    handleSave({ ...settings, eveningHour: hour });
  };

  if (!settings) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>로딩 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.primary }]}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>꿀팁 알림 설정</Text>
          <View style={styles.backBtn} />
        </View>

        {/* 알림 ON/OFF */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}>🔔</Text>
              <View>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>교통사고 꿀팁 알림</Text>
                <Text style={[styles.rowDesc, { color: colors.muted }]}>매일 유용한 꿀팁을 알려드려요</Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 알림 시간 설정 */}
        {settings.enabled && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>알림 시간</Text>

            {/* 오전 알림 */}
            <View style={[styles.row, styles.rowBorder, { borderColor: colors.border }]}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>🌅</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>오전 알림</Text>
                  <Text style={[styles.rowDesc, { color: colors.muted }]}>출근길 꿀팁</Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                {settings.morningEnabled && (
                  <TouchableOpacity
                    onPress={() => setShowMorningPicker(!showMorningPicker)}
                    style={[styles.timeBadge, { backgroundColor: colors.primary + "20" }]}
                  >
                    <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
                      오전 {settings.morningHour}시
                    </Text>
                  </TouchableOpacity>
                )}
                <Switch
                  value={settings.morningEnabled}
                  onValueChange={toggleMorning}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {showMorningPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {HOUR_OPTIONS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setMorningHour(h)}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor:
                            settings.morningHour === h ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.hourChipText,
                          {
                            color: settings.morningHour === h ? "#fff" : colors.foreground,
                          },
                        ]}
                      >
                        {h}시
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 저녁 알림 */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>🌆</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>저녁 알림</Text>
                  <Text style={[styles.rowDesc, { color: colors.muted }]}>퇴근길 꿀팁</Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                {settings.eveningEnabled && (
                  <TouchableOpacity
                    onPress={() => setShowEveningPicker(!showEveningPicker)}
                    style={[styles.timeBadge, { backgroundColor: colors.primary + "20" }]}
                  >
                    <Text style={[styles.timeBadgeText, { color: colors.primary }]}>
                      오후 {settings.eveningHour - 12 > 0 ? settings.eveningHour - 12 : settings.eveningHour}시
                    </Text>
                  </TouchableOpacity>
                )}
                <Switch
                  value={settings.eveningEnabled}
                  onValueChange={toggleEvening}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {showEveningPicker && (
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {HOUR_OPTIONS.filter((h) => h >= 12).map((h) => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setEveningHour(h)}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor:
                            settings.eveningHour === h ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.hourChipText,
                          {
                            color: settings.eveningHour === h ? "#fff" : colors.foreground,
                          },
                        ]}
                      >
                        {h - 12 > 0 ? h - 12 : h}시
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* 꿀팁 미리보기 */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>꿀팁 목록 미리보기</Text>
        {ACCIDENT_TIPS.map((tip) => (
          <View
            key={tip.id}
            style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.tipHeader}>
              <Text style={styles.tipEmoji}>{tip.emoji}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[tip.category] + "20" }]}>
                <Text style={[styles.categoryText, { color: CATEGORY_COLORS[tip.category] }]}>
                  {tip.category}
                </Text>
              </View>
            </View>
            <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
            <Text style={[styles.tipBody, { color: colors.muted }]}>{tip.body}</Text>
          </View>
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rowBorder: { borderBottomWidth: 1, paddingBottom: 16, marginBottom: 16 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowEmoji: { fontSize: 24 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowDesc: { fontSize: 13, marginTop: 2 },
  timeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  timeBadgeText: { fontSize: 13, fontWeight: "600" },
  pickerContainer: { paddingVertical: 12 },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  hourChipText: { fontSize: 14, fontWeight: "600" },
  sectionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  tipCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipEmoji: { fontSize: 20 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: "600" },
  tipTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  tipBody: { fontSize: 13, lineHeight: 18 },
  bottomPad: { height: 40 },
});
