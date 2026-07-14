import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";
import { getRandomMessage } from "../motivation";

export default function ForYouScreen() {
  const [current, setCurrent] = useState(null);
  const fade = useRef(new Animated.Value(1)).current;

  const showMessage = () => {
    const { text, index } = getRandomMessage(current?.index ?? -1);
    fade.setValue(0);
    setCurrent({ text, index });
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>For You 💗</Text>
        <Text style={styles.subtitle}>
          A little stash of notes from Palvika, for whenever studying feels like too much.
        </Text>

        {!current ? (
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>🌸💌🌷</Text>
            <Text style={styles.introText}>
              Feeling stressed, overwhelmed, or just need a little reminder that
              you're doing great? Tap below.
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.messageCard, { opacity: fade }]}>
            <Text style={styles.messageQuote}>“</Text>
            <Text style={styles.messageText}>{current.text}</Text>
            <Text style={styles.signature}>— Palvika 💗</Text>
          </Animated.View>
        )}

        <TouchableOpacity style={styles.buttonWrap} onPress={showMessage} activeOpacity={0.85}>
          <LinearGradient
            colors={[theme.primary, "#B94E8C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {current ? "Send me another 🌸" : "I need a little pick-me-up 💗"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          You're never bothering anyone by needing a break. Take one. 🩺✨
        </Text>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, textAlign: "center" },
  subtitle: { color: theme.muted, textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 20 },
  introCard: {
    backgroundColor: theme.cardBg, borderRadius: 24, padding: 28, alignItems: "center",
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  introEmoji: { fontSize: 26, marginBottom: 10 },
  introText: { color: theme.text, textAlign: "center", lineHeight: 22, fontSize: 15 },
  messageCard: {
    backgroundColor: theme.cardBg, borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  messageQuote: { fontSize: 40, color: theme.primary, fontWeight: "800", lineHeight: 40, marginBottom: -8 },
  messageText: { color: theme.text, fontSize: 17, lineHeight: 26, fontWeight: "500" },
  signature: { color: theme.primary, fontWeight: "700", marginTop: 16, textAlign: "right", fontSize: 15 },
  button: {
    borderRadius: 18, paddingVertical: 16, alignItems: "center",
  },
  buttonWrap: {
    marginTop: 24, borderRadius: 18,
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footnote: { color: theme.muted, fontSize: 12, textAlign: "center", marginTop: 18 },
});
