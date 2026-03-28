import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

// ─── 타입 ────────────────────────────────────────────────────────────────────
type Category = "공업사" | "렌터카" | "병원" | "변호사";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  tags: string[];
  helpful: number;
  isHelpful?: boolean;
}

// ─── 카테고리별 태그 ──────────────────────────────────────────────────────────
const REVIEW_TAGS: Record<string, string[]> = {
  공업사: ["수리 품질 최고", "친절해요", "빠른 처리", "견적 투명", "보험 처리 도움", "재방문 의사 있음"],
  렌터카: ["차량 상태 좋음", "친절해요", "빠른 인도", "보험 연동 편리", "가격 합리적", "위치 편리"],
  병원: ["진료 친절", "대기 짧음", "설명 자세히", "교통사고 전문", "MRI 빠름", "재활 치료 좋음"],
  변호사: ["전문적", "소통 원활", "결과 만족", "수임료 합리적", "빠른 처리", "친절한 상담"],
};

// ─── 샘플 리뷰 데이터 ─────────────────────────────────────────────────────────
const SAMPLE_REVIEWS: Record<string, Review[]> = {
  "1": [
    { id: "r1", author: "김**", rating: 5, date: "2025.12.14", text: "사고 직후 당황했는데 직원분이 너무 친절하게 안내해주셨어요. 수리도 깔끔하고 보험 처리도 알아서 다 해주셔서 정말 편했습니다. 강남 쪽 사고나면 무조건 여기 오세요!", tags: ["친절해요", "보험 처리 도움"], helpful: 24 },
    { id: "r2", author: "이**", rating: 5, date: "2025.11.28", text: "수입차 BMW 수리 맡겼는데 완벽하게 복원해줬어요. 다른 공업사에서 못 고친다던 부분도 여기서 해결됐습니다. 견적도 처음 말한 금액 그대로라 신뢰가 가요.", tags: ["수리 품질 최고", "견적 투명"], helpful: 18 },
    { id: "r3", author: "박**", rating: 4, date: "2025.11.10", text: "전반적으로 만족스러웠어요. 수리 기간이 예상보다 하루 더 걸렸지만 중간에 연락 주셔서 괜찮았습니다. 다음에도 이용할 것 같아요.", tags: ["친절해요", "빠른 처리"], helpful: 9 },
    { id: "r4", author: "최**", rating: 5, date: "2025.10.22", text: "24시간 운영이라 밤에 사고났을 때 바로 연락할 수 있어서 너무 좋았어요. 직원분이 새벽에도 친절하게 응대해주셨습니다.", tags: ["친절해요", "빠른 처리"], helpful: 31 },
  ],
  "2": [
    { id: "r5", author: "정**", rating: 5, date: "2025.12.01", text: "사고케어 앱으로 연결됐는데 정말 편했어요. 보험사 연동도 자동으로 되고 차량도 깔끔했습니다. 렌터카 빌리는 게 이렇게 쉬울 줄 몰랐어요.", tags: ["보험 연동 편리", "차량 상태 좋음"], helpful: 15 },
    { id: "r6", author: "강**", rating: 4, date: "2025.11.15", text: "당일 인도라고 해서 갔는데 실제로 1시간 내에 받을 수 있었어요. 차량 상태도 좋고 직원도 친절했습니다. 반납할 때도 별 문제 없었어요.", tags: ["빠른 인도", "친절해요"], helpful: 11 },
    { id: "r7", author: "윤**", rating: 5, date: "2025.10.30", text: "교통사고 후 렌터카가 필요했는데 보험 처리 연동이 완벽해서 돈 한 푼 안 내고 이용했어요. 직원분이 보험 관련 서류도 도와주셔서 감사했습니다.", tags: ["보험 연동 편리", "가격 합리적"], helpful: 22 },
  ],
  "3": [
    { id: "r8", author: "송**", rating: 5, date: "2025.12.10", text: "교통사고 후 목과 허리가 너무 아팠는데 여기서 MRI 찍고 바로 치료 시작했어요. 선생님이 교통사고 전문이라 보험 처리도 잘 아시고 설명도 자세히 해주셨습니다.", tags: ["교통사고 전문", "MRI 빠름"], helpful: 28 },
    { id: "r9", author: "한**", rating: 5, date: "2025.11.20", text: "사고 당일 응급으로 갔는데 대기 없이 바로 진료받았어요. 교통사고 환자 우선 진료라고 하더라고요. 재활 치료도 꾸준히 받고 있는데 많이 좋아졌습니다.", tags: ["대기 짧음", "재활 치료 좋음"], helpful: 19 },
    { id: "r10", author: "오**", rating: 4, date: "2025.11.05", text: "진료는 만족스러웠어요. 다만 주차가 좀 불편했습니다. 그 외에는 친절하고 설명도 잘 해주셨어요.", tags: ["진료 친절", "설명 자세히"], helpful: 7 },
    { id: "r11", author: "임**", rating: 5, date: "2025.10.18", text: "보험사에서 보내준 병원 말고 여기 왔는데 훨씬 잘 봐주셨어요. 초음파, MRI 다 당일에 가능하고 교통사고 전문 선생님이라 믿음이 갔습니다.", tags: ["교통사고 전문", "MRI 빠름"], helpful: 35 },
  ],
  "4": [
    { id: "r12", author: "조**", rating: 5, date: "2025.12.05", text: "무료 상담 받고 바로 계약했어요. 상대방 보험사가 말도 안 되는 과실 비율 제시했는데 변호사님이 싹 다 해결해주셨습니다. 결과에 매우 만족합니다.", tags: ["전문적", "결과 만족"], helpful: 41 },
    { id: "r13", author: "서**", rating: 4, date: "2025.11.12", text: "처음에 좀 걱정됐는데 담당 변호사님이 진행 상황을 계속 알려주셔서 안심이 됐어요. 최종 합의금도 기대 이상이었습니다.", tags: ["소통 원활", "결과 만족"], helpful: 16 },
  ],
  "5": [
    { id: "r14", author: "권**", rating: 5, date: "2025.12.08", text: "국산차 전문이라고 해서 갔는데 정말 꼼꼼하게 봐주셨어요. 보험사 견적보다 훨씬 자세히 수리해주셨습니다.", tags: ["수리 품질 최고", "견적 투명"], helpful: 13 },
    { id: "r15", author: "황**", rating: 4, date: "2025.11.25", text: "수리 잘 해주셨어요. 다음에 또 이용하겠습니다.", tags: ["친절해요"], helpful: 5 },
  ],
  "6": [
    { id: "r16", author: "류**", rating: 4, date: "2025.12.03", text: "당일 진료 가능하다고 해서 갔는데 실제로 바로 봐주셨어요. 선생님이 친절하게 설명해주셨습니다.", tags: ["당일 진료", "진료 친절"], helpful: 8 },
    { id: "r17", author: "신**", rating: 5, date: "2025.11.18", text: "교통사고 후 처음 방문했는데 보험 처리 관련해서 모르는 것들을 다 알려주셨어요. 치료도 잘 됐고 만족합니다.", tags: ["설명 자세히", "진료 친절"], helpful: 12 },
  ],
};

