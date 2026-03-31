import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { PartnerLayout } from "@/components/web/PartnerLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const NAV = [
  { label: "대시보드", icon: "📊", path: "/partner/rental" },
  { label: "배차 요청", icon: "🚗", path: "/partner/rental/requests" },
  { label: "이용 중인 차량", icon: "🔑", path: "/partner/rental/active" },
  { label: "반납 예정", icon: "📅", path: "/partner/rental/return" },
  { label: "정산 내역", icon: "💰", path: "/partner/rental/settlement" },
  { label: "차량 관리", icon: "🚙", path: "/partner/rental/fleet" },
];

const ACTIVE_RENTALS = [
  { id: "RNT-001", user: "홍길동", car: "현대 아반떼 (렌트)", start: "03.20", end: "04.14", dday: 16, insurance: "삼성화재", status: "이용중" },
  { id: "RNT-002", user: "김민수", car: "기아 K5 (렌트)", start: "03.18", end: "04.12", dday: 14, insurance: "현대해상", status: "이용중" },
  { id: "RNT-003", user: "이영희", car: "현대 투싼 (렌트)", start: "03.25", end: "04.19", dday: 21, insurance: "KB손보", status: "이용중" },
  { id: "RNT-004", user: "박철수", car: "기아 쏘렌토 (렌트)", start: "03.10", end: "04.04", dday: 6, insurance: "DB손보", status: "반납임박" },
  { id: "RNT-005", user: "최지수", car: "현대 그랜저 (렌트)", start: "03.05", end: "03.30", dday: 1, insurance: "메리츠화재", status: "D-1" },
];

const NEW_REQUESTS = [
  { id: "REQ-001", user: "정민호", car: "중형 이상", insurance: "삼성화재", start: "03.29", days: 25, garage: "강남공업사" },
];

export default function RentalPortal() {
  const [selected, setSelected] = useState<any>(null);

  const getDdayColor = (dday: number) => dday <= 3 ? "#E53E3E" : dday <= 7 ? "#DD6B20" : "#38A169";

  return (
    <PartnerLayout
      title="렌터카 대시보드"
      subtitle="배차 현황 및 D-day 관리"
      partnerType="rental"
      partnerName="SK렌터카 강남점"
      navItems={NAV}
    >
      {/* D-day 임박 차량 알림 */}
      {ACTIVE_RENTALS.filter((r) => r.dday <= 3).length > 0 && (
        <View style={{ backgroundColor: "#FFF5F5", borderWidth: 2, borderColor: "#E53E3E", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 24 }}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#E53E3E" }}>D-3 이내 반납 예정 차량 {ACTIVE_RENTALS.filter((r) => r.dday <= 3).length}대</Text>
            <Text style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>연장 또는 반납 일정을 사용자에게 확인해주세요. 25일 한도 초과 시 보험 처리 불가능합니다.</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="배차 요청" value="1건" sub="즉시 처리 필요" color="#DD6B20" icon="🔔" />
        <StatCard label="이용 중인 차량" value="5대" color="#38A169" icon="🚗" />
        <StatCard label="D-7 이내 반납" value="2대" sub="연장 확인 필요" color="#E53E3E" icon="⚠️" />
        <StatCard label="이번 달 매출" value="1,800만원" color="#1A2B4C" icon="💰" />
      </View>

      {/* New Request Alert */}
      {NEW_REQUESTS.map((req) => (
        <View
          key={req.id}
          style={{
            borderWidth: 2, borderColor: "#38A169", borderRadius: 12,
            backgroundColor: "#F0FFF4", padding: 16, marginBottom: 20,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 24 }}>🚗</Text>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A2B4C" }}>신규 배차 요청 — {req.user}</Text>
              <Text style={{ fontSize: 12, color: "#718096" }}>
                {req.car} · {req.start}부터 최대 {req.days}일 · {req.insurance} · {req.garage}에서 수리 중
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <WebButton label="✓ 배차 확정" variant="success" />
            <WebButton label="거절" variant="danger" />
          </View>
        </View>
      ))}

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        <View style={{ flex: selected ? 1 : 2, minWidth: 380 }}>
          <SectionCard title="이용 중인 차량 — D-day 현황">
            <WebTable
              columns={[
                { key: "user", label: "이용자", width: 0.8 },
                { key: "car", label: "차량", width: 1.2 },
                { key: "start", label: "시작일", width: 0.7 },
                { key: "end", label: "반납 예정일", width: 0.8 },
                {
                  key: "dday", label: "D-day", width: 0.7,
                  render: (val) => (
                    <Text style={{ fontWeight: "800", fontSize: 14, color: getDdayColor(val) }}>
                      D-{val}
                    </Text>
                  ),
                },
                { key: "insurance", label: "보험사", width: 0.9 },
                {
                  key: "status", label: "상태", width: 0.8,
                  render: (val) => (
                    <Badge
                      label={val}
                      variant={val === "D-1" ? "red" : val === "반납임박" ? "orange" : "green"}
                    />
                  ),
                },
                {
                  key: "action", label: "", width: 0.8,
                  render: (_, row) => (
                    <WebButton label="관리" variant="ghost" size="sm" onPress={() => setSelected(row)} />
                  ),
                },
              ]}
              data={ACTIVE_RENTALS}
              onRowPress={(row) => setSelected(row)}
            />
          </SectionCard>
        </View>

        {/* Detail */}
        {selected && (
          <View style={{ flex: 1, minWidth: 280 }}>
            <SectionCard
              title="렌탈 상세 관리"
              action={<Pressable onPress={() => setSelected(null)}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              <View style={{ alignItems: "center", padding: 20, backgroundColor: "#F0FFF4", borderRadius: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 48, fontWeight: "800", color: getDdayColor(selected.dday) }}>
                  D-{selected.dday}
                </Text>
                <Text style={{ fontSize: 13, color: "#718096", marginTop: 4 }}>
                  {selected.end} 반납 예정
                </Text>
              </View>

              {[
                ["이용자", selected.user],
                ["차량", selected.car],
                ["시작일", selected.start],
                ["보험사", selected.insurance],
              ].map(([label, value]) => (
                <View key={label} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                  <Text style={{ width: 70, fontSize: 12, color: "#718096" }}>{label}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                </View>
              ))}

              <View style={{ marginTop: 16, padding: 12, backgroundColor: "#FFFAF0", borderRadius: 8, borderWidth: 1, borderColor: "#FED7AA" }}>
                <Text style={{ fontSize: 12, color: "#DD6B20", fontWeight: "600", marginBottom: 4 }}>⚠️ 25일 한도 안내</Text>
                <Text style={{ fontSize: 12, color: "#718096" }}>
                  보험사 렌트 지원 최대 25일입니다.{"\n"}
                  수리 지연 시 보험사 연장 승인이 필요합니다.
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <WebButton label="연장 요청" variant="primary" size="sm" />
                <WebButton label="반납 처리" variant="secondary" size="sm" />
                <WebButton label="전화하기" variant="ghost" size="sm" icon="📞" />
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </PartnerLayout>
  );
}
