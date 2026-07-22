import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SkyBackground from "../components/SkyBackground";
import { useAuth } from "../context/AuthContext";
import { useStudy } from "../context/StudyContext";
import { getTheme, cardShadow } from "../theme";
import { formatHour12 } from "../utils/dayBoundary";

export default function SettingsScreen({ onBack }) {
  const { darkMode, dayStartHour, setDayStartHour } = useStudy();
  const { user, signOut } = useAuth();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await signOut();
  };

  const adjustDayStart = (delta) => {
    let next = dayStartHour + delta;
    if (next < 0) next = 23;
    if (next > 23) next = 0;
    setDayStartHour(next);
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

          <Text style={styles.label}>Day Boundary</Text>
          <View style={styles.dayStartRow}>
            <Text style={styles.dayStartHint}>
              Sessions and tasks logged before this time count toward the previous day. Default is midnight.
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperButton} onPress={() => adjustDayStart(-1)}>
                <Text style={styles.stepperButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{formatHour12(dayStartHour)}</Text>
              <TouchableOpacity style={styles.stepperButton} onPress={() => adjustDayStart(1)}>
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {dayStartHour !== 0 && (
              <TouchableOpacity onPress={() => setDayStartHour(0)}>
                <Text style={styles.resetText}>Reset to midnight</Text>
              </TouchableOpacity>
            )}
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

  dayStartRow: {
    backgroundColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    borderRadius: 14,
    padding: 14,
  },
  dayStartHint: { color: theme.muted, fontSize: 12, lineHeight: 17, marginBottom: 12 },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 },
  stepperButton: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: theme.primary,
  },
  stepperButtonText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  stepperValue: { color: theme.text, fontWeight: "800", fontSize: 17, minWidth: 90, textAlign: "center" },
  resetText: { color: theme.primary, fontWeight: "700", fontSize: 12, textAlign: "center", marginTop: 10 },

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