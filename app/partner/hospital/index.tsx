import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { PartnerLayout } from "@/components/web/PartnerLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const NAV = [
  { label: "대시보드", icon: "📊", path: "/partner/hospital" },
  { label: "진료 예약", icon: "📅", path: "/partner/hospital/appointments" },
  { label: "치료 중인 환자", icon: "🏥", path: "/partner/hospital/patients" },
  { label: "서류 발급 현황", icon: "📋", path: "/partner/hospital/docs" },
  { label: "정산 내역", icon: "💰", path: "/partner/hospital/settlement" },
];

const APPOINTMENTS = [
  { id: "APT-001", time: "15:00", name: "홍길동", age: 35, type: "초진", injury: "경추 염좌", insurance: "삼성화재", accident: "03.28 추돌" },
  { id: "APT-002", time: "15:30", name: "김민수", age: 42, type: "재진", injury: "요추 염좌", insurance: "현대해상", accident: "03.25 측면충돌" },
  { id: "APT-003", time: "16:00", name: "이영희", age: 28, type: "초진", injury: "두부 타박상", insurance: "KB손보", accident: "03.28 주차장" },
];

const PATIENTS = [
  { name: "박철수", injury: "경추 염좌", start: "03.20", treatment: "물리치료", weeks: 2, docs: "진단서 발급", status: "치료중" },
  { name: "최지수", injury: "요추 추간판탈출증", start: "03.15", treatment: "MRI + 물리치료", weeks: 4, docs: "미발급", status: "치료중" },
  { name: "정민호", injury: "무릎 인대 손상", start: "03.10", treatment: "수술 후 재활", weeks: 8, docs: "진단서 발급", status: "치료중" },
  { name: "강수진", injury: "경추 염좌", start: "02.28", treatment: "물리치료", weeks: 4, docs: "진단서 발급", status: "완치" },
];

export default function HospitalPortal() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <PartnerLayout
      title="병원 대시보드"
      subtitle="진료 예약 및 치료 현황 관리"
      partnerType="hospital"
      partnerName="강남세브란스 정형외과"
      navItems={NAV}
    >
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="오늘 예약" value="3건" color="#D53F8C" icon="📅" />
        <StatCard label="치료 중인 환자" value="4명" color="#805AD5" icon="🏥" />
        <StatCard label="서류 발급 대기" value="1건" sub="즉시 처리 필요" color="#DD6B20" icon="📋" />
        <StatCard label="이번 달 매출" value="3,100만원" color="#1A2B4C" icon="💰" />
      </View>

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        <View style={{ flex: selected ? 1 : 2, minWidth: 380 }}>
          {/* Today's Appointments */}
          <SectionCard title="오늘 진료 예약 (3건)">
            {APPOINTMENTS.map((apt) => (
              <View
                key={apt.id}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F7FAFC", flexWrap: "wrap", gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ alignItems: "center", width: 48 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#D53F8C" }}>{apt.time}</Text>
                  </View>
                  <View>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 2 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#1A2B4C" }}>{apt.name}</Text>
                      <Text style={{ fontSize: 12, color: "#718096" }}>({apt.age}세)</Text>
                      <Badge label={apt.type} variant={apt.type === "초진" ? "orange" : "blue"} />
                    </View>
                    <Text style={{ fontSize: 12, color: "#718096" }}>{apt.injury} · {apt.accident}</Text>
                    <Text style={{ fontSize: 11, color: "#A0AEC0" }}>{apt.insurance}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <WebButton label="진료 시작" variant="primary" size="sm" onPress={() => setSelected(apt)} />
                  <WebButton label="취소" variant="danger" size="sm" />
                </View>
              </View>
            ))}
          </SectionCard>

          {/* Patients */}
          <SectionCard title="치료 중인 환자">
            <WebTable
              columns={[
                { key: "name", label: "환자명", width: 0.7 },
                { key: "injury", label: "상병명", width: 1.5 },
                { key: "start", label: "치료 시작", width: 0.7 },
                { key: "treatment", label: "치료 방법", width: 1.2 },
                { key: "weeks", label: "치료 기간", width: 0.7, render: (val) => <Text style={{ color: "#805AD5", fontWeight: "600" }}>{val}주</Text> },
                { key: "docs", label: "서류", width: 0.9, render: (val) => (
                  <Badge label={val} variant={val === "진단서 발급" ? "green" : "orange"} />
                )},
                { key: "status", label: "상태", width: 0.7, render: (val) => (
                  <Badge label={val} variant={val === "치료중" ? "purple" : "green"} />
                )},
                { key: "action", label: "", width: 0.8, render: (_, row) => (
                  <WebButton label="업데이트" variant="ghost" size="sm" onPress={() => setSelected(row)} />
                )},
              ]}
              data={PATIENTS}
            />
          </SectionCard>
        </View>

        {/* Detail / Docs Panel */}
        {selected && (
          <View style={{ flex: 1, minWidth: 280 }}>
            <SectionCard
              title="진료 상세"
              action={<Pressable onPress={() => setSelected(null)}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A2B4C", marginBottom: 16 }}>
                {selected.name ?? selected.user}
              </Text>

              {selected.injury && (
                <>
                  {[
                    ["상병명", selected.injury],
                    ["치료 방법", selected.treatment],
                    ["치료 기간", `${selected.weeks}주`],
                    ["서류 현황", selected.docs],
                  ].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                      <Text style={{ width: 80, fontSize: 12, color: "#718096" }}>{label}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1A2B4C", marginTop: 20, marginBottom: 12 }}>서류 발급</Text>
              {[
                { label: "진단서", desc: "상병명, 치료 기간 포함" },
                { label: "진료 확인서", desc: "방문 일자, 치료 내역" },
                { label: "소견서", desc: "보험사 제출용" },
                { label: "MRI/CT 판독문", desc: "영상 의학 소견" },
              ].map((doc) => (
                <View key={doc.label} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#2D3748" }}>{doc.label}</Text>
                    <Text style={{ fontSize: 11, color: "#A0AEC0" }}>{doc.desc}</Text>
                  </View>
                  <WebButton label="발급" variant="primary" size="sm" />
                </View>
              ))}

              <View style={{ marginTop: 16 }}>
                <WebButton label="치료 기간 업데이트" variant="secondary" />
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </PartnerLayout>
  );
}
