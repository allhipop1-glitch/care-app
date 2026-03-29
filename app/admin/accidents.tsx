import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { AdminLayout } from "@/components/web/AdminLayout";
import { SectionCard, Badge, WebButton, WebTable, Timeline } from "@/components/web/WebUI";

const ALL_ACCIDENTS = [
  { id: "ACC-001", date: "03.28 14:32", type: "추돌", location: "강남 테헤란로 152", user: "홍길동", phone: "010-1234-5678", insurance: "삼성화재", status: "파트너매칭", garage: "배정 중", tow: "완료", rental: "대기", hospital: "-", lawyer: "-" },
  { id: "ACC-002", date: "03.28 13:15", type: "측면충돌", location: "송파 올림픽로 300", user: "김민수", phone: "010-2345-6789", insurance: "현대해상", status: "수리중", garage: "강남공업사", tow: "완료", rental: "SK렌터카", hospital: "-", lawyer: "-" },
  { id: "ACC-003", date: "03.28 11:40", type: "주차장", location: "분당 정자동 10", user: "이영희", phone: "010-3456-7890", insurance: "KB손보", status: "완료", garage: "분당공업사", tow: "완료", rental: "완료", hospital: "분당서울대", lawyer: "-" },
  { id: "ACC-004", date: "03.28 10:22", type: "단독", location: "서초 반포대로 58", user: "박철수", phone: "010-4567-8901", insurance: "DB손보", status: "렌터카이용", garage: "서초공업사", tow: "완료", rental: "롯데렌터카", hospital: "-", lawyer: "-" },
  { id: "ACC-005", date: "03.28 09:05", type: "추돌", location: "마포 홍대입구역", user: "최지수", phone: "010-5678-9012", insurance: "메리츠화재", status: "병원치료", garage: "마포공업사", tow: "완료", rental: "완료", hospital: "세브란스", lawyer: "김법률" },
  { id: "ACC-006", date: "03.27 16:30", type: "보행자", location: "강동 천호대로 100", user: "정민호", phone: "010-6789-0123", insurance: "삼성화재", status: "합의중", garage: "강동공업사", tow: "완료", rental: "완료", hospital: "강동성심", lawyer: "이변호사" },
  { id: "ACC-007", date: "03.27 14:10", type: "추돌", location: "노원 상계동 5", user: "강수진", phone: "010-7890-1234", insurance: "현대해상", status: "완료", garage: "노원공업사", tow: "완료", rental: "완료", hospital: "노원을지", lawyer: "-" },
];

const STATUS_BADGE: Record<string, any> = {
  "파트너매칭": { label: "파트너 매칭 중", variant: "orange" },
  "수리중": { label: "수리 중", variant: "blue" },
  "렌터카이용": { label: "렌터카 이용 중", variant: "teal" },
  "병원치료": { label: "병원 치료 중", variant: "purple" },
  "합의중": { label: "합의 진행 중", variant: "gray" },
  "완료": { label: "완료", variant: "green" },
};

const TIMELINE_STEPS = ["접수", "견인", "수리", "렌터카", "병원", "합의", "완료"];

