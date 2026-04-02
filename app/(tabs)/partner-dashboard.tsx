import { checkAndNotifyNewRequests, requestPartnerNotificationPermission } from "@/lib/partner-notification";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabType = "신규요청" | "진행중" | "완료이력" | "내정보";

// 진행 단계 정의
const PROGRESS_STEPS = ["출발", "현장도착", "작업중", "완료"] as const;
type ProgressStep = typeof PROGRESS_STEPS[number];

const STEP_COLOR: Record<ProgressStep, string> = {
  출발: "#3182CE",
  현장도착: "#805AD5",
  작업중: "#ED8936",
  완료: "#38A169",
};

function getTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function formatMoney(val: string | number | null | undefined): string {
  if (!val) return "0원";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "0원";
  if (n >= 10000) return Math.floor(n / 10000) + "만원";
  return n.toLocaleString("ko-KR") + "원";
}

const ACCIDENT_TYPE_ICON: Record<string, string> = {
  "차량 단독사고": "🚗",
  "차량 대 차량": "💥",
  "차량 대 보행자": "🚶",
  "차량 대 이륜차": "🏍️",
  "주차장 사고": "🅿️",
};

export default function PartnerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("신규요청");
  const [selectedMatching, setSelectedMatching] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"수락" | "거절" | "완료" | null>(null);
  const [noteText, setNoteText] = useState("");
  const [feeText, setFeeText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState<Record<number, ProgressStep>>({});

  // 신규 요청 알림 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const profileQuery = trpc.partner.myProfile.useQuery();
  const requestsQuery = trpc.partner.myRequests.useQuery();
  const statsQuery = trpc.partner.myStats.useQuery();
  const settlementQuery = trpc.settlement.monthly.useQuery();
  const utils = trpc.useUtils();

  const respondMutation = trpc.partner.respondMatching.useMutation({
    onSuccess: () => {
      utils.partner.myRequests.invalidate();
      utils.partner.myStats.invalidate();
      setSelectedMatching(null);
      setModalAction(null);
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const completeMutation = trpc.partner.completeMatching.useMutation({
    onSuccess: () => {
      utils.partner.myRequests.invalidate();
      utils.partner.myStats.invalidate();
      setSelectedMatching(null);
      setModalAction(null);
    },
    onError: (err) => Alert.alert("오류", err.message),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      utils.partner.myRequests.invalidate(),
      utils.partner.myStats.invalidate(),
    ]);
    setRefreshing(false);
  };

  const requests = (requestsQuery.data ?? []) as any[];
  const profile = profileQuery.data;
  const stats = statsQuery.data;

  const pendingRequests = requests.filter((r: any) => (r.matching?.status ?? r.status) === "요청");
  const activeRequests = requests.filter((r: any) => (r.matching?.status ?? r.status) === "수락");
  const doneRequests = requests.filter((r: any) =>
    ["완료", "거절"].includes(r.matching?.status ?? r.status)
  );

  // 이번 달 정산
  const now = new Date();
  const monthlyData = (settlementQuery.data ?? []) as any[];
  const thisMonth = monthlyData.find(
    (m) => Number(m.year) === now.getFullYear() && Number(m.month) === now.getMonth() + 1
  );

  // 신규 요청 애니메이션
  useEffect(() => {
    if (pendingRequests.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [pendingRequests.length]);

  // 알림 권한 + 폴링
  useEffect(() => {
    requestPartnerNotificationPermission();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const check = async () => {
      const data = requestsQuery.data;
      if (!data) return;
      const normalized = data.map((r: any) => ({
        matching: r.matching ?? r,
        accident: r.accident ?? null,
      }));
      await checkAndNotifyNewRequests(normalized);
    };
    check();
    const interval = setInterval(() => {
      utils.partner.myRequests.invalidate();
    }, 30000);
    return () => clearInterval(interval);
  }, [profile?.id, requestsQuery.data]);

  const handleQuickAccept = async (item: any) => {
    const matchingId = item.matching?.id ?? item.id;
    setProcessingId(matchingId);
    try {
      await respondMutation.mutateAsync({ matchingId, action: "수락" });
      // 수락 후 자동으로 진행중 탭으로 이동
      setActiveTab("진행중");
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickReject = async (item: any) => {
    const matchingId = item.matching?.id ?? item.id;
    setProcessingId(matchingId);
    try {
      await respondMutation.mutateAsync({ matchingId, action: "거절" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = (item: any) => {
    setSelectedMatching(item);
    setModalAction("완료");
    setNoteText("");
    setFeeText("");
  };

  const confirmAction = () => {
    if (!selectedMatching || !modalAction) return;
    const matchingId = selectedMatching.matching?.id ?? selectedMatching.id;
    if (modalAction === "완료") {
      completeMutation.mutate({ matchingId, fee: feeText || undefined, note: noteText || undefined });
    } else {
      respondMutation.mutate({ matchingId, action: modalAction, note: noteText || undefined });
    }
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#1A2B4C" />
        <Text style={styles.loadingText}>파트너 정보 불러오는 중...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <Text style={{ fontSize: 48 }}>🏢</Text>
        <Text style={styles.loadingText}>파트너 계정이 아닙니다</Text>
      </View>
    );
  }

  // ─── 신규 요청 탭 ────────────────────────────────────────────────────────────
  const renderNewRequests = () => (
    <FlatList
      data={pendingRequests}
      keyExtractor={(item: any, idx) => String(item.matching?.id ?? idx)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A2B4C" />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        pendingRequests.length > 0 ? (
          <View style={styles.newRequestHeader}>
            <Animated.View style={[styles.newRequestAlert, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.newRequestAlertDot} />
              <Text style={styles.newRequestAlertText}>
                🔔 새 고객 요청 {pendingRequests.length}건 대기 중
              </Text>
            </Animated.View>
            <Text style={styles.newRequestHint}>빠르게 수락할수록 고객 만족도가 높아집니다</Text>
          </View>
        ) : null
      }
      renderItem={({ item }: { item: any }) => {
        const matching = item.matching ?? item;
        const accident = item.accident ?? {};
        const user = item.user ?? {};
        const matchingId = matching.id;
        const isProcessing = processingId === matchingId;
        const typeIcon = ACCIDENT_TYPE_ICON[accident.accidentType] ?? "🚗";

        return (
          <Animated.View style={[styles.requestCard, { transform: [{ scale: pulseAnim }] }]}>
            {/* NEW 배지 */}
            <View style={styles.newBadgeRow}>
              <View style={styles.newBadge}>
                <View style={styles.newBadgeDot} />
                <Text style={styles.newBadgeText}>NEW 요청</Text>
              </View>
              <Text style={styles.requestTime}>{getTimeAgo(matching.requestedAt ?? matching.createdAt)}</Text>
            </View>

            {/* 사고 유형 + 위치 */}
            <View style={styles.requestTypeRow}>
              <Text style={styles.requestTypeIcon}>{typeIcon}</Text>
              <View style={styles.requestTypeInfo}>
                <Text style={styles.requestTypeName}>{accident.accidentType ?? "사고 유형"}</Text>
                <Text style={styles.requestLocation} numberOfLines={2}>
                  📍 {accident.location ?? "위치 정보 없음"}
                </Text>
              </View>
            </View>

            {/* 고객 정보 */}
            <View style={styles.customerInfoBox}>
              <View style={styles.customerInfoRow}>
                <Text style={styles.customerInfoLabel}>👤 고객</Text>
                <Text style={styles.customerInfoValue}>{user.name ?? "고객"}</Text>
              </View>
              {accident.injuryLevel && accident.injuryLevel !== "없음" && (
                <View style={styles.customerInfoRow}>
                  <Text style={styles.customerInfoLabel}>🩺 부상</Text>
                  <View style={[styles.injuryBadge, { backgroundColor: "#FFF5F5" }]}>
                    <Text style={styles.injuryText}>{accident.injuryLevel}</Text>
                  </View>
                </View>
              )}
              {accident.vehicleInfo && (
                <View style={styles.customerInfoRow}>
                  <Text style={styles.customerInfoLabel}>🚘 차량</Text>
                  <Text style={styles.customerInfoValue}>{accident.vehicleInfo}</Text>
                </View>
              )}
              {accident.description && (
                <View style={styles.customerInfoRow}>
                  <Text style={styles.customerInfoLabel}>📝 상황</Text>
                  <Text style={[styles.customerInfoValue, { flex: 1 }]} numberOfLines={2}>
                    {accident.description}
                  </Text>
                </View>
              )}
            </View>

            {/* 수락 / 거절 버튼 */}
            <View style={styles.requestActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.rejectActionBtn,
                  pressed && { opacity: 0.7 },
                  isProcessing && { opacity: 0.5 },
                ]}
                onPress={() => handleQuickReject(item)}
                disabled={isProcessing}
              >
                <Text style={styles.rejectActionText}>✕ 거절</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.acceptActionBtn,
                  pressed && { opacity: 0.9 },
                  isProcessing && { opacity: 0.7 },
                ]}
                onPress={() => handleQuickAccept(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.acceptActionText}>✓ 수락하기</Text>
                    <Text style={styles.acceptActionSub}>고객에게 즉시 알림 발송</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>새 요청이 없습니다</Text>
          <Text style={styles.emptyDesc}>새 고객 요청이 들어오면 알림을 보내드립니다</Text>
          <View style={styles.emptyTips}>
            <Text style={styles.emptyTipsTitle}>💡 고객 유입 팁</Text>
            <Text style={styles.emptyTipsText}>• 프로필 정보를 완성하면 매칭 우선순위가 높아집니다</Text>
            <Text style={styles.emptyTipsText}>• 빠른 응답률이 높을수록 더 많은 요청을 받습니다</Text>
            <Text style={styles.emptyTipsText}>• 고객 후기 관리로 평점을 높이세요</Text>
          </View>
        </View>
      }
    />
  );

  // ─── 진행중 탭 ────────────────────────────────────────────────────────────────
  const renderActive = () => (
    <FlatList
      data={activeRequests}
      keyExtractor={(item: any, idx) => String(item.matching?.id ?? idx)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }: { item: any }) => {
        const matching = item.matching ?? item;
        const accident = item.accident ?? {};
        const user = item.user ?? {};
        const matchingId = matching.id;
        const currentStep = progressStep[matchingId] ?? "출발";
        const stepIdx = PROGRESS_STEPS.indexOf(currentStep);

        return (
          <View style={styles.activeCard}>
            {/* 상단: 고객 + 사고 유형 */}
            <View style={styles.activeCardTop}>
              <View style={styles.activeCardLeft}>
                <Text style={styles.activeAccidentType}>{accident.accidentType ?? "사고"}</Text>
                <Text style={styles.activeCustomer}>👤 {user.name ?? "고객"}</Text>
                <Text style={styles.activeLocation} numberOfLines={1}>📍 {accident.location ?? "위치 미상"}</Text>
              </View>
              <View style={styles.activeCardRight}>
                <Text style={styles.activeTime}>{getTimeAgo(matching.requestedAt ?? matching.createdAt)}</Text>
                <View style={[styles.activeStatusBadge, { backgroundColor: STEP_COLOR[currentStep] }]}>
                  <Text style={styles.activeStatusText}>{currentStep}</Text>
                </View>
              </View>
            </View>

            {/* 진행 단계 스텝퍼 */}
            <View style={styles.stepperRow}>
              {PROGRESS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        i <= stepIdx && { backgroundColor: STEP_COLOR[step] },
                        i === stepIdx && styles.stepDotActive,
                      ]}
                    >
                      {i < stepIdx && <Text style={styles.stepDotCheck}>✓</Text>}
                      {i === stepIdx && <View style={styles.stepDotPulse} />}
                    </View>
                    <Text style={[styles.stepLabel, i <= stepIdx && { color: STEP_COLOR[step], fontWeight: "700" }]}>
                      {step}
                    </Text>
                  </View>
                  {i < PROGRESS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, i < stepIdx && { backgroundColor: STEP_COLOR[PROGRESS_STEPS[i + 1]] }]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* 단계 변경 버튼 */}
            <View style={styles.stepBtnRow}>
              {PROGRESS_STEPS.map((step, i) => {
                if (step === "완료") return null;
                return (
                  <Pressable
                    key={step}
                    style={[
                      styles.stepBtn,
                      currentStep === step && { backgroundColor: STEP_COLOR[step], borderColor: STEP_COLOR[step] },
                    ]}
                    onPress={() =>
                      setProgressStep((prev) => ({ ...prev, [matchingId]: step }))
                    }
                  >
                    <Text
                      style={[
                        styles.stepBtnText,
                        currentStep === step && { color: "#FFFFFF" },
                      ]}
                    >
                      {step}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 고객 연락처 + 완료 처리 */}
            <View style={styles.activeCardActions}>
              {user.phone && (
                <View style={styles.customerPhoneBox}>
                  <Text style={styles.customerPhoneLabel}>📞 고객 연락처</Text>
                  <Text style={styles.customerPhone}>{user.phone}</Text>
                </View>
              )}
              <Pressable
                style={styles.completeBtn}
                onPress={() => handleComplete(item)}
              >
                <Text style={styles.completeBtnText}>✅ 처리 완료</Text>
              </Pressable>
            </View>

            {matching.note && (
              <Text style={styles.matchingNote}>📝 메모: {matching.note}</Text>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🔧</Text>
          <Text style={styles.emptyTitle}>진행 중인 건이 없습니다</Text>
          <Text style={styles.emptyDesc}>신규 요청을 수락하면 여기에 표시됩니다</Text>
        </View>
      }
    />
  );

  // ─── 완료이력 탭 ──────────────────────────────────────────────────────────────
  const renderDone = () => (
    <FlatList
      data={doneRequests}
      keyExtractor={(item: any, idx) => String(item.matching?.id ?? idx)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.doneHeader}>
          <View style={styles.doneSummaryRow}>
            {[
              { label: "완료", value: stats?.완료 ?? 0, color: "#38A169" },
              { label: "거절", value: stats?.거절 ?? 0, color: "#E53E3E" },
              { label: "이달 수익", value: formatMoney(thisMonth?.totalFee ?? 0), color: "#3182CE" },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.doneSummaryDivider} />}
                <View style={styles.doneSummaryItem}>
                  <Text style={[styles.doneSummaryValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.doneSummaryLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
          <Pressable
            style={styles.settlementLinkBtn}
            onPress={() => router.push("/settlement" as never)}
          >
            <Text style={styles.settlementLinkText}>💰 정산 내역 상세 보기 →</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const matching = item.matching ?? item;
        const accident = item.accident ?? {};
        const user = item.user ?? {};
        const isDone = matching.status === "완료";

        return (
          <View style={[styles.doneCard, !isDone && styles.doneCardRejected]}>
            <View style={styles.doneCardTop}>
              <View style={[styles.doneStatusBadge, { backgroundColor: isDone ? "#F0FFF4" : "#FFF5F5" }]}>
                <Text style={[styles.doneStatusText, { color: isDone ? "#38A169" : "#E53E3E" }]}>
                  {isDone ? "✅ 완료" : "✕ 거절"}
                </Text>
              </View>
              <Text style={styles.doneDate}>
                {matching.completedAt
                  ? new Date(matching.completedAt).toLocaleDateString("ko-KR")
                  : getTimeAgo(matching.createdAt)}
              </Text>
            </View>
            <Text style={styles.doneAccidentType}>{accident.accidentType ?? "사고"}</Text>
            <Text style={styles.doneCustomer}>👤 {user.name ?? "고객"}</Text>
            <Text style={styles.doneLocation} numberOfLines={1}>📍 {accident.location ?? "위치 미상"}</Text>
            {isDone && matching.fee && (
              <View style={styles.doneFeeRow}>
                <Text style={styles.doneFeeLabel}>처리 금액</Text>
                <Text style={styles.doneFeeValue}>{formatMoney(matching.fee)}</Text>
              </View>
            )}
            {matching.note && (
              <Text style={styles.doneNote} numberOfLines={2}>📝 {matching.note}</Text>
            )}
            {/* 평점 표시 (있을 경우) */}
            {isDone && (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text key={star} style={[styles.ratingStar, { opacity: star <= (matching.rating ?? 0) ? 1 : 0.25 }]}>
                    ⭐
                  </Text>
                ))}
                {matching.rating && (
                  <Text style={styles.ratingNum}>{matching.rating}.0</Text>
                )}
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>완료된 이력이 없습니다</Text>
          <Text style={styles.emptyDesc}>처리 완료한 건이 여기에 기록됩니다</Text>
        </View>
      }
    />
  );

  // ─── 내 정보 탭 ───────────────────────────────────────────────────────────────
  const renderMyInfo = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 업체 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.profileCardTop}>
          <View style={styles.profileAvatarBox}>
            <Text style={styles.profileAvatarText}>{profile.name?.[0] ?? "업"}</Text>
          </View>
          <View style={styles.profileCardInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileCategory}>{profile.category}</Text>
            <View style={[styles.profileStatusBadge, { backgroundColor: profile.status === "active" ? "#F0FFF4" : "#FFFAF0" }]}>
              <View style={[styles.profileStatusDot, { backgroundColor: profile.status === "active" ? "#38A169" : "#ED8936" }]} />
              <Text style={[styles.profileStatusText, { color: profile.status === "active" ? "#38A169" : "#ED8936" }]}>
                {profile.status === "active" ? "영업 중" : "승인 대기"}
              </Text>
            </View>
          </View>
          <View style={styles.profileRating}>
            <Text style={styles.profileRatingNum}>⭐ {Number(profile.rating).toFixed(1)}</Text>
            <Text style={styles.profileRatingCount}>{profile.reviewCount}건 후기</Text>
          </View>
        </View>

        <View style={styles.profileInfoList}>
          {[
            { label: "전화번호", value: profile.phone },
            { label: "주소", value: profile.address },
            { label: "소개", value: profile.description },
          ].filter((i) => i.value).map((info) => (
            <View key={info.label} style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>{info.label}</Text>
              <Text style={styles.profileInfoValue}>{info.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 성과 통계 */}
      <Text style={styles.infoSectionTitle}>📊 나의 성과</Text>
      <View style={styles.statsGrid}>
        {[
          { label: "전체 요청", value: stats?.total ?? 0, color: "#3182CE", icon: "📋" },
          { label: "수락", value: stats?.수락 ?? 0, color: "#38A169", icon: "✅" },
          { label: "완료", value: stats?.완료 ?? 0, color: "#805AD5", icon: "🏆" },
          { label: "거절", value: stats?.거절 ?? 0, color: "#E53E3E", icon: "✕" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 완료율 + 응답률 */}
      <View style={styles.rateCard}>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>완료율</Text>
          <Text style={styles.rateValue}>
            {(stats?.수락 ?? 0) > 0
              ? Math.round(((stats?.완료 ?? 0) / (stats?.수락 ?? 1)) * 100) + "%"
              : "-"}
          </Text>
          <View style={styles.rateBar}>
            <View
              style={[
                styles.rateBarFill,
                {
                  width: `${(stats?.수락 ?? 0) > 0 ? Math.round(((stats?.완료 ?? 0) / (stats?.수락 ?? 1)) * 100) : 0}%`,
                  backgroundColor: "#38A169",
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.rateDivider} />
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>수락률</Text>
          <Text style={styles.rateValue}>
            {(stats?.total ?? 0) > 0
              ? Math.round(((stats?.수락 ?? 0) / (stats?.total ?? 1)) * 100) + "%"
              : "-"}
          </Text>
          <View style={styles.rateBar}>
            <View
              style={[
                styles.rateBarFill,
                {
                  width: `${(stats?.total ?? 0) > 0 ? Math.round(((stats?.수락 ?? 0) / (stats?.total ?? 1)) * 100) : 0}%`,
                  backgroundColor: "#3182CE",
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 정산 바로가기 */}
      <Pressable
        style={styles.settlementCard}
        onPress={() => router.push("/settlement" as never)}
      >
        <View style={styles.settlementCardLeft}>
          <Text style={styles.settlementCardIcon}>💰</Text>
          <View>
            <Text style={styles.settlementCardTitle}>정산 관리</Text>
            <Text style={styles.settlementCardDesc}>
              이달 수익: {formatMoney(thisMonth?.totalFee ?? 0)}
            </Text>
          </View>
        </View>
        <Text style={styles.settlementCardArrow}>›</Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.onlineIndicator, { backgroundColor: profile.status === "active" ? "#38A169" : "#ED8936" }]} />
          <View>
            <Text style={styles.headerTitle}>{profile.name}</Text>
            <Text style={styles.headerSub}>{profile.category} · {profile.status === "active" ? "영업 중" : "승인 대기"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerRating}>⭐ {Number(profile.rating).toFixed(1)}</Text>
          <Text style={styles.headerRatingCount}>{profile.reviewCount}건 후기</Text>
        </View>
      </View>

      {/* 탭 바 */}
      <View style={styles.tabBar}>
        {([
          { key: "신규요청", label: "신규요청", badge: pendingRequests.length, urgent: true },
          { key: "진행중", label: "진행중", badge: activeRequests.length, urgent: false },
          { key: "완료이력", label: "완료이력", badge: 0, urgent: false },
          { key: "내정보", label: "내정보", badge: 0, urgent: false },
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabBtnInner}>
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
              {tab.badge > 0 && (
                <View style={[styles.tabBadge, tab.urgent && styles.tabBadgeUrgent]}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {/* 컨텐츠 */}
      <View style={styles.content}>
        {activeTab === "신규요청" && renderNewRequests()}
        {activeTab === "진행중" && renderActive()}
        {activeTab === "완료이력" && renderDone()}
        {activeTab === "내정보" && renderMyInfo()}
      </View>

      {/* 완료 처리 모달 */}
      <Modal visible={!!selectedMatching && modalAction === "완료"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✅ 처리 완료 입력</Text>
            {selectedMatching && (
              <Text style={styles.modalSub}>
                {selectedMatching.accident?.accidentType} · {selectedMatching.user?.name ?? "고객"}
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="처리 금액 (예: 150000)"
              value={feeText}
              onChangeText={setFeeText}
              keyboardType="number-pad"
              returnKeyType="next"
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMulti]}
              placeholder="처리 내용 메모 (선택)"
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => { setSelectedMatching(null); setModalAction(null); }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={confirmAction}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>완료 처리</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  loadingText: { fontSize: 14, color: "#718096", marginTop: 12 },
  scroll: { flex: 1 },
  content: { flex: 1 },
  listContent: { padding: 16, gap: 14, paddingBottom: 32 },
  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A2B4C",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  onlineIndicator: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerRating: { fontSize: 15, fontWeight: "700", color: "#F6E05E" },
  headerRatingCount: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  // 탭 바
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
  },
  tabBtnActive: { backgroundColor: "#1A2B4C" },
  tabBtnInner: { flexDirection: "row", alignItems: "center", gap: 4 },
  tabBtnText: { fontSize: 11, fontWeight: "600", color: "#718096" },
  tabBtnTextActive: { color: "#FFFFFF" },
  tabBadge: {
    backgroundColor: "#3182CE",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeUrgent: { backgroundColor: "#E53E3E" },
  tabBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  // 신규 요청 헤더
  newRequestHeader: { gap: 6, marginBottom: 4 },
  newRequestAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ED8936",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newRequestAlertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  newRequestAlertText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  newRequestHint: { fontSize: 12, color: "#A0AEC0", textAlign: "center" },
  // 요청 카드 (쿠팡이츠 스타일)
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#ED8936",
  },
  newBadgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ED8936" },
  newBadgeText: { fontSize: 12, fontWeight: "800", color: "#ED8936" },
  requestTime: { fontSize: 12, color: "#A0AEC0" },
  requestTypeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  requestTypeIcon: { fontSize: 36 },
  requestTypeInfo: { flex: 1, gap: 4 },
  requestTypeName: { fontSize: 18, fontWeight: "800", color: "#1A2B4C" },
  requestLocation: { fontSize: 14, color: "#4A5568", lineHeight: 20 },
  customerInfoBox: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  customerInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  customerInfoLabel: { fontSize: 12, color: "#A0AEC0", width: 50 },
  customerInfoValue: { fontSize: 13, color: "#1A2B4C", fontWeight: "500" },
  injuryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  injuryText: { fontSize: 12, fontWeight: "600", color: "#E53E3E" },
  requestActions: { flexDirection: "row", gap: 10 },
  rejectActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  rejectActionText: { fontSize: 15, fontWeight: "700", color: "#718096" },
  acceptActionBtn: {
    flex: 2.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#38A169",
    gap: 2,
  },
  acceptActionText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  acceptActionSub: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  // 진행중 카드
  activeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#3182CE",
  },
  activeCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  activeCardLeft: { flex: 1, gap: 4 },
  activeAccidentType: { fontSize: 17, fontWeight: "800", color: "#1A2B4C" },
  activeCustomer: { fontSize: 13, color: "#718096" },
  activeLocation: { fontSize: 12, color: "#A0AEC0" },
  activeCardRight: { alignItems: "flex-end", gap: 6 },
  activeTime: { fontSize: 11, color: "#A0AEC0" },
  activeStatusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeStatusText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  // 스텝퍼
  stepperRow: { flexDirection: "row", alignItems: "center" },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { shadowColor: "#3182CE", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6 },
  stepDotPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFFFFF" },
  stepDotCheck: { fontSize: 12, color: "#FFFFFF", fontWeight: "800" },
  stepLabel: { fontSize: 10, color: "#A0AEC0", fontWeight: "500" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E2E8F0", marginBottom: 14 },
  stepBtnRow: { flexDirection: "row", gap: 6 },
  stepBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F7FAFC",
  },
  stepBtnText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  activeCardActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  customerPhoneBox: { flex: 1, gap: 2 },
  customerPhoneLabel: { fontSize: 11, color: "#A0AEC0" },
  customerPhone: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  completeBtn: {
    backgroundColor: "#38A169",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  completeBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  matchingNote: { fontSize: 12, color: "#A0AEC0", fontStyle: "italic" },
  // 완료이력
  doneHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  doneSummaryRow: { flexDirection: "row", alignItems: "center" },
  doneSummaryItem: { flex: 1, alignItems: "center", gap: 4 },
  doneSummaryValue: { fontSize: 20, fontWeight: "800" },
  doneSummaryLabel: { fontSize: 11, color: "#A0AEC0" },
  doneSummaryDivider: { width: 1, height: 28, backgroundColor: "#E2E8F0" },
  settlementLinkBtn: {
    backgroundColor: "#EBF8FF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  settlementLinkText: { fontSize: 13, fontWeight: "700", color: "#3182CE" },
  doneCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  doneCardRejected: { opacity: 0.75 },
  doneCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  doneStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  doneStatusText: { fontSize: 12, fontWeight: "700" },
  doneDate: { fontSize: 11, color: "#A0AEC0" },
  doneAccidentType: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  doneCustomer: { fontSize: 13, color: "#718096" },
  doneLocation: { fontSize: 12, color: "#A0AEC0" },
  doneFeeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  doneFeeLabel: { fontSize: 12, color: "#A0AEC0" },
  doneFeeValue: { fontSize: 15, fontWeight: "800", color: "#38A169" },
  doneNote: { fontSize: 12, color: "#A0AEC0", fontStyle: "italic" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  ratingStar: { fontSize: 14 },
  ratingNum: { fontSize: 12, color: "#ED8936", fontWeight: "700", marginLeft: 4 },
  // 내정보
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1A2B4C",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  profileCardInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 17, fontWeight: "800", color: "#1A2B4C" },
  profileCategory: { fontSize: 13, color: "#718096" },
  profileStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  profileStatusDot: { width: 6, height: 6, borderRadius: 3 },
  profileStatusText: { fontSize: 11, fontWeight: "700" },
  profileRating: { alignItems: "flex-end", gap: 2 },
  profileRatingNum: { fontSize: 15, fontWeight: "700", color: "#ED8936" },
  profileRatingCount: { fontSize: 11, color: "#A0AEC0" },
  profileInfoList: { gap: 10, borderTopWidth: 1, borderTopColor: "#F7FAFC", paddingTop: 12 },
  profileInfoRow: { flexDirection: "row", gap: 12 },
  profileInfoLabel: { fontSize: 12, color: "#A0AEC0", width: 60 },
  profileInfoValue: { flex: 1, fontSize: 13, color: "#1A2B4C" },
  infoSectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#718096" },
  rateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rateItem: { flex: 1, gap: 8 },
  rateLabel: { fontSize: 12, color: "#A0AEC0" },
  rateValue: { fontSize: 22, fontWeight: "800", color: "#1A2B4C" },
  rateBar: { height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, overflow: "hidden" },
  rateBarFill: { height: 6, borderRadius: 3 },
  rateDivider: { width: 1, height: 60, backgroundColor: "#E2E8F0", marginHorizontal: 16 },
  settlementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  settlementCardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  settlementCardIcon: { fontSize: 28 },
  settlementCardTitle: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  settlementCardDesc: { fontSize: 13, color: "#38A169", marginTop: 2 },
  settlementCardArrow: { fontSize: 22, color: "#A0AEC0" },
  // 빈 상태
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#4A5568" },
  emptyDesc: { fontSize: 13, color: "#A0AEC0" },
  emptyTips: {
    backgroundColor: "#F7FAFC",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    width: "100%",
    marginTop: 8,
  },
  emptyTipsTitle: { fontSize: 13, fontWeight: "700", color: "#1A2B4C", marginBottom: 4 },
  emptyTipsText: { fontSize: 12, color: "#718096", lineHeight: 18 },
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1A2B4C" },
  modalSub: { fontSize: 13, color: "#718096", marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#F7FAFC",
  },
  modalInputMulti: { minHeight: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8, paddingBottom: 8 },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#718096" },
  modalConfirmBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#38A169",
  },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
