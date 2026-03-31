import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { PartnerLayout } from "@/components/web/PartnerLayout";
import { SectionCard, Badge, WebButton, StatCard } from "@/components/web/WebUI";

const NAV = [
  { label: "대시보드", icon: "📊", path: "/partner/tow" },
  { label: "출동 요청", icon: "🚨", path: "/partner/tow/requests" },
  { label: "완료 내역", icon: "✅", path: "/partner/tow/done" },
  { label: "정산 내역", icon: "💰", path: "/partner/tow/settlement" },
  { label: "내 업체 정보", icon: "🚛", path: "/partner/tow/profile" },
];

const DISPATCH_REQUESTS = [
  {
    id: "TOW-001", time: "14:32", type: "추돌", car: "현대 아반떼 (23가 1234)",
    from: "강남 테헤란로 152", to: "강남 최고공업사 (2.3km)", user: "홍길동",
    phone: "010-1234-5678", distance: "1.2km", timer: 60,
  },
];

export default function TowPortal() {
  const [request, setRequest] = useState(DISPATCH_REQUESTS[0]);
  const [timer, setTimer] = useState(60);
  const [accepted, setAccepted] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    if (!accepted && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [accepted, timer]);

  const timerColor = timer > 30 ? "#38A169" : timer > 10 ? "#DD6B20" : "#E53E3E";

  return (
    <PartnerLayout
      title="렉카 대시보드"
      subtitle="출동 요청 수신 및 현황"
      partnerType="tow"
      partnerName="강남렉카서비스"
      navItems={NAV}
    >
      {/* 출동 요청 긴급 알림 */}
      {!accepted && DISPATCH_REQUESTS.length > 0 && (
        <View style={{ backgroundColor: "#FFF5F5", borderWidth: 2.5, borderColor: "#E53E3E", borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 24 }}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#E53E3E" }}>긴급 출동 요청이 도착했습니다!</Text>
            <Text style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>잔여 {timer}초 · 미응답 시 자동 다음 렉카로 전달됩니다</Text>
          </View>
          <View style={{ backgroundColor: timer > 30 ? "#E53E3E" : "#C53030", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>{timer}s</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="오늘 출동" value="8건" color="#DD6B20" icon="🚛" />
        <StatCard label="이번 달 출동" value="47건" color="#3182CE" icon="📊" />
        <StatCard label="평균 응답 시간" value="42초" sub="목표: 60초 이내" color="#38A169" icon="⚡" />
        <StatCard label="이번 달 매출" value="940만원" color="#1A2B4C" icon="💰" />
      </View>

      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        {/* Dispatch Alert */}
        <View style={{ flex: 1, minWidth: 320 }}>
          {!accepted ? (
            <View
              style={{
                borderWidth: 3, borderColor: "#DD6B20", borderRadius: 16,
                backgroundColor: "#FFFAF0", overflow: "hidden", marginBottom: 20,
              }}
            >
              {/* Alert Header */}
              <View style={{ backgroundColor: "#DD6B20", padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>🚨</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>출동 요청 수신!</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "800" }}>{timer}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10 }}>초 내 응답</Text>
                </View>
              </View>

              {/* Timer Bar */}
              <View style={{ height: 6, backgroundColor: "#FED7AA" }}>
                <View style={{ width: `${(timer / 60) * 100}%`, height: "100%", backgroundColor: timerColor }} />
              </View>

              {/* Request Info */}
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  <Badge label={request.type} variant="orange" />
                  <Text style={{ fontSize: 12, color: "#718096" }}>{request.time} 접수</Text>
                </View>

                <Text style={{ fontSize: 16, fontWeight: "700", color: "#1A2B4C", marginBottom: 12 }}>
                  {request.car}
                </Text>

                {[
                  ["📍 사고 위치", request.from],
                  ["🏭 목적지", request.to],
                  ["👤 사용자", `${request.user} · ${request.phone}`],
                  ["📏 내 위치에서", request.distance],
                ].map(([label, value]) => (
                  <View key={label as string} style={{ flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#FED7AA" }}>
                    <Text style={{ width: 110, fontSize: 12, color: "#718096" }}>{label}</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: "#2D3748", fontWeight: "500" }}>{value}</Text>
                  </View>
                ))}

                <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                  <Pressable
                    onPress={() => setAccepted(true)}
                    style={{ flex: 2, backgroundColor: "#DD6B20", borderRadius: 12, padding: 16, alignItems: "center" }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>✓ 출동 수락</Text>
                  </Pressable>
                  <Pressable
                    style={{ flex: 1, backgroundColor: "#FFF5F5", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#FEB2B2" }}
                  >
                    <Text style={{ color: "#E53E3E", fontSize: 14, fontWeight: "700" }}>거절</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ borderWidth: 2, borderColor: "#38A169", borderRadius: 16, backgroundColor: "#F0FFF4", padding: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Text style={{ fontSize: 20 }}>✅</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#38A169" }}>출동 수락 완료</Text>
              </View>
              <Text style={{ fontSize: 14, color: "#2D3748", marginBottom: 4 }}>{request.car}</Text>
              <Text style={{ fontSize: 13, color: "#718096", marginBottom: 16 }}>📍 {request.from}</Text>

              {/* Status Steps */}
              <View style={{ gap: 8 }}>
                {[
                  { label: "수락 완료", done: true },
                  { label: "출발", done: dispatching },
                  { label: "현장 도착", done: false },
                  { label: "견인 완료", done: false },
                ].map((step, idx) => (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: step.done ? "#38A169" : "#E2E8F0",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ color: step.done ? "#FFFFFF" : "#A0AEC0", fontSize: 12 }}>
                        {step.done ? "✓" : (idx + 1).toString()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: step.done ? "#38A169" : "#A0AEC0", fontWeight: step.done ? "600" : "400" }}>
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <WebButton label="출발 완료" variant="success" onPress={() => setDispatching(true)} />
                <WebButton label="전화하기" variant="secondary" icon="📞" />
              </View>
            </View>
          )}
        </View>

        {/* Today's Summary */}
        <View style={{ flex: 1, minWidth: 280 }}>
          <SectionCard title="오늘 출동 내역">
            {[
              { time: "11:20", car: "기아 K5", from: "서초 방배동", status: "완료" },
              { time: "10:05", car: "현대 투싼", from: "강남 역삼동", status: "완료" },
              { time: "09:30", car: "BMW 320i", from: "송파 잠실", status: "완료" },
            ].map((item, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F7FAFC", gap: 12 }}>
                <Text style={{ fontSize: 12, color: "#718096", width: 40 }}>{item.time}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#2D3748" }}>{item.car}</Text>
                  <Text style={{ fontSize: 11, color: "#A0AEC0" }}>{item.from}</Text>
                </View>
                <Badge label={item.status} variant="green" />
              </View>
            ))}
          </SectionCard>

          <SectionCard title="내 위치 상태">
            <View style={{ padding: 16, backgroundColor: "#F0FFF4", borderRadius: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🟢</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#38A169" }}>출동 가능</Text>
              <Text style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>강남구 테헤란로 인근</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <WebButton label="출동 불가 전환" variant="danger" size="sm" />
              <WebButton label="위치 업데이트" variant="ghost" size="sm" />
            </View>
          </SectionCard>
        </View>
      </View>
    </PartnerLayout>
  );
}
