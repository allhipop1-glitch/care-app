import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { PartnerLayout } from "@/components/web/PartnerLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const NAV = [
  { label: "대시보드", icon: "📊", path: "/partner/adjuster" },
  { label: "평가 요청", icon: "📩", path: "/partner/adjuster/requests" },
  { label: "진행 중인 평가", icon: "📋", path: "/partner/adjuster/active" },
  { label: "완료 내역", icon: "✅", path: "/partner/adjuster/done" },
  { label: "정산 내역", icon: "💰", path: "/partner/adjuster/settlement" },
];

const ACTIVE_CASES = [
  { id: "ADJ-001", client: "홍길동", accident: "03.28 추돌", repair: "450만원", medical: "120만원", depreciation: "45만원", consolation: "200만원", total: "815만원", status: "서류검토" },
  { id: "ADJ-002", client: "이영희", accident: "03.20 측면충돌", repair: "680만원", medical: "340만원", depreciation: "68만원", consolation: "350만원", total: "1,438만원", status: "평가중" },
  { id: "ADJ-003", client: "박철수", accident: "03.10 단독", repair: "230만원", medical: "0", depreciation: "23만원", consolation: "100만원", total: "353만원", status: "완료" },
];

const NEW_REQUESTS = [
  { id: "REQ-001", name: "최지수", accident: "03.28 추돌", insurance: "메리츠화재", docs: "완비" },
];

export default function AdjusterPortal() {
  const [selected, setSelected] = useState<any>(null);
  const [repairAmt, setRepairAmt] = useState("");
  const [medicalAmt, setMedicalAmt] = useState("");
  const [deprAmt, setDeprAmt] = useState("");
  const [consAmt, setConsAmt] = useState("");

  const total = [repairAmt, medicalAmt, deprAmt, consAmt]
    .map((v) => parseInt(v.replace(/,/g, "")) || 0)
    .reduce((a, b) => a + b, 0);

  return (
    <PartnerLayout
      title="손해사정사 대시보드"
      subtitle="손해 평가 및 서류 검토 현황"
      partnerType="adjuster"
      partnerName="하나손해사정"
      navItems={NAV}
    >
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="신규 평가 요청" value="1건" color="#DD6B20" icon="📩" />
        <StatCard label="진행 중인 평가" value="2건" color="#319795" icon="📋" />
        <StatCard label="이번 달 완료" value="9건" color="#38A169" icon="✅" />
        <StatCard label="이번 달 매출" value="900만원" color="#1A2B4C" icon="💰" />
      </View>

      {/* New Request */}
      {NEW_REQUESTS.map((req) => (
        <View
          key={req.id}
          style={{
            borderWidth: 2, borderColor: "#319795", borderRadius: 12,
            backgroundColor: "#E6FFFA", padding: 16, marginBottom: 20,
            flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 24 }}>📋</Text>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A2B4C" }}>신규 손해 평가 요청 — {req.name}</Text>
              <Text style={{ fontSize: 12, color: "#718096" }}>
                {req.accident} · {req.insurance} · 서류 {req.docs}
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
          {/* Cases Table */}
          <SectionCard title="진행 중인 손해 평가">
            <WebTable
              columns={[
                { key: "client", label: "의뢰인", width: 0.7 },
                { key: "accident", label: "사고 내용", width: 1 },
                { key: "repair", label: "수리비", width: 0.8 },
                { key: "medical", label: "치료비", width: 0.8 },
                { key: "depreciation", label: "격락손해", width: 0.8 },
                { key: "consolation", label: "위자료", width: 0.8 },
                { key: "total", label: "합계", width: 0.9, render: (val) => (
                  <Text style={{ fontWeight: "800", color: "#319795" }}>{val}</Text>
                )},
                { key: "status", label: "상태", width: 0.8, render: (val) => (
                  <Badge label={val} variant={val === "완료" ? "green" : val === "평가중" ? "teal" : "gray"} />
                )},
                { key: "action", label: "", width: 0.6, render: (_, row) => (
                  <WebButton label="작성" variant="ghost" size="sm" onPress={() => setSelected(row)} />
                )},
              ]}
              data={ACTIVE_CASES}
            />
          </SectionCard>
        </View>

        {/* Assessment Form */}
        {selected && (
          <View style={{ flex: 1, minWidth: 300 }}>
            <SectionCard
              title="손해 평가서 작성"
              action={<Pressable onPress={() => setSelected(null)}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 }}>
                {selected.client ?? selected.name}
              </Text>
              <Text style={{ fontSize: 12, color: "#718096", marginBottom: 20 }}>
                {selected.accident}
              </Text>

              {/* Amount Inputs */}
              {[
                { label: "수리비", key: "repair", state: repairAmt, setState: setRepairAmt, hint: "견적서 기준" },
                { label: "치료비", key: "medical", state: medicalAmt, setState: setMedicalAmt, hint: "진단서 기준" },
                { label: "격락손해", key: "depreciation", state: deprAmt, setState: setDeprAmt, hint: "수리비의 10~15%" },
                { label: "위자료", key: "consolation", state: consAmt, setState: setConsAmt, hint: "상해 등급 기준" },
              ].map((field) => (
                <View key={field.key} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#2D3748" }}>{field.label}</Text>
                    <Text style={{ fontSize: 11, color: "#A0AEC0" }}>{field.hint}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                    <TextInput
                      value={field.state}
                      onChangeText={field.setState}
                      placeholder="0"
                      keyboardType="numeric"
                      style={{ flex: 1, padding: 10, fontSize: 14, color: "#2D3748" }}
                    />
                    <View style={{ backgroundColor: "#F7FAFC", paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Text style={{ fontSize: 12, color: "#718096" }}>만원</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Total */}
              <View style={{ backgroundColor: "#E6FFFA", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#319795", fontWeight: "600", marginBottom: 4 }}>손해 합계</Text>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#234E52" }}>
                  {total > 0 ? `${total.toLocaleString()}만원` : "—"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <WebButton label="평가서 저장" variant="primary" />
                <WebButton label="보험사 제출" variant="success" />
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </PartnerLayout>
  );
}
