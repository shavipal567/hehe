import React, { useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { getTheme, cardShadow } from "../theme";

function getLastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatHours(totalSeconds) {
  return (totalSeconds / 3600).toFixed(1);
}

function formatDetailed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export default function StatsScreen() {
  const { sessions, subjects, darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

  const last7 = getLastNDates(7);

  const dailyTotals = useMemo(() => {
    return last7.map((date) => {
      const total = sessions
        .filter((s) => s.date === date)
        .reduce((sum, s) => sum + s.seconds, 0);
      return { date, total };
    });
  }, [sessions]);

  const maxSeconds = Math.max(...dailyTotals.map((d) => d.total), 1);

  const subjectTotals = useMemo(() => {
    return subjects.map((subj) => ({
      ...subj,
      total: sessions.filter((s) => s.subjectId === subj.id).reduce((sum, s) => sum + s.seconds, 0),
    })).sort((a, b) => b.total - a.total);
  }, [sessions, subjects]);

  const weekTotal = dailyTotals.reduce((sum, d) => sum + d.total, 0);
  const pomoCount = sessions.filter((s) => s.mode === "pomodoro").length;
  const pomoSeconds = sessions.filter((s) => s.mode === "pomodoro").reduce((sum, s) => sum + s.seconds, 0);
  const stopwatchSeconds = sessions.filter((s) => s.mode !== "pomodoro").reduce((sum, s) => sum + s.seconds, 0);

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>Study Stats</Text>
          <Text style={styles.subtitle}>Last 7 days · {formatHours(weekTotal)}h total ({formatDetailed(weekTotal)}) · 🍅 {pomoCount} pomodoros</Text>

          <View style={styles.chartCard}>
            <View style={styles.barsRow}>
              {dailyTotals.map((d) => {
                const heightPct = (d.total / maxSeconds) * 100;
                const label = new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
                return (
                  <View key={d.date} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${Math.max(heightPct, 3)}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.splitRow}>
            <View style={styles.splitCard}>
              <Text style={styles.splitEmoji}>⏱️</Text>
              <Text style={styles.splitValue}>{formatDetailed(stopwatchSeconds)}</Text>
              <Text style={styles.splitLabel}>Stopwatch</Text>
            </View>
            <View style={styles.splitCard}>
              <Text style={styles.splitEmoji}>🍅</Text>
              <Text style={styles.splitValue}>{formatDetailed(pomoSeconds)}</Text>
              <Text style={styles.splitLabel}>Pomodoro ({pomoCount})</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>By subject</Text>
          {subjectTotals.length === 0 ? (
            <Text style={styles.empty}>Add subjects and log a few sessions to see stats here. 📊🌸</Text>
          ) : subjectTotals.map((s) => {
            const pct = weekTotal ? Math.round((s.total / weekTotal) * 100) : 0;
            return (
              <View key={s.id} style={styles.subjectRow}>
                <View style={styles.subjectHeader}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={styles.subjectName}>{s.name}</Text>
                  <Text style={styles.subjectHours}>{formatHours(s.total)}h</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.subjectDetailed}>{formatDetailed(s.total)}</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 16 },
  chartCard: {
    backgroundColor: theme.cardBg, borderRadius: 20, padding: 20, height: 200,
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  barsRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  barColumn: { alignItems: "center", flex: 1 },
  barTrack: {
    width: 18, height: 130, backgroundColor: "rgba(242,87,141,0.12)", borderRadius: 9,
    justifyContent: "flex-end", overflow: "hidden",
  },
  barFill: { width: "100%", backgroundColor: theme.primary, borderRadius: 9 },
  barLabel: { marginTop: 8, color: theme.muted, fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 24, marginBottom: 12 },
  splitRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  splitCard: {
    flex: 1, backgroundColor: theme.cardBg, borderRadius: 16, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  splitEmoji: { fontSize: 20, marginBottom: 4 },
  splitValue: { fontSize: 16, fontWeight: "800", color: theme.text, textAlign: "center" },
  splitLabel: { color: theme.muted, fontWeight: "600", fontSize: 12, marginTop: 2 },
  empty: { color: theme.muted, textAlign: "center", marginTop: 12 },
  subjectRow: { marginBottom: 14 },
  subjectHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  subjectName: { flex: 1, fontWeight: "600", color: theme.text },
  subjectHours: { fontWeight: "700", color: theme.muted },
  progressTrack: { height: 8, backgroundColor: "rgba(242,87,141,0.12)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  subjectDetailed: { color: theme.muted, fontSize: 11, marginTop: 4 },
});
}