// ─── 파트너 데이터 (map.tsx와 동일) ─────────────────────────────────────────
const PARTNERS: Record<string, {
  id: string; category: Category; name: string; rating: number; reviews: number;
  distance: string; address: string; phone: string; open: boolean; tags: string[];
  description: string;
}> = {
  "1": { id: "1", category: "공업사", name: "강남 최고공업사", rating: 4.9, reviews: 312, distance: "0.3km", address: "서울 강남구 테헤란로 123", phone: "02-1234-5678", open: true, tags: ["수입차 전문", "24시간"], description: "수입차·국산차 전 차종 수리 전문. 보험사 직접 청구 대행 서비스 제공. 24시간 긴급 출동 가능." },
  "2": { id: "2", category: "렌터카", name: "SK렌터카 강남점", rating: 4.7, reviews: 189, distance: "0.5km", address: "서울 강남구 역삼동 456", phone: "1588-0000", open: true, tags: ["보험 연동", "당일 인도"], description: "교통사고 피해자 전용 렌터카 서비스. 보험사 자동 연동으로 자기 부담금 없이 이용 가능." },
  "3": { id: "3", category: "병원", name: "강남세브란스 정형외과", rating: 4.8, reviews: 421, distance: "1.2km", address: "서울 강남구 언주로 211", phone: "02-2019-3114", open: true, tags: ["교통사고 전문", "MRI 보유"], description: "교통사고 전문 정형외과. MRI·CT·초음파 당일 촬영 가능. 교통사고 환자 우선 진료." },
  "4": { id: "4", category: "변호사", name: "교통사고 전문 법률사무소", rating: 4.6, reviews: 98, distance: "0.8km", address: "서울 강남구 삼성동 789", phone: "02-555-7777", open: true, tags: ["무료 상담", "성공보수"], description: "교통사고 손해배상 전문 로펌. 초기 상담 무료. 성공보수제 운영." },
  "5": { id: "5", category: "공업사", name: "삼성 자동차공업사", rating: 4.5, reviews: 203, distance: "1.5km", address: "서울 강남구 도산대로 55", phone: "02-9876-5432", open: false, tags: ["국산차 전문"], description: "국산차 전문 공업사. 현대·기아·쌍용 공식 인증 수리점." },
  "6": { id: "6", category: "병원", name: "강남 정형외과의원", rating: 4.4, reviews: 156, distance: "0.9km", address: "서울 강남구 논현동 321", phone: "02-111-2222", open: true, tags: ["당일 진료"], description: "교통사고 후 빠른 진료가 필요할 때. 당일 진료 및 진단서 발급 가능." },
};

