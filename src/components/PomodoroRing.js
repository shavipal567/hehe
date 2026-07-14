import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { theme } from "../theme";

const STROKE = 16;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// A round, glowing pomodoro display: a soft pulsing color blob "breathes"
// behind a circular progress ring that drains smoothly as the phase runs
// down. Ring + glow both recolor depending on focus vs break phase.
// `size` is configurable so it can go full-page-large on the Timer screen.

export default function PomodoroRing({ remaining, total, phase, size = 220, children }) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const color = phase === "work" ? theme.primary : theme.secondary;
  const glowColor = phase === "work" ? "rgba(242,87,141,0.35)" : "rgba(127,184,232,0.35)";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
    Animated.timing(progress, {
      toValue: fraction,
      duration: 350,
      easing: Easing.linear,
      useNativeDriver: false, // strokeDashoffset can't use native driver
    }).start();
  }, [remaining, total]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.95] });

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const glowSize = size + Math.round(size * 0.18);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: glowSize, height: glowSize, borderRadius: glowSize / 2,
            backgroundColor: glowColor, opacity: glowOpacity, transform: [{ scale }],
          },
        ]}
      />
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ transform: [{ scaleX: -1 }, { rotate: "-90deg" }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View style={styles.centerContent}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
