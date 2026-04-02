import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── 꿀팁 데이터 20개 ───────────────────────────────────────────────────────

export interface AccidentTip {
  id: number;
  category: "사고 직후" | "보험" | "법률" | "예방" | "건강";
  emoji: string;
  title: string;
  body: string;
  detail: string;
}

export const ACCIDENT_TIPS: AccidentTip[] = [
  {
    id: 1,
    category: "사고 직후",
    emoji: "📸",
    title: "사고 직후 사진부터 찍으세요",
    body: "차량 이동 전 현장 사진을 최소 10장 이상 찍어두세요.",
    detail:
      "사고 현장 사진은 과실 비율 산정의 핵심 증거입니다. 차량 전체, 파손 부위 클로즈업, 도로 상황, 신호등, 차선 등을 모두 촬영하세요. 특히 차량을 이동하기 전에 찍는 것이 중요합니다.",
  },
  {
    id: 2,
    category: "사고 직후",
    emoji: "🚨",
    title: "블랙박스 메모리 즉시 보존하세요",
    body: "사고 후 블랙박스 SD카드를 바로 빼두세요. 덮어쓰기 방지!",
    detail:
      "블랙박스는 사고 전후 30초~1분 영상을 저장합니다. 시동을 끄지 않으면 계속 녹화되어 사고 영상이 덮어씌워질 수 있습니다. 사고 즉시 SD카드를 분리하거나 블랙박스 전원을 끄세요.",
  },
  {
    id: 3,
    category: "건강",
    emoji: "🏥",
    title: "목 통증은 즉시 병원 가세요",
    body: "추돌 후 목 통증은 즉시 병원 방문! 나중에 증상 악화 시 보상 어려워요.",
    detail:
      "경추 염좌(목 삐임)는 사고 직후보다 1~2일 후에 증상이 심해지는 경우가 많습니다. 사고 당일 병원 기록이 없으면 나중에 보험 보상 받기 어려울 수 있으니 증상이 없어도 병원에서 검사를 받는 것이 좋습니다.",
  },
  {
    id: 4,
    category: "보험",
    emoji: "📋",
    title: "보험사 렉카는 무료입니다",
    body: "사고 시 보험사에 연락하면 렉카 비용이 무료예요. 사설 렉카 조심!",
    detail:
      "사설 렉카는 수십만 원의 비용을 청구할 수 있습니다. 사고 즉시 가입한 보험사에 연락하면 무료로 렉카를 보내줍니다. 사설 렉카가 먼저 접근하더라도 계약서에 서명하지 마세요.",
  },
  {
    id: 5,
    category: "법률",
    emoji: "⚖️",
    title: "합의는 치료 종결 후에 하세요",
    body: "치료 중 합의하면 추가 치료비 못 받아요. 완치 후 합의가 원칙!",
    detail:
      "사고 후 상대방이나 보험사에서 빠른 합의를 요구할 수 있습니다. 치료가 완전히 끝나기 전에 합의하면 이후 발생하는 치료비나 후유증에 대해 추가 보상을 받을 수 없습니다. 반드시 치료 종결 후 합의하세요.",
  },
  {
    id: 6,
    category: "예방",
    emoji: "🌧️",
    title: "빗길 제동거리는 2배입니다",
    body: "비 오는 날 앞차와의 거리를 평소의 2배로 유지하세요.",
    detail:
      "젖은 도로에서는 타이어와 노면의 마찰력이 크게 줄어 제동거리가 건조한 도로의 1.5~2배로 늘어납니다. 시속 100km에서 건조 시 제동거리가 약 50m라면, 빗길에서는 약 100m가 필요합니다.",
  },
  {
    id: 7,
    category: "사고 직후",
    emoji: "📞",
    title: "목격자 연락처를 확보하세요",
    body: "사고 현장 목격자 연락처는 황금 같은 증거입니다.",
    detail:
      "목격자 진술은 과실 비율 분쟁에서 결정적인 역할을 합니다. 사고 직후 현장에 있는 목격자에게 연락처를 받아두세요. 블랙박스가 없는 상황에서 목격자 진술이 유일한 증거가 될 수 있습니다.",
  },
  {
    id: 8,
    category: "보험",
    emoji: "💰",
    title: "자동차보험 자기부담금 확인하세요",
    body: "자차 보험 청구 시 자기부담금이 있어요. 미리 확인해두세요!",
    detail:
      "자기차량손해(자차) 보험은 수리비의 일정 비율 또는 고정 금액을 자기부담금으로 내야 합니다. 보통 20만~50만 원 수준입니다. 수리비가 자기부담금보다 적다면 보험 청구 대신 자비 처리가 유리할 수 있습니다.",
  },
  {
    id: 9,
    category: "법률",
    emoji: "🚗",
    title: "음주운전 동승자도 처벌받습니다",
    body: "음주운전 차량에 탑승하면 동승자도 처벌 대상이 될 수 있어요.",
    detail:
      "음주운전을 알면서 동승한 경우 도로교통법 위반 방조죄로 처벌받을 수 있습니다. 또한 사고 발생 시 보험 보상에서 불이익을 받을 수 있으니 음주운전 차량에는 절대 탑승하지 마세요.",
  },
  {
    id: 10,
    category: "예방",
    emoji: "🛞",
    title: "과속방지턱 충격 후 타이어 점검",
    body: "과속방지턱을 빠르게 넘으면 타이어 내부가 손상될 수 있어요.",
    detail:
      "과속방지턱을 빠른 속도로 넘으면 타이어 사이드월이 손상되어 주행 중 갑자기 터질 수 있습니다. 충격 후 타이어 외관을 점검하고, 핸들이 한쪽으로 쏠리거나 진동이 느껴지면 즉시 정비소를 방문하세요.",
  },
  {
    id: 11,
    category: "사고 직후",
    emoji: "🚦",
    title: "신호 위반 사고는 CCTV 영상 요청",
    body: "신호 위반 분쟁 시 교통 CCTV 영상을 경찰에 요청하세요.",
    detail:
      "교차로 신호 위반 사고에서 블랙박스 영상이 없다면 인근 교통 CCTV 영상이 결정적 증거가 됩니다. 사고 후 즉시 경찰에 신고하고 CCTV 영상 보존을 요청하세요. 영상은 보통 30일 후 자동 삭제됩니다.",
  },
  {
    id: 12,
    category: "보험",
    emoji: "📱",
    title: "블랙박스 없어도 스마트폰 영상",
    body: "사고 현장을 스마트폰으로 동영상 촬영해두면 증거로 활용 가능해요.",
    detail:
      "블랙박스가 없거나 영상이 없는 경우, 스마트폰으로 현장 동영상을 촬영해두면 보험 분쟁 시 유용한 증거가 됩니다. 차량 위치, 파손 상태, 도로 상황을 360도로 촬영하세요.",
  },
  {
    id: 13,
    category: "건강",
    emoji: "🦴",
    title: "사고 후 허리 통증도 즉시 검사",
    body: "사고 후 허리 통증은 디스크 손상일 수 있어요. 즉시 MRI 검사 권장!",
    detail:
      "교통사고 충격으로 추간판(디스크)이 손상될 수 있습니다. 초기에는 통증이 없다가 수일 후 심해지는 경우가 많습니다. 사고 후 허리나 다리 저림 증상이 있으면 즉시 정형외과나 신경외과를 방문하세요.",
  },
  {
    id: 14,
    category: "법률",
    emoji: "📝",
    title: "합의서 서명 전 변호사 검토 필수",
    body: "보험사 합의서에 서명 전 반드시 전문가 검토를 받으세요.",
    detail:
      "보험사가 제시하는 합의금은 실제 손해액보다 낮은 경우가 많습니다. 합의서에 서명하면 이후 추가 청구가 불가능합니다. 교통사고 전문 변호사나 손해사정사에게 합의금 적정성 검토를 요청하세요.",
  },
  {
    id: 15,
    category: "예방",
    emoji: "😴",
    title: "졸음운전은 음주운전보다 위험",
    body: "졸음운전 사망사고 비율이 음주운전보다 높아요. 졸리면 무조건 쉬세요.",
    detail:
      "졸음운전은 반응 속도가 음주 상태보다 느릴 수 있으며, 사망사고 비율이 매우 높습니다. 2시간 이상 운전 시 반드시 휴식을 취하고, 졸음이 오면 즉시 안전한 곳에 정차해 15~20분 수면을 취하세요.",
  },
  {
    id: 16,
    category: "사고 직후",
    emoji: "🏃",
    title: "뺑소니 차량 번호판 꼭 기억하세요",
    body: "뺑소니 사고 시 번호판 일부만 기억해도 추적 가능해요.",
    detail:
      "뺑소니 차량의 번호판 전체를 기억하지 못해도 괜찮습니다. 차량 색상, 차종, 번호판 일부 숫자만으로도 경찰이 추적할 수 있습니다. 주변 CCTV 위치도 기억해두면 도움이 됩니다.",
  },
  {
    id: 17,
    category: "보험",
    emoji: "🔧",
    title: "수리는 보험사 지정 공업사 아니어도 돼요",
    body: "보험사 지정 공업사 외 원하는 곳에서 수리 가능해요. 강요하면 거부하세요!",
    detail:
      "보험사가 특정 공업사를 강요하는 것은 불법입니다. 소비자는 원하는 공업사에서 수리를 받을 권리가 있습니다. 다만 보험사 지정 공업사 이용 시 수리 기간 동안 렌터카를 무료로 제공받는 경우가 많으니 비교해보세요.",
  },
  {
    id: 18,
    category: "법률",
    emoji: "⏰",
    title: "교통사고 손해배상 소멸시효 3년",
    body: "교통사고 손해배상 청구권은 사고 후 3년 내에 행사해야 해요.",
    detail:
      "교통사고로 인한 손해배상 청구권의 소멸시효는 손해 및 가해자를 안 날로부터 3년입니다. 치료가 장기화되더라도 3년이 지나면 청구권이 소멸될 수 있으니 주의하세요.",
  },
  {
    id: 19,
    category: "예방",
    emoji: "📡",
    title: "블랙박스 SD카드 3개월마다 포맷",
    body: "블랙박스 SD카드는 3개월마다 포맷해야 녹화 오류를 방지할 수 있어요.",
    detail:
      "블랙박스 SD카드는 지속적인 덮어쓰기로 인해 파일 시스템이 손상될 수 있습니다. 3개월마다 블랙박스 전용 포맷 기능을 사용해 SD카드를 포맷하세요. 일반 PC 포맷은 블랙박스와 호환되지 않을 수 있습니다.",
  },
  {
    id: 20,
    category: "건강",
    emoji: "🧠",
    title: "사고 후 심리 치료도 보상받을 수 있어요",
    body: "교통사고 후 PTSD, 불안장애 등 심리 치료비도 보험 보상 대상이에요.",
    detail:
      "교통사고 후 외상 후 스트레스 장애(PTSD), 불안장애, 우울증 등이 발생할 수 있습니다. 이러한 심리적 후유증에 대한 치료비도 자동차보험 보상 대상에 포함됩니다. 정신건강의학과 진료 기록을 남겨두세요.",
  },
];

