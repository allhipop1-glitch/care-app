import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { PartnerLayout } from "@/components/web/PartnerLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const NAV = [
  { label: "대시보드", icon: "📊", path: "/partner/lawyer" },
  { label: "상담 요청", icon: "📩", path: "/partner/lawyer/requests" },
  { label: "진행 중인 사건", icon: "⚖️", path: "/partner/lawyer/cases" },
  { label: "합의서 관리", icon: "📝", path: "/partner/lawyer/agreements" },
  { label: "정산 내역", icon: "💰", path: "/partner/lawyer/settlement" },
];

const CASES = [
  { id: "CASE-001", client: "정민호", accident: "03.10 보행자 사고", fault: "상대방 100%", stage: "보험사 협상", insurance: "삼성화재", amount: "미정", status: "협상중" },
  { id: "CASE-002", client: "강수진", accident: "02.28 추돌", fault: "상대방 80%", stage: "합의서 작성", insurance: "현대해상", amount: "2,400만원", status: "합의임박" },
  { id: "CASE-003", client: "윤기태", accident: "02.15 측면충돌", fault: "50:50", stage: "소송 준비", insurance: "KB손보", amount: "미정", status: "소송준비" },
];

const NEW_REQUESTS = [
  { id: "REQ-001", name: "박지훈", accident: "03.28 추돌", fault: "상대방 70%", phone: "010-9999-0000", insurance: "DB손보" },
];

const STAGE_BADGE: Record<string, any> = {
  "초기 상담": "gray", "서류 검토": "blue", "보험사 협상": "orange",
  "합의서 작성": "purple", "소송 준비": "red", "완료": "green",
};

export default function LawyerPortal() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <PartnerLayout
      title="변호사 대시보드"
      subtitle="사건 관리 및 보험사 협상 현황"
      partnerType="lawyer"
      partnerName="교통사고 전문 법률사무소"
      navItems={NAV}
    >
      {/* 신규 상담 요청 알림 */}
      {NEW_REQUESTS.length > 0 && (
        <View style={{ backgroundColor: "#FAF5FF", borderWidth: 2, borderColor: "#805AD5", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 24 }}>⚖️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#805AD5" }}>신규 법률 상담 요청 {NEW_REQUESTS.length}건</Text>
            <Text style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>상담 수락 여부를 연락해주세요. 불수락 시 다른 변호사에게 자동 안내됩니다.</Text>
          </View>
          <View style={{ backgroundColor: "#805AD5", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{NEW_REQUESTS.length}</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="신규 상담 요청" value="1건" color="#DD6B20" icon="📩" />
        <StatCard label="진행 중인 사건" value="3건" color="#805AD5" icon="⚖️" />
        <StatCard label="이번 달 합의 완료" value="2건" color="#38A169" icon="✅" />
        <StatCard label="이번 달 매출" value="2,400만원" color="#1A2B4C" icon="💰" />
      </View>

      {/* New Request */}
      {NEW_REQUESTS.map((req) => (
        <View
          key={req.id}
          style={{
            borderWidth: 2, borderColor: "#805AD5", borderRadius: 12,
            backgroundColor: "#FAF5FF", padding: 16, marginBottom: 20,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 24 }}>⚖️</Text>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A2B4C" }}>신규 상담 요청 — {req.name}</Text>
              <Text style={{ fontSize: 12, color: "#718096" }}>
                {req.accident} · 과실 {req.fault} · {req.insurance} · {req.phone}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <WebButton label="수임 수락" variant="primary" onPress={() => setSelected(req)} />
            <WebButton label="거절" variant="danger" />
          </View>
        </View>
      ))}

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        <View style={{ flex: selected ? 1 : 2, minWidth: 380 }}>
          <SectionCard title="진행 중인 사건">
            <WebTable
              columns={[
                { key: "client", label: "의뢰인", width: 0.7 },
                { key: "accident", label: "사고 내용", width: 1.2 },
                { key: "fault", label: "과실 비율", width: 0.9 },
                { key: "stage", label: "진행 단계", width: 1, render: (val) => <Badge label={val} variant={STAGE_BADGE[val] ?? "gray"} /> },
                { key: "amount", label: "합의 예상액", width: 0.9, render: (val) => (
                  <Text style={{ color: val === "미정" ? "#A0AEC0" : "#38A169", fontWeight: "600" }}>{val}</Text>
                )},
                { key: "status", label: "상태", width: 0.8, render: (val) => (
                  <Badge label={val} variant={val === "합의임박" ? "purple" : val === "소송준비" ? "red" : "orange"} />
                )},
                { key: "action", label: "", width: 0.6, render: (_, row) => (
                  <WebButton label="관리" variant="ghost" size="sm" onPress={() => setSelected(row)} />
                )},
              ]}
              data={CASES}
              onRowPress={(row) => setSelected(row)}
            />
          </SectionCard>
        </View>

        {/* Case Detail */}
        {selected && (
          <View style={{ flex: 1, minWidth: 280 }}>
            <SectionCard
              title="사건 상세 관리"
              action={<Pressable onPress={() => setSelected(null)}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A2B4C", marginBottom: 16 }}>
                {selected.client ?? selected.name}
              </Text>

              {selected.accident && (
                <>
                  {[
                    ["사고 내용", selected.accident],
                    ["과실 비율", selected.fault],
                    ["보험사", selected.insurance],
                    ["현재 단계", selected.stage ?? "초기 상담"],
                    ["합의 예상액", selected.amount ?? "미정"],
                  ].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                      <Text style={{ width: 90, fontSize: 12, color: "#718096" }}>{label}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Negotiation Steps */}
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1A2B4C", marginTop: 20, marginBottom: 12 }}>협상 진행 단계</Text>
              {[
                { label: "초기 상담", done: true },
                { label: "서류 검토", done: true },
                { label: "보험사 협상", done: selected.stage === "합의서 작성" || selected.stage === "완료" },
                { label: "합의서 작성", done: selected.stage === "완료" },
                { label: "완료", done: false },
              ].map((step, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: step.done ? "#805AD5" : "#E2E8F0",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ color: step.done ? "#FFF" : "#A0AEC0", fontSize: 11 }}>
                      {step.done ? "✓" : (idx + 1).toString()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: step.done ? "#805AD5" : "#A0AEC0", fontWeight: step.done ? "600" : "400" }}>
                    {step.label}
                  </Text>
                </View>
              ))}

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <WebButton label="단계 업데이트" variant="primary" size="sm" />
                <WebButton label="합의서 업로드" variant="secondary" size="sm" icon="📎" />
                <WebButton label="전화하기" variant="ghost" size="sm" icon="📞" />
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </PartnerLayout>
  );
}
