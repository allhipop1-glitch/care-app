import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";

const PORTALS = [
  { type: "garage", label: "공업사", icon: "🔧", desc: "차량 수리 의뢰 수신 및 수리 상태 관리", color: "#3182CE", bg: "#EBF8FF", path: "/partner/garage" },
  { type: "tow", label: "렉카 (견인)", icon: "🚛", desc: "출동 요청 수신 및 실시간 위치 공유", color: "#DD6B20", bg: "#FFFAF0", path: "/partner/tow" },
  { type: "rental", label: "렌터카", icon: "🚗", desc: "배차 요청 수신 및 차량 이용 기간 관리", color: "#38A169", bg: "#F0FFF4", path: "/partner/rental" },
  { type: "hospital", label: "병원", icon: "🏥", desc: "진료 예약 수신 및 치료 현황 업데이트", color: "#D53F8C", bg: "#FFF5F7", path: "/partner/hospital" },
  { type: "lawyer", label: "변호사", icon: "⚖️", desc: "상담 요청 수신 및 보험사 협상 관리", color: "#805AD5", bg: "#FAF5FF", path: "/partner/lawyer" },
  { type: "adjuster", label: "손해사정사", icon: "📋", desc: "사고 서류 검토 및 손해 평가서 작성", color: "#319795", bg: "#E6FFFA", path: "/partner/adjuster" },
];

export default function PartnerHub() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#F7FAFC", minHeight: "100vh" as any }}>
      {/* Header */}
      <View style={{ backgroundColor: "#1A2B4C", paddingVertical: 32, paddingHorizontal: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "800" }}>🛡️ 사고케어</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginTop: 4 }}>파트너 포털</Text>
          </View>
          <Pressable
            onPress={() => router.push("/" as any)}
            style={{ backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 13 }}>← 사용자 앱으로</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>업체 유형을 선택해주세요</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 6 }}>
            사고케어 파트너 포털에 오신 것을 환영합니다. 해당하는 업체 유형을 선택하면 전용 대시보드로 이동합니다.
          </Text>
        </View>
      </View>

      {/* Portal Cards */}
      <ScrollView contentContainerStyle={{ padding: 40 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
          {PORTALS.map((portal) => (
            <Pressable
              key={portal.type}
              onPress={() => router.push(portal.path as any)}
              style={({ pressed }) => ({
                width: 280,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 28,
                borderWidth: 2,
                borderColor: pressed ? portal.color : "#E2E8F0",
                shadowColor: "#000",
                shadowOpacity: pressed ? 0.12 : 0.06,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              {/* Icon */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  backgroundColor: portal.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 28 }}>{portal.icon}</Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A2B4C", marginBottom: 8 }}>
                {portal.label}
              </Text>
              <Text style={{ fontSize: 13, color: "#718096", lineHeight: 20, marginBottom: 20 }}>
                {portal.desc}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    backgroundColor: portal.bg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: portal.color, fontSize: 12, fontWeight: "600" }}>포털 입장</Text>
                </View>
                <Text style={{ color: portal.color, fontSize: 18 }}>→</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Admin Link */}
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <Pressable
            onPress={() => router.push("/admin" as any)}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Text style={{ color: "#A0AEC0", fontSize: 13 }}>운영자이신가요?</Text>
            <Text style={{ color: "#3182CE", fontSize: 13, fontWeight: "600" }}>관리자 대시보드 →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
