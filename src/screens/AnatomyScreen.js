import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Platform } from "react-native";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";

let Anatomy3D = null;
if (Platform.OS === "web") {
  Anatomy3D = require("../components/Anatomy3D").default;
}

export default function AnatomyScreen() {
  return (
    <SkyBackground showFloaters={false}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>3D Anatomy 🦴</Text>
        <Text style={styles.subtitle}>
          A simplified interactive skeleton for quick orientation and review.
        </Text>

        {Platform.OS === "web" ? (
          <View style={styles.viewerWrap}>
            <Anatomy3D />
          </View>
        ) : (
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackEmoji}>🦴</Text>
            <Text style={styles.fallbackTitle}>Open this on the web version</Text>
            <Text style={styles.fallbackText}>
              The 3D viewer currently only runs in a browser. Open the GRIND
              web link on your phone or computer to explore it — it'll show
              up right here on this same tab.
            </Text>
          </View>
        )}

        <Text style={styles.disclaimer}>
          This is a simplified, stylized model built for study orientation —
          not a medical-grade or photorealistic reference.
        </Text>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 12 },
  viewerWrap: { flex: 1, borderRadius: 20, overflow: "hidden" },
  fallbackCard: {
    flex: 1, backgroundColor: theme.cardBg, borderRadius: 24, padding: 28,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  fallbackEmoji: { fontSize: 40, marginBottom: 12 },
  fallbackTitle: { fontSize: 18, fontWeight: "800", color: theme.text, textAlign: "center", marginBottom: 8 },
  fallbackText: { color: theme.muted, textAlign: "center", lineHeight: 20 },
  disclaimer: { color: theme.muted, fontSize: 11, textAlign: "center", marginTop: 10 },
});
