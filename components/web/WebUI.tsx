import React from "react";
import { View, Text, Pressable, ViewStyle, TextStyle } from "react-native";

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: string;
}
export function StatCard({ label, value, sub, color = "#3182CE", icon }: StatCardProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        flex: 1,
        minWidth: 140,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        {icon && <Text style={{ fontSize: 20, marginRight: 8 }}>{icon}</Text>}
        <Text style={{ fontSize: 13, color: "#718096", fontWeight: "500" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 28, fontWeight: "700", color }}>{value}</Text>
      {sub && <Text style={{ fontSize: 12, color: "#A0AEC0", marginTop: 4 }}>{sub}</Text>}
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
}
export function SectionCard({ title, children, action, style }: SectionCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          overflow: "hidden",
          marginBottom: 20,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#F7FAFC",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1A2B4C" }}>{title}</Text>
        {action}
      </View>
      <View style={{ padding: 20 }}>{children}</View>
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "blue" | "green" | "orange" | "red" | "gray" | "purple" | "teal";
const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  blue:   { bg: "#EBF8FF", text: "#3182CE" },
  green:  { bg: "#F0FFF4", text: "#38A169" },
  orange: { bg: "#FFFAF0", text: "#DD6B20" },
  red:    { bg: "#FFF5F5", text: "#E53E3E" },
  gray:   { bg: "#F7FAFC", text: "#718096" },
  purple: { bg: "#FAF5FF", text: "#805AD5" },
  teal:   { bg: "#E6FFFA", text: "#319795" },
};
interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}
export function Badge({ label, variant = "gray" }: BadgeProps) {
  const c = BADGE_COLORS[variant];
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c.text, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
const BTN_COLORS: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: "#3182CE", text: "#FFFFFF" },
  secondary: { bg: "#EBF8FF", text: "#3182CE" },
  danger:    { bg: "#FFF5F5", text: "#E53E3E" },
  ghost:     { bg: "transparent", text: "#718096", border: "#E2E8F0" },
  success:   { bg: "#F0FFF4", text: "#38A169" },
};
interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: string;
}
export function WebButton({ label, onPress, variant = "primary", size = "md", icon }: ButtonProps) {
  const c = BTN_COLORS[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.bg,
        borderWidth: c.border ? 1 : 0,
        borderColor: c.border,
        borderRadius: 8,
        paddingHorizontal: size === "sm" ? 12 : 16,
        paddingVertical: size === "sm" ? 6 : 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon && <Text style={{ fontSize: size === "sm" ? 13 : 15 }}>{icon}</Text>}
      <Text style={{ color: c.text, fontSize: size === "sm" ? 12 : 14, fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
interface TableColumn {
  key: string;
  label: string;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}
interface TableProps {
  columns: TableColumn[];
  data: any[];
  onRowPress?: (row: any) => void;
}
export function WebTable({ columns, data, onRowPress }: TableProps) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#F7FAFC",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
        }}
      >
        {columns.map((col) => (
          <View
            key={col.key}
            style={{ flex: col.width ?? 1, paddingHorizontal: 14, paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#718096", textTransform: "uppercase" as any }}>
              {col.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Rows */}
      {data.map((row, idx) => (
        <Pressable
          key={idx}
          onPress={() => onRowPress?.(row)}
          style={({ pressed }) => ({
            flexDirection: "row",
            backgroundColor: pressed ? "#F7FAFC" : idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
            borderBottomWidth: idx < data.length - 1 ? 1 : 0,
            borderBottomColor: "#F0F4F8",
          })}
        >
          {columns.map((col) => (
            <View
              key={col.key}
              style={{
                flex: col.width ?? 1,
                paddingHorizontal: 14,
                paddingVertical: 12,
                justifyContent: "center",
              }}
            >
              {col.render ? (
                col.render(row[col.key], row)
              ) : (
                <Text style={{ fontSize: 13, color: "#2D3748" }}>{row[col.key] ?? "-"}</Text>
              )}
            </View>
          ))}
        </Pressable>
      ))}

      {data.length === 0 && (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Text style={{ color: "#A0AEC0", fontSize: 14 }}>데이터가 없습니다</Text>
        </View>
      )}
    </View>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
interface TimelineStep {
  label: string;
  done: boolean;
  current?: boolean;
}
interface TimelineProps {
  steps: TimelineStep[];
}
export function Timeline({ steps }: TimelineProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: step.current
                ? "#3182CE"
                : step.done
                ? "#F0FFF4"
                : "#F7FAFC",
              borderWidth: step.current ? 0 : 1,
              borderColor: step.done ? "#38A169" : "#E2E8F0",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: step.current ? "700" : "500",
                color: step.current ? "#FFFFFF" : step.done ? "#38A169" : "#A0AEC0",
              }}
            >
              {step.done && !step.current ? "✓ " : ""}{step.label}
            </Text>
          </View>
          {idx < steps.length - 1 && (
            <Text style={{ color: "#CBD5E0", fontSize: 12 }}>→</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
}
export function InfoRow({ label, value, valueColor = "#2D3748" }: InfoRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F7FAFC",
      }}
    >
      <Text style={{ width: 120, fontSize: 13, color: "#718096", fontWeight: "500" }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: valueColor, fontWeight: "500" }}>{value}</Text>
    </View>
  );
}
