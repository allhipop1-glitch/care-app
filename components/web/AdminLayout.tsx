import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";

interface NavItem {
  label: string;
  icon: string;
  path: string;
  children?: { label: string; path: string }[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const ADMIN_NAV: NavItem[] = [
  { label: "대시보드", icon: "📊", path: "/admin" },
  {
    label: "사고 관리",
    icon: "🚨",
    path: "/admin/accidents",
    children: [
      { label: "전체 사고 목록", path: "/admin/accidents" },
      { label: "처리 중인 사고", path: "/admin/accidents/active" },
      { label: "완료된 사고", path: "/admin/accidents/done" },
    ],
  },
  { label: "사용자 관리", icon: "👥", path: "/admin/users" },
  {
    label: "파트너 관리",
    icon: "🏢",
    path: "/admin/partners",
    children: [
      { label: "전체 파트너", path: "/admin/partners" },
      { label: "인증 심사 대기", path: "/admin/partners/pending" },
    ],
  },
  { label: "콘텐츠 관리", icon: "📝", path: "/admin/content" },
  { label: "정산 관리", icon: "💰", path: "/admin/settlement" },
  { label: "포인트 관리", icon: "🎁", path: "/admin/points" },
  { label: "알림 관리", icon: "📣", path: "/admin/notifications" },
  { label: "설정", icon: "⚙️", path: "/admin/settings" },
];

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/admin/accidents", "/admin/partners"]);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (item: NavItem) =>
    pathname.startsWith(item.path) || (item.children?.some((c) => pathname === c.path) ?? false);

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#F7FAFC", minHeight: "100vh" as any }}>
      {/* Sidebar */}
      <View
        style={{
          width: 240,
          backgroundColor: "#1A2B4C",
          minHeight: "100vh" as any,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#2D3748" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>🛡️ 사고케어</Text>
          <Text style={{ color: "#A0AEC0", fontSize: 12, marginTop: 2 }}>운영자 대시보드</Text>
        </View>

        {/* Nav Items */}
        <ScrollView style={{ flex: 1 }}>
          {ADMIN_NAV.map((item) => (
            <View key={item.path}>
              <Pressable
                onPress={() => {
                  if (item.children) {
                    toggleExpand(item.path);
                  } else {
                    router.push(item.path as any);
                  }
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  backgroundColor: isParentActive(item)
                    ? "rgba(49,130,206,0.2)"
                    : pressed
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                  borderLeftWidth: isActive(item.path) ? 3 : 0,
                  borderLeftColor: "#3182CE",
                })}
              >
                <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>
                <Text
                  style={{
                    color: isParentActive(item) ? "#FFFFFF" : "#A0AEC0",
                    fontSize: 14,
                    fontWeight: isParentActive(item) ? "600" : "400",
                    flex: 1,
                  }}
                >
                  {item.label}
                </Text>
                {item.children && (
                  <Text style={{ color: "#A0AEC0", fontSize: 12 }}>
                    {expandedItems.includes(item.path) ? "▲" : "▼"}
                  </Text>
                )}
              </Pressable>

              {/* Children */}
              {item.children && expandedItems.includes(item.path) && (
                <View style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                  {item.children.map((child) => (
                    <Pressable
                      key={child.path}
                      onPress={() => router.push(child.path as any)}
                      style={({ pressed }) => ({
                        paddingLeft: 48,
                        paddingVertical: 9,
                        backgroundColor: isActive(child.path)
                          ? "rgba(49,130,206,0.3)"
                          : pressed
                          ? "rgba(255,255,255,0.05)"
                          : "transparent",
                      })}
                    >
                      <Text
                        style={{
                          color: isActive(child.path) ? "#63B3ED" : "#718096",
                          fontSize: 13,
                        }}
                      >
                        {child.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#2D3748" }}>
          <Pressable onPress={() => router.push("/" as any)}>
            <Text style={{ color: "#718096", fontSize: 12 }}>← 사용자 앱으로</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1, flexDirection: "column" }}>
        {/* Top Header */}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                backgroundColor: "#EBF8FF",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: "#3182CE", fontSize: 13, fontWeight: "600" }}>관리자</Text>
            </View>
          </View>
        </View>

        {/* Page Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
