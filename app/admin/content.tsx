import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { AdminLayout } from "@/components/web/AdminLayout";
import { SectionCard, Badge, WebButton, WebTable } from "@/components/web/WebUI";

const TIPS = [
  { id: 1, title: "렌트카 25일 한도 완전 정복", category: "보험 꿀팁", date: "03.28", status: "발행중", views: 1240 },
  { id: 2, title: "CT·MRI 비용 보험사에 청구하는 법", category: "보험 꿀팁", date: "03.27", status: "발행중", views: 980 },
  { id: 3, title: "사고 후 3일 입원이 중요한 이유", category: "의료 꿀팁", date: "03.26", status: "발행중", views: 2100 },
  { id: 4, title: "과실 비율 산정 기준 완전 정리", category: "법률 꿀팁", date: "03.25", status: "발행중", views: 1560 },
  { id: 5, title: "블랙박스 영상 증거 제출 방법", category: "예방 정보", date: "03.24", status: "발행중", views: 870 },
  { id: 6, title: "합의금 계산 기준 — 위자료·휴업손해", category: "법률 꿀팁", date: "03.30", status: "예약", views: 0 },
];

const CATEGORIES = ["전체", "보험 꿀팁", "의료 꿀팁", "법률 꿀팁", "예방 정보"];

export default function AdminContent() {
  const [catFilter, setCatFilter] = useState("전체");
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ title: "", category: "보험 꿀팁", body: "", date: "" });

  const filtered = catFilter === "전체" ? TIPS : TIPS.filter((t) => t.category === catFilter);

  const openNew = () => {
    setForm({ title: "", category: "보험 꿀팁", body: "", date: "" });
    setEditing(null);
    setIsNew(true);
  };

  const openEdit = (tip: any) => {
    setForm({ title: tip.title, category: tip.category, body: "본문 내용...", date: tip.date });
    setEditing(tip);
    setIsNew(false);
  };

  return (
    <AdminLayout title="콘텐츠 관리" subtitle="오늘의 꼬댁 및 공지사항 관리">
      <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
        {/* List */}
        <View style={{ flex: editing || isNew ? 1 : 2, minWidth: 380 }}>
          <SectionCard
            title={`꼬댁 콘텐츠 (${filtered.length}건)`}
            action={<WebButton label="+ 새 콘텐츠" variant="primary" size="sm" onPress={openNew} />}
          >
            {/* Category Filter */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCatFilter(c)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                    backgroundColor: catFilter === c ? "#1A2B4C" : "#F7FAFC",
                    borderWidth: 1, borderColor: catFilter === c ? "#1A2B4C" : "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: catFilter === c ? "#FFFFFF" : "#718096", fontWeight: "600" }}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <WebTable
              columns={[
                { key: "title", label: "제목", width: 2 },
                { key: "category", label: "카테고리", width: 0.9, render: (val) => <Badge label={val} variant="blue" /> },
                { key: "date", label: "발행일", width: 0.7 },
                { key: "status", label: "상태", width: 0.7, render: (val) => (
                  <Badge label={val} variant={val === "발행중" ? "green" : "orange"} />
                )},
                { key: "views", label: "조회", width: 0.6, render: (val) => (
                  <Text style={{ color: "#3182CE", fontWeight: "600" }}>{val > 0 ? val.toLocaleString() : "-"}</Text>
                )},
                { key: "action", label: "", width: 0.5, render: (_, row) => (
                  <WebButton label="편집" variant="ghost" size="sm" onPress={() => openEdit(row)} />
                )},
              ]}
              data={filtered}
            />
          </SectionCard>
        </View>

        {/* Editor */}
        {(editing || isNew) && (
          <View style={{ flex: 1, minWidth: 320 }}>
            <SectionCard
              title={isNew ? "새 콘텐츠 작성" : "콘텐츠 편집"}
              action={<Pressable onPress={() => { setEditing(null); setIsNew(false); }}><Text style={{ color: "#A0AEC0", fontSize: 18 }}>✕</Text></Pressable>}
            >
              {/* Category */}
              <Text style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>카테고리</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {["보험 꿀팁", "의료 꿀팁", "법률 꿀팁", "예방 정보"].map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setForm({ ...form, category: c })}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
                      backgroundColor: form.category === c ? "#3182CE" : "#F7FAFC",
                      borderWidth: 1, borderColor: form.category === c ? "#3182CE" : "#E2E8F0",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: form.category === c ? "#FFF" : "#718096" }}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Title */}
              <Text style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>제목</Text>
              <TextInput
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
                placeholder="콘텐츠 제목 입력"
                style={{
                  borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8,
                  padding: 10, fontSize: 14, color: "#2D3748", marginBottom: 16,
                }}
              />

              {/* Body */}
              <Text style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>본문</Text>
              <TextInput
                value={form.body}
                onChangeText={(v) => setForm({ ...form, body: v })}
                placeholder="본문 내용을 입력하세요..."
                multiline
                numberOfLines={8}
                style={{
                  borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8,
                  padding: 10, fontSize: 13, color: "#2D3748", marginBottom: 16,
                  minHeight: 160, textAlignVertical: "top",
                }}
              />

              {/* Publish Date */}
              <Text style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>발행 예약일 (비워두면 즉시 발행)</Text>
              <TextInput
                value={form.date}
                onChangeText={(v) => setForm({ ...form, date: v })}
                placeholder="예: 03.30"
                style={{
                  borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8,
                  padding: 10, fontSize: 14, color: "#2D3748", marginBottom: 20,
                }}
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <WebButton label="저장" variant="primary" />
                <WebButton label="즉시 발행" variant="success" />
                {editing && <WebButton label="삭제" variant="danger" />}
              </View>
            </SectionCard>
          </View>
        )}
      </View>
    </AdminLayout>
  );
}
