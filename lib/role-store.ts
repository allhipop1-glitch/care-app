/**
 * 전역 역할 상태 스토어
 * 역할 전환 시 탭바, 홈 화면 등 모든 구독자에게 즉시 알림
 */

type RoleListener = (role: string) => void;

class RoleStore {
  private _role: string = "user";
  private _listeners: Set<RoleListener> = new Set();

  get role(): string {
    return this._role;
  }

  setRole(role: string) {
    if (this._role === role) return;
    this._role = role;
    this._listeners.forEach((listener) => listener(role));
  }

  subscribe(listener: RoleListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

export const roleStore = new RoleStore();
