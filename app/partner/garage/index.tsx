import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { PartnerLayout } from "@/components/web/PartnerLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const NAV = [
  { label: "대시보드", icon: "📊", path: "/partner/garage" },
  { label: "수리 의뢰", icon: "🔧", path: "/partner/garage/requests" },
  { label: "진행 중인 수리", icon: "🚗", path: "/partner/garage/active" },
  { label: "완료 내역", icon: "✅", path: "/partner/garage/done" },
  { label: "정산 내역", icon: "💰", path: "/partner/garage/settlement" },
  { label: "내 업체 정보", icon: "🏢", path: "/partner/garage/profile" },
];

const NEW_REQUESTS = [
  { id: "REQ-001", time: "14:32", type: "추돌", car: "현대 아반떼 (23가 1234)", location: "강남 테헤란로 152", insurance: "삼성화재", user: "홍길동", status: "대기" },
  { id: "REQ-002", time: "13:15", type: "측면충돌", car: "기아 K5 (45나 5678)", location: "송파 올림픽로 300", insurance: "현대해상", user: "김민수", status: "대기" },
];

const ACTIVE_REPAIRS = [
  { id: "REP-001", car: "현대 소나타 (12다 9012)", type: "추돌", start: "03.25", step: "판금/도색", eta: "03.31", user: "이영희", rental: "SK렌터카" },
  { id: "REP-002", car: "기아 카니발 (78라 3456)", type: "측면충돌", start: "03.24", step: "부품 대기", eta: "04.02", user: "박철수", rental: "롯데렌터카" },
  { id: "REP-003", car: "BMW 520d (99마 7890)", type: "단독", start: "03.23", step: "검수 중", eta: "03.29", user: "최지수", rental: "-" },
];

const STEP_BADGE: Record<string, any> = {
  "입고 확인": "gray", "견적 작성": "orange", "부품 대기": "orange",
  "판금/도색": "blue", "조립": "blue", "검수 중": "purple", "출고 완료": "green",
};

export default function GaragePortal() {
  const [selectedReq, setSelectedReq] = useState<any>(null);

  return (
    <PartnerLayout
      title="공업사 대시보드"
      subtitle="오늘 수리 현황 및 신규 의뢰"
      partnerType="garage"
      partnerName="강남 최고공업사"
      navItems={NAV}
    >
      {/* 신규 의뢰 알림 배너 */}
      {NEW_REQUESTS.length > 0 && (
        <View style={{ backgroundColor: "#FFFAF0", borderWidth: 2, borderColor: "#DD6B20", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 24 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#DD6B20" }}>신규 수리 의뢰 {NEW_REQUESTS.length}건이 도착했습니다</Text>
            <Text style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>아래에서 수락 또는 거절해주세요. 30분 내 미응답 시 자동 반려됩니다.</Text>
          </View>
          <View style={{ backgroundColor: "#DD6B20", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{NEW_REQUESTS.length}</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="신규 의뢰" value="2건" sub="즉시 수락 필요" color="#DD6B20" icon="🔔" />
        <StatCard label="진행 중인 수리" value="3건" color="#3182CE" icon="🔧" />
        <StatCard label="이번 달 완료" value="23건" color="#38A169" icon="✅" />
        <StatCard label="이번 달 매출" value="4,600만원" color="#1A2B4C" icon="💰" />
      </View>

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        <View style={{ flex: selectedReq ? 1 : 2, minWidth: 380 }}>
          {/* New Requests */}
          <SectionCard title="신규 수리 의뢰 (수락 필요)">
            {NEW_REQUESTS.map((req) => (
              <View
                key={req.id}
                style={{
                  borderWidth: 2, borderColor: "#DD6B20", borderRadius: 12,
                  padding: 16, marginBottom: 12, backgroundColor: "#FFFAF0",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Badge label={req.type} variant="orange" />
                    <Text style={{ fontSize: 12, color: "#718096" }}>{req.time} 접수</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "#A0AEC0" }}>{req.id}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 }}>{req.car}</Text>
                <Text style={{ fontSize: 13, color: "#718096", marginBottom: 2 }}>📍 {req.location}</Text>
                <Text style={{ fontSize: 13, color: "#718096", marginBottom: 12 }}>🛡️ {req.insurance} · 👤 {req.user}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <WebButton label="✓ 수락" variant="primary" onPress={() => setSelectedReq(req)} />
                  <WebButton label="✕ 거절" variant="danger" />
                  <WebButton label="상세 보기" variant="ghost" onPress={() => setSelectedReq(req)} />
                </View>
              </View>
            ))}
          </SectionCard>

          {/* Active Repairs */}
          <SectionCard title="진행 중인 수리">
            <WebTable
              columns={[
                { key: "car", label: "차량", width: 1.5 },
                { key: "start", label: "입고일", width: 0.6 },
                { key: "step", label: "현재 단계", width: 1, render: (val) => <Badge label={val} variant={STEP_BADGE[val] ?? "gray"} /> },
                { key: "eta", label: "출고 예정", width: 0.7 },
                { key: "rental", label: "렌터카", width: 0.8, render: (val) => <Text style={{ color: val === "-" ? "#A0AEC0" : "#319795", fontSize: 12 }}>{val}</Text> },
                { key: "action", label: "", width: 0.8, render: (_, row) => (
                  <WebButton label="단계 업데이트" variant="secondary" size="sm" />
                )},
              ]}
              data={ACTIVE_REPAIRS}
            />
          </SectionCard>
        </View>

        {/* Request Detail */}
        {selectedReq && (
          <View style={{ flex: 1, minWidth: 280 }}>
            <SectionCard
              title="의뢰 상세"
              action={<Pressable onPress={() => setSelectedReq(null)}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              <Badge label={selectedReq.type} variant="orange" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A2B4C", marginTop: 12, marginBottom: 16 }}>
                {selectedReq.car}
              </Text>
              {[
                ["접수 시간", selectedReq.time],
                ["사고 위치", selectedReq.location],
                ["보험사", selectedReq.insurance],
                ["사용자", selectedReq.user],
              ].map(([label, value]) => (
                <View key={label} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                  <Text style={{ width: 80, fontSize: 12, color: "#718096" }}>{label}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                </View>
              ))}

              <View style={{ marginTop: 16, padding: 12, backgroundColor: "#EBF8FF", borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: "#3182CE", fontWeight: "600", marginBottom: 4 }}>수락 시 자동 처리</Text>
                <Text style={{ fontSize: 12, color: "#718096" }}>• 렉카 견인 일정 조율{"\n"}• 사용자에게 배정 알림 발송{"\n"}• 렌터카 자동 연결 요청</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <WebButton label="✓ 수락하기" variant="primary" />
                <WebButton label="✕ 거절" variant="danger" />
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </PartnerLayout>
  );
}
