import AsyncStorage from "@react-native-async-storage/async-storage";

export type GuardianRelation = "연인" | "배우자" | "부모" | "자녀" | "친구" | "직장동료";

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relation: GuardianRelation;
  hasApp: boolean; // 앱 설치 여부 (시뮬레이션)
  addedAt: string;
}

export interface SosAlert {
  id: string;
  triggeredAt: string;
  location: string;
  status: "detecting" | "confirmed" | "cancelled" | "resolved";
  guardianIds: string[];
}

const GUARDIAN_KEY = "sagocare_guardians";
const SOS_ALERT_KEY = "sagocare_sos_alerts";

export const GuardianStore = {
  async getAll(): Promise<Guardian[]> {
    try {
      const raw = await AsyncStorage.getItem(GUARDIAN_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async add(guardian: Omit<Guardian, "id" | "addedAt">): Promise<Guardian> {
    const all = await GuardianStore.getAll();
    const newGuardian: Guardian = {
      ...guardian,
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(GUARDIAN_KEY, JSON.stringify([...all, newGuardian]));
    return newGuardian;
  },

  async remove(id: string): Promise<void> {
    const all = await GuardianStore.getAll();
    await AsyncStorage.setItem(GUARDIAN_KEY, JSON.stringify(all.filter((g) => g.id !== id)));
  },

  async getSosAlerts(): Promise<SosAlert[]> {
    try {
      const raw = await AsyncStorage.getItem(SOS_ALERT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async triggerSos(location: string, guardianIds: string[]): Promise<SosAlert> {
    const alerts = await GuardianStore.getSosAlerts();
    const alert: SosAlert = {
      id: Date.now().toString(),
      triggeredAt: new Date().toISOString(),
      location,
      status: "confirmed",
      guardianIds,
    };
    await AsyncStorage.setItem(SOS_ALERT_KEY, JSON.stringify([alert, ...alerts]));
    return alert;
  },
};
