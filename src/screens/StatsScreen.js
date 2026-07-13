import React, { useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useStudy } from "../context/StudyContext";

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

export default function StatsScreen() {
  const { sessions, subjects } = useStudy();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Study Stats</Text>
        <Text style={styles.subtitle}>Last 7 days · {formatHours(weekTotal)}h total</Text>

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

        <Text style={styles.sectionTitle}>By subject</Text>
        {subjectTotals.map((s) => {
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
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F1FF", padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#2B2540", marginTop: 12 },
  subtitle: { color: "#8A83A6", marginTop: 4, marginBottom: 16 },
  chartCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20, height: 200,
  },
  barsRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  barColumn: { alignItems: "center", flex: 1 },
  barTrack: {
    width: 18, height: 130, backgroundColor: "#F0EDFB", borderRadius: 9,
    justifyContent: "flex-end", overflow: "hidden",
  },
  barFill: { width: "100%", backgroundColor: "#7C6CF6", borderRadius: 9 },
  barLabel: { marginTop: 8, color: "#8A83A6", fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2B2540", marginTop: 24, marginBottom: 12 },
  subjectRow: { marginBottom: 14 },
  subjectHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  subjectName: { flex: 1, fontWeight: "600", color: "#2B2540" },
  subjectHours: { fontWeight: "700", color: "#8A83A6" },
  progressTrack: { height: 8, backgroundColor: "#E7E2FA", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
});
