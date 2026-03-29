import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";

interface PartnerNavItem {
  label: string;
  icon: string;
  path: string;
}

interface PartnerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  partnerType: "garage" | "tow" | "rental" | "hospital" | "lawyer" | "adjuster";
  partnerName: string;
  navItems: PartnerNavItem[];
}

const PARTNER_TYPE_COLORS: Record<string, { bg: string; accent: string; light: string }> = {
  garage:   { bg: "#1A2B4C", accent: "#3182CE", light: "#EBF8FF" },
  tow:      { bg: "#2D3748", accent: "#DD6B20", light: "#FFFAF0" },
  rental:   { bg: "#1A365D", accent: "#38A169", light: "#F0FFF4" },
  hospital: { bg: "#702459", accent: "#D53F8C", light: "#FFF5F7" },
  lawyer:   { bg: "#1A202C", accent: "#805AD5", light: "#FAF5FF" },
  adjuster: { bg: "#234E52", accent: "#319795", light: "#E6FFFA" },
};

const PARTNER_TYPE_LABELS: Record<string, string> = {
  garage:   "공업사 포털",
  tow:      "렉카 포털",
  rental:   "렌터카 포털",
  hospital: "병원 포털",
  lawyer:   "변호사 포털",
  adjuster: "손해사정사 포털",
};

export function PartnerLayout({
  children,
  title,
  subtitle,
  partnerType,
  partnerName,
  navItems,
}: PartnerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colors = PARTNER_TYPE_COLORS[partnerType];

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#F7FAFC", minHeight: "100vh" as any }}>
      {/* Sidebar */}
      <View style={{ width: 220, backgroundColor: colors.bg, minHeight: "100vh" as any, flexShrink: 0 }}>
        {/* Logo */}
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>🛡️ 사고케어</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>
            {PARTNER_TYPE_LABELS[partnerType]}
          </Text>
        </View>

        {/* Partner Name */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>업체명</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginTop: 2 }}>
              {partnerName}
            </Text>
          </View>
        </View>

        {/* Nav */}
        <ScrollView style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path as any)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: active
                    ? `${colors.accent}33`
                    : pressed
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                  borderLeftWidth: active ? 3 : 0,
                  borderLeftColor: colors.accent,
                })}
              >
                <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>
                <Text
                  style={{
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.6)",
                    fontSize: 14,
                    fontWeight: active ? "600" : "400",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
          <Pressable onPress={() => router.push("/partner" as any)} style={{ marginBottom: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>← 포털 선택으로</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/" as any)}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>← 사용자 앱으로</Text>
          </Pressable>
        </View>
      </View>

      {/* Main */}
      <View style={{ flex: 1, flexDirection: "column" }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A2B4C" }}>{title}</Text>
            {subtitle && <Text style={{ fontSize: 13, color: "#718096", marginTop: 2 }}>{subtitle}</Text>}
          </View>
          <View
            style={{
              backgroundColor: colors.light,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>
              {PARTNER_TYPE_LABELS[partnerType]}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
