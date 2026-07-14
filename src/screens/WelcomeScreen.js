import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";

// Shown exactly once, the very first time the app opens (onboarded flag is
// false). Whatever she enters here is saved permanently on this device —
// she'll never see this screen again unless the app's storage is cleared.

export default function WelcomeScreen() {
  const { completeOnboarding, profile } = useStudy();
  const [name, setName] = useState(profile.name || "");

  return (
    <SkyBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>🩺🌸✨</Text>
            <Text style={styles.title}>Welcome to GRIND</Text>
            <Text style={styles.subtitle}>
              Your cozy study companion — timer, planner, calendar, and stats,
              all saved right here on your device.
            </Text>

            <Text style={styles.label}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Dr. Shavi"
              autoFocus
            />

            <TouchableOpacity style={styles.buttonWrap} onPress={() => completeOnboarding(name)} activeOpacity={0.85}>
              <LinearGradient
                colors={[theme.primary, "#B94E8C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Let's get started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footnote}>
              This only shows once — everything you enter is saved automatically from here on. 💗
            </Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...cardShadow,
  },
  emoji: { fontSize: 32, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", color: theme.text, textAlign: "center" },
  subtitle: { color: theme.muted, textAlign: "center", marginTop: 8, marginBottom: 20, lineHeight: 20 },
  label: { color: theme.muted, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
  },
  button: {
    borderRadius: 16, paddingVertical: 16, alignItems: "center",
  },
  buttonWrap: {
    marginTop: 20, borderRadius: 16,
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footnote: { color: theme.muted, fontSize: 12, textAlign: "center", marginTop: 16 },
});
