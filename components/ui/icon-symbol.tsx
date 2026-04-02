// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Default
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // App tabs
  "car.fill": "directions-car",
  "play.rectangle.fill": "play-circle-filled",
  "map.fill": "map",
  "person.fill": "person",
  // UI icons
  "bell.fill": "notifications",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "location.fill": "location-on",
  "phone.fill": "phone",
  "star.fill": "star",
  "clock.fill": "access-time",
  "doc.text.fill": "description",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "chevron.left": "chevron-left",
  "info.circle.fill": "info",
  "shield.fill": "security",
  "wrench.fill": "build",
  "cross.fill": "local-hospital",
  "scale.3d": "balance",
  "car.2.fill": "local-taxi",
  "arrow.right": "arrow-forward",
  "plus.circle.fill": "add-circle",
  "trash.fill": "delete",
  "pencil": "edit",
  "gear": "settings",
  "magnifyingglass": "search",
  "heart.fill": "favorite",
  "flame.fill": "local-fire-department",
  // Guardian
  "person.2.fill": "group",
  "person.badge.plus": "person-add",
  "shield.checkmark.fill": "verified-user",
  "sos.fill": "sos",
  "waveform.path.ecg": "monitor-heart",
  "antenna.radiowaves.left.and.right": "wifi-tethering",
  "checkmark.shield.fill": "security",
  "ellipsis": "more-horiz",
  "minus.circle.fill": "remove-circle",
  // Drive mode & parking
  "p.square.fill": "local-parking",
  "car.fill.badge.plus": "add-road",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
