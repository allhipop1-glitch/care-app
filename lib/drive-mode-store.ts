import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  SETTINGS: "sagocare_drive_mode_settings",
  BT_DEVICES: "sagocare_bt_devices",
  SESSION: "sagocare_drive_session",
};

export interface DriveModeSettings {
  gpsAutoDetect: boolean;       // GPS 속도 자동 감지 활성화
  gpsSpeedThreshold: number;    // 자동 시작 속도 임계값 (기본 20km/h)
  btAutoStart: boolean;         // 블루투스 자동 시작 활성화
  batterySaver: boolean;        // 배터리 절약 모드 (가속도계 선감지)
  autoStartOnboarded: boolean;  // 온보딩 완료 여부
}

export interface BluetoothDevice {
  id: string;
  name: string;
  type: "car_audio" | "handsfree" | "other";
  addedAt: string;
}

export interface DriveSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  distanceKm: number;
  triggerType: "bluetooth" | "gps" | "manual";
}

const DEFAULT_SETTINGS: DriveModeSettings = {
  gpsAutoDetect: false,
  gpsSpeedThreshold: 20,
  btAutoStart: false,
  batterySaver: true,
  autoStartOnboarded: false,
};

export const DriveModeStore = {
  async getSettings(): Promise<DriveModeSettings> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  async saveSettings(settings: Partial<DriveModeSettings>): Promise<void> {
    const current = await DriveModeStore.getSettings();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  },

  async getBtDevices(): Promise<BluetoothDevice[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.BT_DEVICES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async addBtDevice(device: Omit<BluetoothDevice, "id" | "addedAt">): Promise<void> {
    const devices = await DriveModeStore.getBtDevices();
    const newDevice: BluetoothDevice = {
      ...device,
      id: `bt_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.BT_DEVICES, JSON.stringify([...devices, newDevice]));
  },

  async removeBtDevice(id: string): Promise<void> {
    const devices = await DriveModeStore.getBtDevices();
    await AsyncStorage.setItem(KEYS.BT_DEVICES, JSON.stringify(devices.filter((d) => d.id !== id)));
  },

  async getSessions(): Promise<DriveSession[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SESSION);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async addSession(session: Omit<DriveSession, "id">): Promise<void> {
    const sessions = await DriveModeStore.getSessions();
    const newSession: DriveSession = { ...session, id: `session_${Date.now()}` };
    // 최근 30개만 유지
    const updated = [newSession, ...sessions].slice(0, 30);
    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(updated));
  },
};
