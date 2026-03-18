import { ScrollView, Text, View, Pressable, StyleSheet, FlatList } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Category = "전체" | "공업사" | "렌터카" | "병원" | "변호사";

const PARTNERS = [
  { id: "1", category: "공업사" as const, name: "강남 최고공업사", rating: 4.9, reviews: 312, distance: "0.3km", address: "서울 강남구 테헤란로 123", phone: "02-1234-5678", open: true, tags: ["수입차 전문", "24시간"] },
  { id: "2", category: "렌터카" as const, name: "SK렌터카 강남점", rating: 4.7, reviews: 189, distance: "0.5km", address: "서울 강남구 역삼동 456", phone: "1588-0000", open: true, tags: ["보험 연동", "당일 인도"] },
  { id: "3", category: "병원" as const, name: "강남세브란스 정형외과", rating: 4.8, reviews: 421, distance: "1.2km", address: "서울 강남구 언주로 211", phone: "02-2019-3114", open: true, tags: ["교통사고 전문", "MRI 보유"] },
  { id: "4", category: "변호사" as const, name: "교통사고 전문 법률사무소", rating: 4.6, reviews: 98, distance: "0.8km", address: "서울 강남구 삼성동 789", phone: "02-555-7777", open: true, tags: ["무료 상담", "성공보수"] },
  { id: "5", category: "공업사" as const, name: "삼성 자동차공업사", rating: 4.5, reviews: 203, distance: "1.5km", address: "서울 강남구 도산대로 55", phone: "02-9876-5432", open: false, tags: ["국산차 전문"] },
  { id: "6", category: "병원" as const, name: "강남 정형외과의원", rating: 4.4, reviews: 156, distance: "0.9km", address: "서울 강남구 논현동 321", phone: "02-111-2222", open: true, tags: ["당일 진료"] },
];

const CATEGORY_COLORS: Record<string, string> = {
  공업사: "#3182CE",
  렌터카: "#38A169",
  병원: "#E53E3E",
  변호사: "#805AD5",
};

const CATEGORY_ICONS = {
  공업사: "wrench.fill" as const,
  렌터카: "car.2.fill" as const,
  병원: "cross.fill" as const,
  변호사: "scale.3d" as const,
};

export default function MapScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>("전체");

  const categories: Category[] = ["전체", "공업사", "렌터카", "병원", "변호사"];

  const filtered = activeCategory === "전체"
    ? PARTNERS
    : PARTNERS.filter((p) => p.category === activeCategory);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 주변</Text>
        <View style={styles.locationBadge}>
          <IconSymbol name="location.fill" size={12} color="#3182CE" />
          <Text style={styles.locationText}>강남구 역삼동</Text>
        </View>
      </View>

      {/* 지도 대체 배너 */}
      <View style={styles.mapBanner}>
        <View style={styles.mapBannerInner}>
          <IconSymbol name="map.fill" size={32} color="#3182CE" />
          <View>
            <Text style={styles.mapBannerTitle}>현재 위치 기반 파트너 검색 중</Text>
            <Text style={styles.mapBannerSub}>강남구 역삼동 반경 3km · 파트너 {PARTNERS.length}개 발견</Text>
          </View>
        </View>
        {/* 위험 구간 히트맵 안내 */}
        <View style={styles.heatmapBadge}>
          <View style={styles.heatmapDot} />
          <Text style={styles.heatmapText}>사고 다발 구간 2곳 근처</Text>
        </View>
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryChip,
              activeCategory === cat && styles.categoryChipActive,
              cat !== "전체" && activeCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] },
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            {cat !== "전체" && (
              <IconSymbol
                name={CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]}
                size={14}
                color={activeCategory === cat ? "#FFFFFF" : CATEGORY_COLORS[cat]}
              />
            )}
            <Text style={[
              styles.categoryChipText,
              activeCategory === cat && styles.categoryChipTextActive,
            ]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.partnerCard, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.partnerIconBox, { backgroundColor: CATEGORY_COLORS[item.category] + "15" }]}>
              <IconSymbol
                name={CATEGORY_ICONS[item.category]}
                size={22}
                color={CATEGORY_COLORS[item.category]}
              />
            </View>
            <View style={styles.partnerInfo}>
              <View style={styles.partnerTopRow}>
                <Text style={styles.partnerName}>{item.name}</Text>
                {!item.open && (
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedBadgeText}>영업종료</Text>
                  </View>
                )}
              </View>
              <View style={styles.partnerMeta}>
                <IconSymbol name="star.fill" size={12} color="#F6AD55" />
                <Text style={styles.partnerMetaText}>{item.rating}</Text>
                <Text style={styles.partnerMetaDot}>({item.reviews})</Text>
                <Text style={styles.partnerMetaDot}>·</Text>
                <IconSymbol name="location.fill" size={12} color="#A0AEC0" />
                <Text style={styles.partnerMetaText}>{item.distance}</Text>
              </View>
              <View style={styles.partnerTags}>
                {item.tags.map((tag) => (
                  <View key={tag} style={[styles.partnerTag, { borderColor: CATEGORY_COLORS[item.category] + "40" }]}>
                    <Text style={[styles.partnerTagText, { color: CATEGORY_COLORS[item.category] }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.7 }]}
            >
              <IconSymbol name="phone.fill" size={16} color="#3182CE" />
            </Pressable>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A2B4C",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#3182CE",
    fontWeight: "600",
  },
  mapBanner: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#BEE3F8",
    gap: 10,
  },
  mapBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mapBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 2,
  },
  mapBannerSub: {
    fontSize: 12,
    color: "#4A5568",
  },
  heatmapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heatmapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DD6B20",
  },
  heatmapText: {
    fontSize: 12,
    color: "#744210",
    fontWeight: "600",
  },
  categoryScroll: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    maxHeight: 52,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryChipActive: {
    backgroundColor: "#1A2B4C",
    borderColor: "#1A2B4C",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#718096",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  partnerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A2B4C",
    flex: 1,
  },
  closedBadge: {
    backgroundColor: "#FED7D7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedBadgeText: {
    fontSize: 10,
    color: "#E53E3E",
    fontWeight: "700",
  },
  partnerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  partnerMetaText: {
    fontSize: 12,
    color: "#718096",
  },
  partnerMetaDot: {
    fontSize: 12,
    color: "#CBD5E0",
  },
  partnerTags: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  partnerTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  partnerTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EBF4FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
