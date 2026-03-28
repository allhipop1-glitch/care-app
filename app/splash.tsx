import { useEffect } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { router } from "expo-router";

export default function SplashScreen() {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const sloganOpacity = useSharedValue(0);
  const sloganY = useSharedValue(16);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
    transform: [{ translateY: sloganY.value }],
  }));

  useEffect(() => {
    // 로고 페이드인 + 스케일업
    logoOpacity.value = withTiming(1, { duration: 700 });
    logoScale.value = withTiming(1, { duration: 700 });

    // 슬로건 딜레이 후 페이드인
    sloganOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    sloganY.value = withDelay(500, withTiming(0, { duration: 600 }));

    // 2.2초 후 홈으로 이동
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* 배경 그라디언트 효과 */}
      <View style={styles.bgCircle} />

      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require("@/assets/images/sagocare_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.sloganWrapper, sloganStyle]}>
        <Text style={styles.slogan}>교통사고는 사고케어</Text>
        <Text style={styles.subSlogan}>사고 순간부터 해결까지, 함께합니다</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D2240",
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(255,255,255,0.03)",
    top: "20%",
    alignSelf: "center",
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 280,
    height: 188,
  },
  sloganWrapper: {
    alignItems: "center",
    gap: 8,
  },
  slogan: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subSlogan: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.3,
  },
});