const CATEGORY_COLORS: Record<string, string> = {
  공업사: "#3182CE", 렌터카: "#38A169", 병원: "#E53E3E", 변호사: "#805AD5",
};
const CATEGORY_ICONS = {
  공업사: "wrench.fill" as const, 렌터카: "car.2.fill" as const,
  병원: "cross.fill" as const, 변호사: "scale.3d" as const,
};

// ─── 별점 렌더 헬퍼 ──────────────────────────────────────────────────────────
function StarRow({ rating, size = 14, color = "#F6AD55" }: { rating: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconSymbol key={i} name="star.fill" size={size} color={i <= rating ? color : "#E2E8F0"} />
      ))}
    </View>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────────────────
export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const partner = PARTNERS[id ?? "1"];
  const color = CATEGORY_COLORS[partner?.category ?? "공업사"];
  const availableTags = REVIEW_TAGS[partner?.category ?? "공업사"] ?? [];

  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS[id ?? "1"] ?? []);
  const [showWriteModal, setShowWriteModal] = useState(false);

  // 리뷰 작성 상태
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  if (!partner) return null;

  // 별점 분포 계산
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  // 도움이 돼요 토글
  const toggleHelpful = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, helpful: r.isHelpful ? r.helpful - 1 : r.helpful + 1, isHelpful: !r.isHelpful }
          : r
      )
    );
  };

  // 태그 토글
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 리뷰 제출
  const submitReview = () => {
    if (newRating === 0) { Alert.alert("별점을 선택해주세요"); return; }
    if (newText.trim().length < 10) { Alert.alert("후기를 10자 이상 작성해주세요"); return; }

    const newReview: Review = {
      id: `r_${Date.now()}`,
      author: "나",
      rating: newRating,
      date: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(".", ""),
      text: newText.trim(),
      tags: selectedTags,
      helpful: 0,
    };
    setReviews((prev) => [newReview, ...prev]);
    setShowWriteModal(false);
    setNewRating(0);
    setNewText("");
    setSelectedTags([]);
    Alert.alert("후기가 등록되었습니다", "소중한 후기 감사합니다 🙏");
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color="#1A2B4C" />
        </Pressable>
        <Text style={styles.headerTitle}>파트너 정보</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 파트너 기본 정보 */}
        <View style={styles.profileCard}>
          <View style={[styles.profileIcon, { backgroundColor: color + "15" }]}>
            <IconSymbol name={CATEGORY_ICONS[partner.category]} size={32} color={color} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileTopRow}>
              <Text style={styles.profileName}>{partner.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: color + "15" }]}>
                <Text style={[styles.categoryBadgeText, { color }]}>{partner.category}</Text>
              </View>
            </View>
            <View style={styles.ratingRow}>
              <StarRow rating={Math.round(partner.rating)} size={16} />
              <Text style={styles.ratingNum}>{partner.rating}</Text>
              <Text style={styles.reviewCount}>후기 {partner.reviews}개</Text>
            </View>
            <Text style={styles.description}>{partner.description}</Text>
          </View>
        </View>

        {/* 연락처 & 위치 */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <IconSymbol name="location.fill" size={14} color="#718096" />
            <Text style={styles.infoText}>{partner.address}</Text>
          </View>
          <View style={styles.infoItem}>
            <IconSymbol name="phone.fill" size={14} color="#718096" />
            <Text style={styles.infoText}>{partner.phone}</Text>
          </View>
        </View>

        {/* 태그 */}
        <View style={styles.tagsRow}>
          {partner.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { borderColor: color + "40" }]}>
              <Text style={[styles.tagText, { color }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 별점 분포 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>별점 분포</Text>
          <View style={styles.ratingDistribution}>
            <View style={styles.ratingBig}>
              <Text style={styles.ratingBigNum}>{partner.rating}</Text>
              <StarRow rating={Math.round(partner.rating)} size={20} />
              <Text style={styles.ratingBigSub}>전체 {reviews.length}개 후기</Text>
            </View>
            <View style={styles.ratingBars}>
              {ratingCounts.map(({ star, count }) => (
                <View key={star} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{star}</Text>
                  <IconSymbol name="star.fill" size={10} color="#F6AD55" />
                  <View style={styles.ratingBarBg}>
                    <View style={[styles.ratingBarFill, { width: `${(count / maxCount) * 100}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.ratingBarCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 솔직후기 목록 */}
        <View style={styles.section}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>솔직후기</Text>
            <Pressable
              style={({ pressed }) => [styles.writeBtn, { backgroundColor: color }, pressed && { opacity: 0.8 }]}
              onPress={() => setShowWriteModal(true)}
            >
              <IconSymbol name="pencil" size={13} color="#FFFFFF" />
              <Text style={styles.writeBtnText}>후기 쓰기</Text>
            </Pressable>
          </View>

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewAuthorRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{review.author[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                <StarRow rating={review.rating} size={13} />
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
              {review.tags.length > 0 && (
                <View style={styles.reviewTags}>
                  {review.tags.map((tag) => (
                    <View key={tag} style={[styles.reviewTag, { backgroundColor: color + "10" }]}>
                      <Text style={[styles.reviewTagText, { color }]}>✓ {tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Pressable
                style={({ pressed }) => [styles.helpfulBtn, review.isHelpful && styles.helpfulBtnActive, pressed && { opacity: 0.7 }]}
                onPress={() => toggleHelpful(review.id)}
              >
                <IconSymbol name="hand.thumbsup.fill" size={13} color={review.isHelpful ? color : "#A0AEC0"} />
                <Text style={[styles.helpfulText, review.isHelpful && { color }]}>
                  도움이 됐어요 {review.helpful}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── 리뷰 작성 모달 ─── */}
      <Modal visible={showWriteModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>솔직후기 작성</Text>
              <Pressable onPress={() => setShowWriteModal(false)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <IconSymbol name="xmark.circle.fill" size={24} color="#CBD5E0" />
              </Pressable>
            </View>
            <Text style={styles.modalPartnerName}>{partner.name}</Text>

            {/* 별점 선택 */}
            <Text style={styles.modalLabel}>별점</Text>
            <View style={styles.starSelect}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Pressable key={i} onPress={() => setNewRating(i)} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                  <IconSymbol name="star.fill" size={36} color={i <= newRating ? "#F6AD55" : "#E2E8F0"} />
                </Pressable>
              ))}
            </View>
            {newRating > 0 && (
              <Text style={[styles.ratingLabel, { color }]}>
                {["", "별로예요", "그냥 그래요", "괜찮아요", "좋아요", "최고예요!"][newRating]}
              </Text>
            )}

            {/* 태그 선택 */}
            <Text style={styles.modalLabel}>해당하는 항목 선택 (선택)</Text>
            <View style={styles.tagGrid}>
              {availableTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, selectedTags.includes(tag) && { backgroundColor: color, borderColor: color }]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagChipText, selectedTags.includes(tag) && { color: "#FFFFFF" }]}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            {/* 텍스트 입력 */}
            <Text style={styles.modalLabel}>후기 내용</Text>
            <TextInput
              style={styles.textInput}
              placeholder="실제 경험을 솔직하게 작성해주세요 (10자 이상)"
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              value={newText}
              onChangeText={setNewText}
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={styles.charCount}>{newText.length}자</Text>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: color }, pressed && { opacity: 0.85 }]}
              onPress={submitReview}
            >
              <Text style={styles.submitBtnText}>후기 등록하기</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

// ─── 스타일 ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A2B4C" },
  profileCard: { flexDirection: "row", gap: 14, padding: 20, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F0F4F8" },
  profileIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  profileInfo: { flex: 1, gap: 6 },
  profileTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 18, fontWeight: "800", color: "#1A2B4C", flex: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingNum: { fontSize: 15, fontWeight: "700", color: "#1A2B4C" },
  reviewCount: { fontSize: 12, color: "#718096" },
  description: { fontSize: 13, color: "#4A5568", lineHeight: 19 },
  infoRow: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#FFFFFF", gap: 6, borderBottomWidth: 1, borderBottomColor: "#F0F4F8" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, color: "#4A5568" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 8, borderBottomColor: "#F7FAFC" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: "600" },
  section: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: "#FFFFFF", marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1A2B4C", marginBottom: 14 },
  ratingDistribution: { flexDirection: "row", gap: 20, marginBottom: 20 },
  ratingBig: { alignItems: "center", gap: 6, minWidth: 80 },
  ratingBigNum: { fontSize: 40, fontWeight: "800", color: "#1A2B4C" },
  ratingBigSub: { fontSize: 11, color: "#A0AEC0" },
  ratingBars: { flex: 1, gap: 6 },
  ratingBarRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingBarLabel: { fontSize: 12, color: "#718096", width: 10 },
  ratingBarBg: { flex: 1, height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, overflow: "hidden" },
  ratingBarFill: { height: "100%", borderRadius: 3 },
  ratingBarCount: { fontSize: 11, color: "#A0AEC0", width: 16, textAlign: "right" },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  writeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  writeBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  reviewCard: { borderWidth: 1, borderColor: "#EDF2F7", borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: "#FAFBFC" },
  reviewTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  reviewAuthorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#EDF2F7", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700", color: "#4A5568" },
  reviewAuthor: { fontSize: 13, fontWeight: "700", color: "#1A2B4C" },
  reviewDate: { fontSize: 11, color: "#A0AEC0" },
  reviewText: { fontSize: 14, color: "#2D3748", lineHeight: 21, marginBottom: 8 },
  reviewTags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  reviewTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  reviewTagText: { fontSize: 11, fontWeight: "600" },
  helpfulBtn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" },
  helpfulBtnActive: { borderColor: "transparent", backgroundColor: "#EBF4FF" },
  helpfulText: { fontSize: 12, color: "#A0AEC0", fontWeight: "600" },
  // 모달
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1A2B4C" },
  modalPartnerName: { fontSize: 13, color: "#718096", marginBottom: 18 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#4A5568", marginBottom: 8 },
  starSelect: { flexDirection: "row", gap: 8, marginBottom: 6 },
  ratingLabel: { fontSize: 13, fontWeight: "700", marginBottom: 16 },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F7FAFC" },
  tagChipText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  textInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12, fontSize: 14, color: "#1A2B4C", minHeight: 100, textAlignVertical: "top", marginBottom: 4 },
  charCount: { fontSize: 11, color: "#A0AEC0", textAlign: "right", marginBottom: 16 },
  submitBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});
