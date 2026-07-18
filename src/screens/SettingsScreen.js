import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SkyBackground from "../components/SkyBackground";
import { useAuth } from "../context/AuthContext";
import { useStudy } from "../context/StudyContext";
import { getTheme, cardShadow } from "../theme";

export default function SettingsScreen({ onBack }) {
  const { darkMode } = useStudy();
  const { user, signOut } = useAuth();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await signOut();
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.emoji}>⚙️</Text>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.label}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? "—"}</Text>
          </View>

          <TouchableOpacity style={styles.buttonWrap} onPress={handleLogout} disabled={busy} activeOpacity={0.85}>
            <LinearGradient
              colors={["#F65C6C", "#F2578D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Logout</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backRow: { marginBottom: 12 },
  backText: { color: theme.primary, fontWeight: "700", fontSize: 17 },
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...cardShadow,
  },
  emoji: { fontSize: 32, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, textAlign: "center" },
  label: { color: theme.muted, fontWeight: "700", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  infoRow: {
    backgroundColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    borderRadius: 14, padding: 14,
  },
  infoLabel: { color: theme.muted, fontWeight: "600", fontSize: 12 },
  infoValue: { color: theme.text, fontWeight: "700", fontSize: 15, marginTop: 4 },
  button: {
    borderRadius: 16, paddingVertical: 16, alignItems: "center",
  },
  buttonWrap: {
    marginTop: 24, borderRadius: 16,
    shadowColor: "#F65C6C", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
}
