import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  // 서버에서 현재 사용자 역할 조회
  const meQuery = trpc.auth.me.useQuery();
  const userRole = meQuery.data?.role ?? "user";

  const isAdmin = userRole === "admin";
  const isPartner = userRole === "partner";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3182CE",
        tabBarInactiveTintColor: "#A0AEC0",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      {/* ── 일반 사용자 탭 ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          // 파트너/관리자는 홈 탭 숨김
          href: isAdmin || isPartner ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="guardian"
        options={{
          title: "가디언",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
          href: isAdmin || isPartner ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: "사고처리",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="car.fill" color={color} />,
          href: isAdmin || isPartner ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "커뮤니티",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="play.rectangle.fill" color={color} />,
          href: isAdmin || isPartner ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "내 주변",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
          href: isAdmin || isPartner ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
          href: isAdmin || isPartner ? null : undefined,
        }}
      />

      {/* ── 파트너 업체 탭 ── */}
      <Tabs.Screen
        name="partner-dashboard"
        options={{
          title: "업체 포털",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="building.2.fill" color={color} />,
          href: isPartner ? undefined : null,
        }}
      />

      {/* ── 관리자 탭 ── */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: "관리자",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="square.grid.2x2.fill" color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
