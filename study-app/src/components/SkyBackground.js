import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { getBackgroundPalette } from "../theme";
import { useStudy } from "../context/StudyContext";

const { height: SCREEN_H } = Dimensions.get("window");

const STARS = [
  { x: 24, y: 50, r: 1.6, phase: 0 }, { x: 70, y: 24, r: 1.1, phase: 1 },
  { x: 118, y: 66, r: 1.8, phase: 0 }, { x: 160, y: 20, r: 1.2, phase: 1 },
  { x: 205, y: 55, r: 1.4, phase: 0 }, { x: 250, y: 28, r: 1.7, phase: 1 },
  { x: 292, y: 62, r: 1.2, phase: 0 }, { x: 330, y: 18, r: 1.5, phase: 1 },
  { x: 355, y: 48, r: 1.3, phase: 0 }, { x: 45, y: 110, r: 1.2, phase: 1 },
  { x: 140, y: 130, r: 1.5, phase: 0 }, { x: 230, y: 105, r: 1.2, phase: 1 },
  { x: 310, y: 125, r: 1.4, phase: 0 }, { x: 190, y: 150, r: 1.1, phase: 1 },
];

const TOP_FLOATERS = ["🌸", "✨", "🌷", "⭐️"];
const BOTTOM_FLOATERS = ["💫", "🌼", "🩺", "🌸"];
const HEARTS = [
  { left: "12%", delay: 0, size: 14 },
  { left: "45%", delay: 900, size: 11 },
  { left: "78%", delay: 1600, size: 16 },
  { left: "60%", delay: 2400, size: 10 },
];

function DriftingHeart({ left, delay, size }) {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      rise.setValue(0);
      Animated.timing(rise, {
        toValue: 1,
        duration: 7000,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => loop());
    };
    loop();
  }, []);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_H * 0.55] });
  const opacity = rise.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.55, 0.4, 0] });

  return (
    <Animated.Text
      style={[styles.heart, { left, fontSize: size, opacity, transform: [{ translateY }] }]}
    >
      💗
    </Animated.Text>
  );
}

export default function SkyBackground({ children, showFloaters = true }) {
  const { bgPalette } = useStudy();
  const palette = getBackgroundPalette(bgPalette);
  const twinkle = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bobTranslate = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const bobTranslateReverse = bob.interpolate({ inputRange: [0, 1], outputRange: [-7, 0] });

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={palette.gradient}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.blobPinkTop, { backgroundColor: palette.blobPink }]} pointerEvents="none" />
      <View style={[styles.blobBlueBottom, { backgroundColor: palette.blobBlue }]} pointerEvents="none" />
      <View style={[styles.blobLavenderMid, { backgroundColor: palette.blobLavender }]} pointerEvents="none" />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 380 200">
          {STARS.filter((s) => s.phase === 0).map((s, i) => (
            <Circle key={`a${i}`} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) }]} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 380 200">
          {STARS.filter((s) => s.phase === 1).map((s, i) => (
            <Circle key={`b${i}`} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" />
          ))}
          <Path
            d="M 345 22 A 9 9 0 1 0 345 40 A 7 7 0 1 1 345 22 Z"
            fill="#FFFFFF"
            opacity={0.85}
          />
        </Svg>
      </Animated.View>

      <Svg
        style={styles.hills}
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        <Path
          d="M0,90 C60,60 100,110 160,80 C220,50 260,100 320,75 C360,58 380,70 400,60 L400,140 L0,140 Z"
          fill={palette.hillFar}
        />
        <Path
          d="M0,115 C70,95 130,130 200,105 C260,84 300,120 400,95 L400,140 L0,140 Z"
          fill={palette.hillNear}
        />
      </Svg>

      {HEARTS.map((h, i) => (
        <DriftingHeart key={i} left={h.left} delay={h.delay} size={h.size} />
      ))}

      {showFloaters && (
        <>
          <Animated.View style={[styles.floaterRow, styles.floaterRowTop, { transform: [{ translateY: bobTranslate }] }]} pointerEvents="none">
            {TOP_FLOATERS.map((f, i) => (
              <Text key={i} style={[styles.floater, { opacity: 0.45 + (i % 3) * 0.12 }]}>{f}</Text>
            ))}
          </Animated.View>
          <Animated.View style={[styles.floaterRow, styles.floaterRowBottom, { transform: [{ translateY: bobTranslateReverse }] }]} pointerEvents="none">
            {BOTTOM_FLOATERS.map((f, i) => (
              <Text key={i} style={[styles.floater, { opacity: 0.35 + (i % 3) * 0.1 }]}>{f}</Text>
            ))}
          </Animated.View>
        </>
      )}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1 },
  blobPinkTop: {
    position: "absolute", top: -60, left: -40, width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,158,196,0.35)",
  },
  blobBlueBottom: {
    position: "absolute", bottom: -80, right: -50, width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(127,184,232,0.30)",
  },
  blobLavenderMid: {
    position: "absolute", top: "38%", right: -70, width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(180,151,232,0.20)",
  },
  hills: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: "22%",
  },
  heart: {
    position: "absolute",
    bottom: 40,
  },
  floaterRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  floaterRowTop: { top: 6 },
  floaterRowBottom: { bottom: 6 },
  floater: { fontSize: 17 },
});
