import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AdminLayout } from "@/components/web/AdminLayout";
import { StatCard, SectionCard, Badge, WebButton, WebTable, Timeline } from "@/components/web/WebUI";

// Mock data
const RECENT_ACCIDENTS = [
  { id: "ACC-001", time: "14:32", type: "추돌", location: "강남 테헤란로", user: "홍길동", status: "파트너매칭", partner: "배정 중" },
  { id: "ACC-002", time: "13:15", type: "측면충돌", location: "송파 올림픽로", user: "김민수", status: "수리중", partner: "강남공업사" },
  { id: "ACC-003", time: "11:40", type: "주차장", location: "분당 정자동", user: "이영희", status: "완료", partner: "-" },
  { id: "ACC-004", time: "10:22", type: "단독", location: "서초 반포대로", user: "박철수", status: "렌터카이용", partner: "SK렌터카" },
  { id: "ACC-005", time: "09:05", type: "추돌", location: "마포 홍대입구", user: "최지수", status: "병원치료", partner: "세브란스" },
];

const PARTNER_RESPONSE = [
  { type: "공업사", rate: 94, count: 23 },
  { type: "렉카", rate: 98, count: 47 },
  { type: "렌터카", rate: 91, count: 18 },
  { type: "병원", rate: 87, count: 31 },
  { type: "변호사", rate: 82, count: 12 },
  { type: "손해사정사", rate: 89, count: 9 },
];

const STATUS_BADGE: Record<string, any> = {
  "파트너매칭": { label: "파트너 매칭 중", variant: "orange" },
  "수리중": { label: "수리 중", variant: "blue" },
  "렌터카이용": { label: "렌터카 이용 중", variant: "teal" },
  "병원치료": { label: "병원 치료 중", variant: "purple" },
  "완료": { label: "완료", variant: "green" },
};

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <AdminLayout title="대시보드" subtitle="실시간 플랫폼 현황">
      {/* Stats Row */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="오늘 신규 사고" value="12건" sub="전일 대비 +3" color="#E53E3E" icon="🚨" />
        <StatCard label="처리 중인 사고" value="47건" sub="파트너 배정 완료" color="#DD6B20" icon="🔄" />
        <StatCard label="오늘 매출" value="1,240만원" sub="수수료 62만원" color="#38A169" icon="💰" />
        <StatCard label="활성 파트너" value="238개" sub="전체 파트너 중" color="#3182CE" icon="🏢" />
        <StatCard label="가입 사용자" value="4,821명" sub="이번 달 +142명" color="#805AD5" icon="👥" />
      </View>

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        {/* 실시간 사고 목록 */}
        <View style={{ flex: 2, minWidth: 400 }}>
          <SectionCard
            title="오늘 사고 목록 (실시간)"
            action={<WebButton label="전체 보기" variant="secondary" size="sm" onPress={() => router.push("/admin/accidents" as any)} />}
          >
            <WebTable
              columns={[
                { key: "time", label: "시간", width: 0.5 },
                { key: "type", label: "유형", width: 0.7 },
                { key: "location", label: "위치", width: 1.2 },
                { key: "user", label: "사용자", width: 0.8 },
                {
                  key: "status",
                  label: "상태",
                  width: 1.2,
                  render: (val) => {
                    const s = STATUS_BADGE[val];
                    return s ? <Badge label={s.label} variant={s.variant} /> : <Text>{val}</Text>;
                  },
                },
                { key: "partner", label: "담당 파트너", width: 1 },
              ]}
              data={RECENT_ACCIDENTS}
              onRowPress={(row) => router.push(`/admin/accidents?id=${row.id}` as any)}
            />
          </SectionCard>

          {/* 처리 현황 타임라인 */}
          <SectionCard title="사고 처리 단계별 현황">
            {[
              { label: "접수", count: 12, color: "#E53E3E" },
              { label: "견인", count: 8, color: "#DD6B20" },
              { label: "수리 중", count: 15, color: "#3182CE" },
              { label: "렌터카", count: 11, color: "#319795" },
              { label: "병원", count: 9, color: "#D53F8C" },
              { label: "합의", count: 5, color: "#805AD5" },
              { label: "완료", count: 47, color: "#38A169" },
            ].map((step) => (
              <View
                key={step.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ width: 70, fontSize: 13, color: "#718096" }}>{step.label}</Text>
                <View style={{ flex: 1, height: 24, backgroundColor: "#F7FAFC", borderRadius: 4, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${Math.min((step.count / 50) * 100, 100)}%`,
                      height: "100%",
                      backgroundColor: step.color,
                      borderRadius: 4,
                      justifyContent: "center",
                      paddingLeft: 8,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>{step.count}건</Text>
                  </View>
                </View>
              </View>
            ))}
          </SectionCard>
        </View>

        {/* Right Column */}
        <View style={{ flex: 1, minWidth: 260 }}>
          {/* 파트너 응답률 */}
          <SectionCard title="파트너 응답률">
            {PARTNER_RESPONSE.map((p) => (
              <View key={p.type} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, color: "#2D3748", fontWeight: "500" }}>{p.type}</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: p.rate >= 95 ? "#38A169" : p.rate >= 85 ? "#DD6B20" : "#E53E3E",
                    }}
                  >
                    {p.rate}%
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: "#F7FAFC", borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${p.rate}%`,
                      height: "100%",
                      backgroundColor: p.rate >= 95 ? "#38A169" : p.rate >= 85 ? "#DD6B20" : "#E53E3E",
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            ))}
          </SectionCard>

          {/* 인증 심사 대기 */}
          <SectionCard
            title="인증 심사 대기"
            action={<WebButton label="전체 보기" variant="secondary" size="sm" onPress={() => router.push("/admin/partners" as any)} />}
          >
            {[
              { name: "서울 빠른공업사", type: "공업사", date: "03.28" },
              { name: "강남렉카서비스", type: "렉카", date: "03.27" },
              { name: "하나손해사정", type: "손해사정사", date: "03.26" },
            ].map((p, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: idx < 2 ? 1 : 0,
                  borderBottomColor: "#F7FAFC",
                }}
              >
                <View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#2D3748" }}>{p.name}</Text>
                  <Text style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2 }}>{p.type} · {p.date} 신청</Text>
                </View>
                <WebButton label="심사" variant="secondary" size="sm" />
              </View>
            ))}
          </SectionCard>

          {/* 최근 알림 */}
          <SectionCard title="최근 알림">
            {[
              { msg: "렉카 응답 없음 — ACC-003", time: "5분 전", color: "#E53E3E" },
              { msg: "새 파트너 가입 신청 3건", time: "1시간 전", color: "#DD6B20" },
              { msg: "이번 달 매출 목표 80% 달성", time: "2시간 전", color: "#38A169" },
              { msg: "렌터카 D-day 알림 발송 완료", time: "3시간 전", color: "#3182CE" },
            ].map((n, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  paddingVertical: 8,
                  borderBottomWidth: idx < 3 ? 1 : 0,
                  borderBottomColor: "#F7FAFC",
                  gap: 8,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: n.color, marginTop: 5 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "#2D3748" }}>{n.msg}</Text>
                  <Text style={{ fontSize: 11, color: "#A0AEC0", marginTop: 2 }}>{n.time}</Text>
                </View>
              </View>
            ))}
          </SectionCard>
        </View>
      </View>
    </AdminLayout>
  );
}
