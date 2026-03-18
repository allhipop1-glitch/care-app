import { ScrollView, Text, View, Pressable, StyleSheet, FlatList } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const BLACKBOX_FEED = [
  {
    id: "1",
    title: "신호 위반 차량과 직진 충돌",
    location: "서울 강남구 테헤란로",
    date: "2026.03.15",
    faultRatio: { attacker: 90, victim: 10 },
    views: 12400,
    comments: 87,
    tags: ["신호위반", "직진우선"],
  },
  {
    id: "2",
    title: "주차장 후진 중 측면 충돌",
    location: "경기 성남시 분당구",
    date: "2026.03.14",
    faultRatio: { attacker: 70, victim: 30 },
    views: 8200,
    comments: 54,
    tags: ["주차장", "후진"],
  },
  {
    id: "3",
    title: "끼어들기 후 급정거로 인한 추돌",
    location: "서울 송파구 올림픽로",
    date: "2026.03.13",
    faultRatio: { attacker: 80, victim: 20 },
    views: 15600,
    comments: 132,
    tags: ["끼어들기", "급정거"],
  },
  {
    id: "4",
    title: "횡단보도 보행자 충돌 사고",
    location: "서울 마포구 홍대입구",
    date: "2026.03.12",
    faultRatio: { attacker: 100, victim: 0 },
    views: 22100,
    comments: 201,
    tags: ["횡단보도", "보행자"],
  },
];

const DAILY_TIPS = [
  {
    id: "1",
    tag: "보험 꿀팁",
    tagColor: "#3182CE",
    title: "렌트카는 최대 25일까지만 보장됩니다",
    desc: "보험 약관상 렌트카 지원은 최대 25일. 수리 지연 시 초과분은 자비 부담. 공업사 진행 상황을 반드시 확인해야 합니다.",
    date: "2026.03.19",
  },
  {
    id: "2",
    tag: "의료 꿀팁",
    tagColor: "#38A169",
    title: "사고 후 3일 이내 입원하지 않으면 이후 입원이 매우 어렵습니다",
    desc: "사고 직후 3일 이내 입원 기록이 없으면 이후 증상 악화 시 인과관계 입증이 어려워 보험 처리가 거부될 수 있습니다.",
    date: "2026.03.18",
  },
  {
    id: "3",
    tag: "보험 꿀팁",
    tagColor: "#3182CE",
    title: "X-ray·초음파뿐 아니라 CT·MRI도 보험 처리 가능합니다",
    desc: "사고 관련 진단이라면 CT·MRI 비용도 상대방 보험사에 청구 가능. 의사에게 적극적으로 요청하는 것이 권리입니다.",
    date: "2026.03.17",
  },
  {
    id: "4",
    tag: "법률 꿀팁",
    tagColor: "#805AD5",
    title: "내 차 가격 하락분(격락손해)은 소송으로 받을 수 있습니다",
    desc: "사고로 인한 내 차의 중고차 시세 하락분(격락손해)은 변호사를 통한 민사 소송으로 별도 청구 가능합니다.",
    date: "2026.03.16",
  },
];

type TabType = "blackbox" | "tips";

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("blackbox");

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "blackbox" && styles.tabActive]}
          onPress={() => setActiveTab("blackbox")}
        >
          <Text style={[styles.tabText, activeTab === "blackbox" && styles.tabTextActive]}>
            블랙박스 과실 분석
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "tips" && styles.tabActive]}
          onPress={() => setActiveTab("tips")}
        >
          <Text style={[styles.tabText, activeTab === "tips" && styles.tabTextActive]}>
            데일리 꿀팁
          </Text>
        </Pressable>
      </View>

      {activeTab === "blackbox" ? (
        <FlatList
          data={BLACKBOX_FEED}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.blackboxCard, pressed && { opacity: 0.85 }]}
            >
              {/* 과실 비율 바 */}
              <View style={styles.faultBarContainer}>
                <View style={[styles.faultBarAttacker, { flex: item.faultRatio.attacker }]}>
                  <Text style={styles.faultBarText}>가해자 {item.faultRatio.attacker}%</Text>
                </View>
                {item.faultRatio.victim > 0 && (
                  <View style={[styles.faultBarVictim, { flex: item.faultRatio.victim }]}>
                    <Text style={styles.faultBarTextVictim}>피해자 {item.faultRatio.victim}%</Text>
                  </View>
                )}
              </View>

              <View style={styles.blackboxContent}>
                {/* 태그 */}
                <View style={styles.tagRow}>
                  {item.tags.map((tag) => (
                    <View key={tag} style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.blackboxTitle}>{item.title}</Text>
                <View style={styles.blackboxMeta}>
                  <IconSymbol name="location.fill" size={12} color="#A0AEC0" />
                  <Text style={styles.blackboxMetaText}>{item.location}</Text>
                  <Text style={styles.blackboxMetaDot}>·</Text>
                  <Text style={styles.blackboxMetaText}>{item.date}</Text>
                </View>

                <View style={styles.blackboxStats}>
                  <View style={styles.blackboxStat}>
                    <IconSymbol name="photo.fill" size={13} color="#A0AEC0" />
                    <Text style={styles.blackboxStatText}>{item.views.toLocaleString()}</Text>
                  </View>
                  <View style={styles.blackboxStat}>
                    <IconSymbol name="info.circle.fill" size={13} color="#A0AEC0" />
                    <Text style={styles.blackboxStatText}>{item.comments}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={DAILY_TIPS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.tipCard, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.tipCardTop}>
                <View style={[styles.tipTag, { backgroundColor: item.tagColor + "20" }]}>
                  <Text style={[styles.tipTagText, { color: item.tagColor }]}>{item.tag}</Text>
                </View>
                <Text style={styles.tipDate}>{item.date}</Text>
              </View>
              <Text style={styles.tipTitle}>{item.title}</Text>
              <Text style={styles.tipDesc}>{item.desc}</Text>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3182CE",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A0AEC0",
  },
  tabTextActive: {
    color: "#3182CE",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  blackboxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  faultBarContainer: {
    flexDirection: "row",
    height: 36,
  },
  faultBarAttacker: {
    backgroundColor: "#E53E3E",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  faultBarVictim: {
    backgroundColor: "#3182CE",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 10,
  },
  faultBarText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  faultBarTextVictim: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  blackboxContent: {
    padding: 14,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    color: "#3182CE",
    fontWeight: "600",
  },
  blackboxTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 6,
    lineHeight: 22,
  },
  blackboxMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  blackboxMetaText: {
    fontSize: 12,
    color: "#A0AEC0",
  },
  blackboxMetaDot: {
    fontSize: 12,
    color: "#CBD5E0",
  },
  blackboxStats: {
    flexDirection: "row",
    gap: 14,
  },
  blackboxStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  blackboxStatText: {
    fontSize: 12,
    color: "#A0AEC0",
  },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tipTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tipTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tipDate: {
    fontSize: 11,
    color: "#A0AEC0",
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B4C",
    marginBottom: 8,
    lineHeight: 22,
  },
  tipDesc: {
    fontSize: 13,
    color: "#718096",
    lineHeight: 20,
  },
});
