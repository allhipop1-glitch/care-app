import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { AdminLayout } from "@/components/web/AdminLayout";
import { SectionCard, Badge, WebButton, WebTable, StatCard } from "@/components/web/WebUI";

const SETTLEMENT_DATA = [
  { name: "강남 최고공업사", type: "공업사", count: 23, revenue: "4,600만원", fee: "230만원", net: "4,370만원", status: "정산대기" },
  { name: "SK렌터카 강남점", type: "렌터카", count: 18, revenue: "1,800만원", fee: "90만원", net: "1,710만원", status: "정산완료" },
  { name: "강남세브란스 정형외과", type: "병원", count: 31, revenue: "3,100만원", fee: "155만원", net: "2,945만원", status: "정산대기" },
  { name: "교통사고 전문 법률사무소", type: "변호사", count: 12, revenue: "2,400만원", fee: "120만원", net: "2,280만원", status: "정산완료" },
  { name: "강남렉카", type: "렉카", count: 47, revenue: "940만원", fee: "47만원", net: "893만원", status: "정산대기" },
  { name: "김손해 손해사정사", type: "손해사정사", count: 9, revenue: "900만원", fee: "45만원", net: "855만원", status: "정산완료" },
  { name: "서초공업사", type: "공업사", count: 15, revenue: "3,000만원", fee: "150만원", net: "2,850만원", status: "정산요청" },
];

const TYPE_BADGE: Record<string, any> = {
  "공업사": "blue", "렉카": "orange", "렌터카": "teal",
  "병원": "purple", "변호사": "gray", "손해사정사": "green",
};

export default function AdminSettlement() {
  const [month, setMonth] = useState("2026년 3월");

  return (
    <AdminLayout title="정산 관리" subtitle="파트너별 수수료 정산 현황">
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="이번 달 총 매출" value="1억 6,740만원" color="#1A2B4C" icon="💳" />
        <StatCard label="수수료 수익 (5%)" value="2,340만원" sub="목표 대비 94%" color="#38A169" icon="💰" />
        <StatCard label="정산 대기" value="3건" sub="즉시 처리 가능" color="#DD6B20" icon="⏳" />
        <StatCard label="정산 요청" value="1건" sub="확인 필요" color="#E53E3E" icon="🔔" />
      </View>

      <SectionCard
        title={`정산 현황 — ${month}`}
        action={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <WebButton label="엑셀 다운로드" variant="ghost" size="sm" icon="📥" />
            <WebButton label="전체 정산 처리" variant="primary" size="sm" />
          </View>
        }
      >
        <WebTable
          columns={[
            { key: "name", label: "업체명", width: 1.5 },
            { key: "type", label: "업종", width: 0.8, render: (val) => <Badge label={val} variant={TYPE_BADGE[val] ?? "gray"} /> },
            { key: "count", label: "처리건수", width: 0.7, render: (val) => <Text style={{ color: "#3182CE", fontWeight: "600" }}>{val}건</Text> },
            { key: "revenue", label: "총 매출", width: 0.9 },
            { key: "fee", label: "수수료(5%)", width: 0.9, render: (val) => <Text style={{ color: "#38A169", fontWeight: "600" }}>{val}</Text> },
            { key: "net", label: "정산 예정액", width: 0.9, render: (val) => <Text style={{ fontWeight: "700", color: "#1A2B4C" }}>{val}</Text> },
            {
              key: "status", label: "상태", width: 0.9,
              render: (val) => (
                <Badge
                  label={val}
                  variant={val === "정산완료" ? "green" : val === "정산요청" ? "orange" : "gray"}
                />
              ),
            },
            {
              key: "action", label: "", width: 0.8,
              render: (_, row) => row.status !== "정산완료" ? (
                <WebButton label="정산 처리" variant="primary" size="sm" />
              ) : (
                <WebButton label="내역 보기" variant="ghost" size="sm" />
              ),
            },
          ]}
          data={SETTLEMENT_DATA}
        />

        {/* Summary */}
        <View
          style={{
            marginTop: 16, padding: 16, backgroundColor: "#F7FAFC",
            borderRadius: 8, flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}
        >
          {[
            { label: "총 처리 건수", value: "155건" },
            { label: "총 매출 합계", value: "1억 6,740만원" },
            { label: "수수료 합계", value: "837만원" },
            { label: "정산 예정 합계", value: "1억 5,903만원" },
          ].map((s) => (
            <View key={s.label} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#718096" }}>{s.label}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A2B4C", marginTop: 4 }}>{s.value}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </AdminLayout>
  );
}
