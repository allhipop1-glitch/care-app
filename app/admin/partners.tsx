import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { AdminLayout } from "@/components/web/AdminLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const PENDING_PARTNERS = [
  { id: "P001", name: "서울 빠른공업사", type: "공업사", owner: "김대표", phone: "010-1111-2222", biz: "123-45-67890", date: "03.28", docs: "완비" },
  { id: "P002", name: "강남렉카서비스", type: "렉카", owner: "이사장", phone: "010-2222-3333", biz: "234-56-78901", date: "03.27", docs: "완비" },
  { id: "P003", name: "하나손해사정", type: "손해사정사", owner: "박사정", phone: "010-3333-4444", biz: "345-67-89012", date: "03.26", docs: "일부 누락" },
  { id: "P004", name: "행복렌터카 강남점", type: "렌터카", owner: "최대표", phone: "010-4444-5555", biz: "456-78-90123", date: "03.25", docs: "완비" },
];

const ACTIVE_PARTNERS = [
  { id: "A001", name: "강남 최고공업사", type: "공업사", rating: "4.8", count: 234, response: "94%", status: "활성" },
  { id: "A002", name: "SK렌터카 강남점", type: "렌터카", rating: "4.6", count: 187, response: "91%", status: "활성" },
  { id: "A003", name: "강남세브란스 정형외과", type: "병원", rating: "4.9", count: 312, response: "87%", status: "활성" },
  { id: "A004", name: "교통사고 전문 법률사무소", type: "변호사", rating: "4.7", count: 89, response: "82%", status: "활성" },
  { id: "A005", name: "강남렉카", type: "렉카", rating: "4.5", count: 423, response: "98%", status: "활성" },
  { id: "A006", name: "김손해 손해사정사", type: "손해사정사", rating: "4.6", count: 67, response: "89%", status: "활성" },
  { id: "A007", name: "서초공업사", type: "공업사", rating: "4.3", count: 156, response: "88%", status: "경고" },
];

const TYPE_BADGE: Record<string, any> = {
  "공업사": "blue", "렉카": "orange", "렌터카": "teal",
  "병원": "purple", "변호사": "gray", "손해사정사": "green",
};