// ─── 알림 설정 타입 ───────────────────────────────────────────────────────────

export interface TipNotificationSettings {
  enabled: boolean;
  morningEnabled: boolean;  // 오전 알림 (기본 9시)
  eveningEnabled: boolean;  // 저녁 알림 (기본 18시)
  morningHour: number;
  eveningHour: number;
  lastTipIndex: number;
}

const DEFAULT_SETTINGS: TipNotificationSettings = {
  enabled: true,
  morningEnabled: true,
  eveningEnabled: true,
  morningHour: 9,
  eveningHour: 18,
  lastTipIndex: 0,
};

const STORAGE_KEY = "tip_notification_settings";
const MORNING_NOTIF_ID = "tip_morning";
const EVENING_NOTIF_ID = "tip_evening";

// ─── 알림 핸들러 설정 ─────────────────────────────────────────────────────────

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// ─── 권한 요청 ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tips", {
      name: "교통사고 꿀팁",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── 설정 로드/저장 ───────────────────────────────────────────────────────────

export async function loadTipSettings(): Promise<TipNotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveTipSettings(settings: TipNotificationSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ─── 다음 꿀팁 인덱스 가져오기 ───────────────────────────────────────────────

export async function getNextTipIndex(): Promise<number> {
  const settings = await loadTipSettings();
  const nextIndex = (settings.lastTipIndex + 1) % ACCIDENT_TIPS.length;
  await saveTipSettings({ ...settings, lastTipIndex: nextIndex });
  return nextIndex;
}

// ─── 알림 스케줄 등록 ─────────────────────────────────────────────────────────

export async function scheduleTipNotifications(
  settings: TipNotificationSettings
): Promise<void> {
  // 기존 꿀팁 알림 모두 취소
  await Notifications.cancelScheduledNotificationAsync(MORNING_NOTIF_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(EVENING_NOTIF_ID).catch(() => {});

  if (!settings.enabled) return;

  const morningTip = ACCIDENT_TIPS[settings.lastTipIndex % ACCIDENT_TIPS.length];
  const eveningTip = ACCIDENT_TIPS[(settings.lastTipIndex + 1) % ACCIDENT_TIPS.length];

  // 오전 알림
  if (settings.morningEnabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: MORNING_NOTIF_ID,
      content: {
        title: `${morningTip.emoji} 오늘의 교통사고 꿀팁`,
        body: morningTip.body,
        data: { tipId: morningTip.id, screen: "tips" },
        categoryIdentifier: "tips",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.morningHour,
        minute: 0,
      },
    });
  }

  // 저녁 알림
  if (settings.eveningEnabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: EVENING_NOTIF_ID,
      content: {
        title: `${eveningTip.emoji} 퇴근길 교통사고 꿀팁`,
        body: eveningTip.body,
        data: { tipId: eveningTip.id, screen: "tips" },
        categoryIdentifier: "tips",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.eveningHour,
        minute: 0,
      },
    });
  }
}

// ─── 알림 전체 취소 ───────────────────────────────────────────────────────────

export async function cancelAllTipNotifications(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MORNING_NOTIF_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(EVENING_NOTIF_ID).catch(() => {});
}

// ─── 초기 설정 (앱 최초 실행 시) ─────────────────────────────────────────────

export async function initTipNotifications(): Promise<void> {
  const settings = await loadTipSettings();
  if (settings.enabled) {
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleTipNotifications(settings);
    }
  }
}
