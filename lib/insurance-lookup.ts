/**
 * 차량번호 기반 보험사 자동 조회
 *
 * 실제 서비스에서는 금융감독원 보험개발원 API 또는
 * 보험사 공식 API를 연동해야 합니다.
 *
 * 현재는 차량번호 해시 기반으로 시뮬레이션합니다.
 * (실제 API 연동 전 UX 검증용)
 */

export const INSURANCE_LIST = [
  { id: "samsung",  name: "삼성화재",     tel: "1588-5114", color: "#1A56DB" },
  { id: "hyundai",  name: "현대해상",     tel: "1588-5656", color: "#E53E3E" },
  { id: "kb",       name: "KB손해보험",   tel: "1544-0114", color: "#D97706" },
  { id: "db",       name: "DB손해보험",   tel: "1588-0100", color: "#38A169" },
  { id: "meritz",   name: "메리츠화재",   tel: "1566-7711", color: "#805AD5" },
  { id: "lotte",    name: "롯데손해보험", tel: "1588-3344", color: "#DD6B20" },
  { id: "hanwha",   name: "한화손해보험", tel: "1566-8000", color: "#3182CE" },
  { id: "mgen",     name: "MG손해보험",   tel: "1588-5959", color: "#2D3748" },
];

export type InsuranceInfo = (typeof INSURANCE_LIST)[number];

export type LookupResult =
  | { status: "found";   insurance: InsuranceInfo; confidence: "high" | "medium" }
  | { status: "not_found" }
  | { status: "error";   message: string };

/**
 * 차량번호로 보험사를 조회합니다.
 *
 * @param plate  완성된 차량번호 문자열 (예: "12가 3456")
 * @returns      조회 결과
 */
export async function lookupInsuranceByPlate(plate: string): Promise<LookupResult> {
  // 입력 정규화
  const normalized = plate.replace(/\s/g, "").toUpperCase();
  if (normalized.length < 5) {
    return { status: "error", message: "차량번호가 너무 짧습니다." };
  }

  // 네트워크 딜레이 시뮬레이션 (실제 API 호출 느낌)
  await new Promise((r) => setTimeout(r, 1200));

  // 차량번호 해시로 보험사 결정 (시뮬레이션)
  // 실제 연동 시 이 부분을 API 호출로 교체
  const hash = normalized.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const idx = hash % INSURANCE_LIST.length;
  const insurance = INSURANCE_LIST[idx];

  // 뒷자리 숫자 기반 신뢰도 결정
  const digits = normalized.replace(/[^0-9]/g, "");
  const confidence: "high" | "medium" = digits.length >= 6 ? "high" : "medium";

  return { status: "found", insurance, confidence };
}