export default function AdminPartners() {
  const [tab, setTab] = useState<"pending" | "active">("pending");
  const [selected, setSelected] = useState<any>(null);

  return (
    <AdminLayout title="파트너 관리" subtitle="파트너 인증 심사 및 현황 관리">
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="전체 파트너" value="238개" color="#3182CE" icon="🏢" />
        <StatCard label="인증 심사 대기" value="4건" sub="즉시 처리 필요" color="#DD6B20" icon="⏳" />
        <StatCard label="이번 달 신규" value="12개" color="#38A169" icon="✨" />
        <StatCard label="경고 파트너" value="2개" color="#E53E3E" icon="⚠️" />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 0, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden", alignSelf: "flex-start" }}>
        {[
          { key: "pending", label: "인증 심사 대기 (4)" },
          { key: "active", label: "전체 파트너 (238)" },
        ].map((t) => (
          <Pressable
            key={t.key}
            onPress={() => { setTab(t.key as any); setSelected(null); }}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: tab === t.key ? "#1A2B4C" : "#FFFFFF",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: tab === t.key ? "#FFFFFF" : "#718096" }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        <View style={{ flex: selected ? 1 : 2, minWidth: 400 }}>
          {tab === "pending" ? (
            <SectionCard title="인증 심사 대기 목록">
              <WebTable
                columns={[
                  { key: "name", label: "업체명", width: 1.2 },
                  { key: "type", label: "업종", width: 0.7, render: (val) => <Badge label={val} variant={TYPE_BADGE[val] ?? "gray"} /> },
                  { key: "owner", label: "대표자", width: 0.7 },
                  { key: "date", label: "신청일", width: 0.6 },
                  { key: "docs", label: "서류", width: 0.7, render: (val) => (
                    <Badge label={val} variant={val === "완비" ? "green" : "orange"} />
                  )},
                  { key: "action", label: "", width: 1, render: (_, row) => (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <WebButton label="승인" variant="success" size="sm" onPress={() => setSelected(row)} />
                      <WebButton label="거절" variant="danger" size="sm" />
                    </View>
                  )},
                ]}
                data={PENDING_PARTNERS}
                onRowPress={(row) => setSelected(row)}
              />
            </SectionCard>
          ) : (
            <SectionCard title="전체 파트너 목록">
              <WebTable
                columns={[
                  { key: "name", label: "업체명", width: 1.5 },
                  { key: "type", label: "업종", width: 0.8, render: (val) => <Badge label={val} variant={TYPE_BADGE[val] ?? "gray"} /> },
                  { key: "rating", label: "별점", width: 0.6, render: (val) => <Text style={{ color: "#DD6B20", fontWeight: "700" }}>★ {val}</Text> },
                  { key: "count", label: "처리건수", width: 0.7, render: (val) => <Text style={{ color: "#3182CE", fontWeight: "600" }}>{val}건</Text> },
                  { key: "response", label: "응답률", width: 0.7 },
                  { key: "status", label: "상태", width: 0.7, render: (val) => (
                    <Badge label={val} variant={val === "활성" ? "green" : val === "경고" ? "orange" : "red"} />
                  )},
                  { key: "action", label: "", width: 0.5, render: (_, row) => (
                    <WebButton label="관리" variant="ghost" size="sm" onPress={() => setSelected(row)} />
                  )},
                ]}
                data={ACTIVE_PARTNERS}
                onRowPress={(row) => setSelected(row)}
              />
            </SectionCard>
          )}
        </View>

        {/* Detail */}
        {selected && (
          <View style={{ flex: 1, minWidth: 280 }}>
            <SectionCard
              title={tab === "pending" ? "심사 상세" : "파트너 상세"}
              action={<Pressable onPress={() => setSelected(null)}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              <View style={{ marginBottom: 12 }}>
                <Badge label={selected.type} variant={TYPE_BADGE[selected.type] ?? "gray"} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A2B4C", marginBottom: 16 }}>{selected.name}</Text>

              {tab === "pending" ? (
                <>
                  {[
                    ["대표자", selected.owner],
                    ["연락처", selected.phone],
                    ["사업자번호", selected.biz],
                    ["신청일", selected.date],
                    ["서류 현황", selected.docs],
                  ].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                      <Text style={{ width: 90, fontSize: 12, color: "#718096" }}>{label}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                    </View>
                  ))}

                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 12, color: "#718096", marginBottom: 8 }}>제출 서류</Text>
                    {["사업자등록증", "자격증/면허증", "보험 가입 증명서"].map((doc) => (
                      <View key={doc} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8 }}>
                        <Text style={{ color: "#38A169" }}>✓</Text>
                        <Text style={{ fontSize: 13, color: "#2D3748" }}>{doc}</Text>
                        <WebButton label="보기" variant="ghost" size="sm" />
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 20 }}>
                    <WebButton label="✓ 승인" variant="success" />
                    <WebButton label="✕ 거절" variant="danger" />
                    <WebButton label="서류 요청" variant="ghost" />
                  </View>
                </>
              ) : (
                <>
                  {[
                    ["별점", `★ ${selected.rating}`],
                    ["처리 건수", `${selected.count}건`],
                    ["응답률", selected.response],
                    ["현재 상태", selected.status],
                  ].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F7FAFC" }}>
                      <Text style={{ width: 90, fontSize: 12, color: "#718096" }}>{label}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                    <WebButton label="인증 배지 OFF" variant="danger" size="sm" />
                    <WebButton label="경고 발송" variant="ghost" size="sm" />
                    <WebButton label="정산 내역" variant="secondary" size="sm" />
                  </View>
                </>
              )}
            </SectionCard>
          </View>
        )}
      </View>
    </AdminLayout>
  );
}
