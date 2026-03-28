import { useEffect } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { router } from "expo-router";

export default function SplashScreen() {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const sloganOpacity = useSharedValue(0);
  const sloganY = useSharedValue(14);

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

    // 2.4초 후 홈으로 이동
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require("@/assets/images/sagocare_logo_transparent.png")}
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 36,
  },
  logo: {
    width: 300,
    height: 200,
  },
  sloganWrapper: {
    alignItems: "center",
    gap: 8,
  },
  slogan: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2B4C",
    letterSpacing: 0.5,
  },
  subSlogan: {
    fontSize: 13,
    color: "#718096",
    letterSpacing: 0.2,
  },
});
