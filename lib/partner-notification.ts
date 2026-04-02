/**
 * 파트너 업체 알림 유틸리티
 * - 새 사고 접수 시 파트너 앱에 로컬 푸시 알림 발송
 * - 서버에서 매칭 생성 후 클라이언트 폴링으로 감지 → 로컬 알림 표시
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const LAST_SEEN_KEY = "partner_last_seen_matching_id";
const PARTNER_NOTIF_CHANNEL = "partner-requests";

// ─── 알림 채널 초기화 (Android) ───────────────────────────────────────────────

export async function setupPartnerNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(PARTNER_NOTIF_CHANNEL, {
      name: "새 의뢰 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3182CE",
      sound: "default",
    });
  }
}

// ─── 권한 요청 ────────────────────────────────────────────────────────────────

export async function requestPartnerNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── 새 의뢰 알림 발송 ────────────────────────────────────────────────────────

export async function showNewRequestNotification(params: {
  accidentType: string;
  location?: string;
  matchingId: number;
}) {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🚨 새 의뢰가 도착했습니다",
      body: `${params.accidentType}${params.location ? ` · ${params.location}` : ""} — 지금 확인하세요`,
      data: { matchingId: params.matchingId, type: "new_request" },
      sound: "default",
      ...(Platform.OS === "android" && { channelId: PARTNER_NOTIF_CHANNEL }),
    },
    trigger: null, // 즉시 발송
  });
}

// ─── 마지막으로 확인한 매칭 ID 관리 ──────────────────────────────────────────

export async function getLastSeenMatchingId(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(LAST_SEEN_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setLastSeenMatchingId(id: number) {
  try {
    await AsyncStorage.setItem(LAST_SEEN_KEY, String(id));
  } catch {
    // ignore
  }
}

// ─── 새 요청 감지 및 알림 발송 ────────────────────────────────────────────────
// 파트너 대시보드에서 주기적으로 호출

export async function checkAndNotifyNewRequests(
  requests: Array<{ matching: { id: number; status: string }; accident: { accidentType: string; location?: string } | null }>
) {
  if (Platform.OS === "web") return;

  const lastSeen = await getLastSeenMatchingId();
  const newRequests = requests.filter(
    (r) => r.matching.id > lastSeen && r.matching.status === "요청"
  );

  if (newRequests.length === 0) return;

  // 가장 최신 ID 저장
  const maxId = Math.max(...newRequests.map((r) => r.matching.id));
  await setLastSeenMatchingId(maxId);

  // 각 새 요청에 대해 알림 발송 (최대 3개)
  for (const req of newRequests.slice(0, 3)) {
    await showNewRequestNotification({
      accidentType: req.accident?.accidentType ?? "사고",
      location: req.accident?.location ?? undefined,
      matchingId: req.matching.id,
    });
  }
}