export default function AdminAccidents() {
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("전체");

  const filters = ["전체", "파트너매칭", "수리중", "렌터카이용", "병원치료", "합의중", "완료"];

  const filtered = filter === "전체" ? ALL_ACCIDENTS : ALL_ACCIDENTS.filter((a) => a.status === filter);

  return (
    <AdminLayout title="사고 관리" subtitle="전체 사고 접수 현황">
      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        {/* List */}
        <View style={{ flex: selected ? 1 : 2, minWidth: 400 }}>
          <SectionCard title={`전체 사고 목록 (${filtered.length}건)`}>
            {/* Filter Tabs */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {filters.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: filter === f ? "#1A2B4C" : "#F7FAFC",
                    borderWidth: 1,
                    borderColor: filter === f ? "#1A2B4C" : "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: filter === f ? "#FFFFFF" : "#718096", fontWeight: "600" }}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>

            <WebTable
              columns={[
                { key: "id", label: "사고 ID", width: 0.8 },
                { key: "date", label: "접수 일시", width: 0.9 },
                { key: "type", label: "유형", width: 0.6 },
                { key: "user", label: "사용자", width: 0.7 },
                {
                  key: "status",
                  label: "상태",
                  width: 1.2,
                  render: (val) => {
                    const s = STATUS_BADGE[val];
                    return s ? <Badge label={s.label} variant={s.variant} /> : <Text>{val}</Text>;
                  },
                },
                {
                  key: "action",
                  label: "",
                  width: 0.5,
                  render: (_, row) => (
                    <WebButton label="상세" variant="ghost" size="sm" onPress={() => setSelected(row)} />
                  ),
                },
              ]}
              data={filtered}
              onRowPress={(row) => setSelected(row)}
            />
          </SectionCard>
        </View>

        {/* Detail Panel */}
        {selected && (
          <View style={{ flex: 1, minWidth: 320 }}>
            <SectionCard
              title={`사고 상세 — ${selected.id}`}
              action={
                <Pressable onPress={() => setSelected(null)}>
                  <Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text>
                </Pressable>
              }
            >
              {/* Timeline */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#718096", fontWeight: "600", marginBottom: 8 }}>처리 단계</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {TIMELINE_STEPS.map((step, idx) => {
                    const statusMap: Record<string, number> = {
                      "파트너매칭": 0, "수리중": 2, "렌터카이용": 3,
                      "병원치료": 4, "합의중": 5, "완료": 6,
                    };
                    const statusIdx = statusMap[selected.status] ?? 0;
                    const done = idx <= statusIdx;
                    const current = idx === statusIdx;
                    return (
                      <View key={step} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{
                          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
                          backgroundColor: current ? "#3182CE" : done ? "#F0FFF4" : "#F7FAFC",
                          borderWidth: 1,
                          borderColor: current ? "#3182CE" : done ? "#38A169" : "#E2E8F0",
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: current ? "700" : "500",
                            color: current ? "#FFF" : done ? "#38A169" : "#A0AEC0" }}>
                            {done && !current ? "✓ " : ""}{step}
                          </Text>
                        </View>
                        {idx < TIMELINE_STEPS.length - 1 && <Text style={{ color: "#CBD5E0", fontSize: 10 }}>→</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Info */}
              {[
                ["접수 일시", selected.date],
                ["사고 유형", selected.type],
                ["위치", selected.location],
                ["사용자", `${selected.user} · ${selected.phone}`],
                ["보험사", selected.insurance],
              ].map(([label, value]) => (
                <View key={label} style={{ flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                  <Text style={{ width: 80, fontSize: 12, color: "#718096" }}>{label}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                </View>
              ))}

              {/* Partners */}
              <Text style={{ fontSize: 12, color: "#718096", fontWeight: "600", marginTop: 16, marginBottom: 8 }}>담당 파트너</Text>
              {[
                ["공업사", selected.garage],
                ["렉카", selected.tow],
                ["렌터카", selected.rental],
                ["병원", selected.hospital],
                ["변호사", selected.lawyer],
              ].map(([type, partner]) => (
                <View key={type} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                  <Text style={{ fontSize: 12, color: "#718096", width: 60 }}>{type}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: partner === "-" || partner === "대기" ? "#A0AEC0" : "#2D3748", fontWeight: "500" }}>
                    {partner === "-" ? "미배정" : partner}
                  </Text>
                  {(partner === "-" || partner === "대기") && (
                    <WebButton label="배정" variant="secondary" size="sm" />
                  )}
                </View>
              ))}

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <WebButton label="메모 추가" variant="ghost" size="sm" icon="📝" />
                <WebButton label="강제 완료" variant="danger" size="sm" icon="✓" />
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </AdminLayout>
  );
}
