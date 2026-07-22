import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { getTheme, cardShadow } from "../theme";

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function formatShortLabel(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Sunday-start week containing today, offset by `weekOffset` weeks.
// weekKey = the Sunday's date string — a stable, unique identifier for that week.
function getWeekInfo(weekOffset) {
  const base = new Date();
  base.setDate(base.getDate() + weekOffset * 7);
  const dayOfWeek = base.getDay();
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const weekKey = toDateStr(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
  const rangeLabel = `${formatShortLabel(weekKey)} – ${formatShortLabel(toDateStr(saturday.getFullYear(), saturday.getMonth(), saturday.getDate()))}`;
  return { weekKey, rangeLabel };
}

function getMonthInfo(monthOffset) {
  const base = new Date();
  base.setMonth(base.getMonth() + monthOffset);
  const y = base.getFullYear();
  const m = base.getMonth();
  const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
  const label = new Date(y, m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return { monthKey, label };
}

export default function PlannerScreen() {
  const {
    weekGoals, monthGoals,
    addWeekGoal, toggleWeekGoal, removeWeekGoal,
    addMonthGoal, toggleMonthGoal, removeMonthGoal,
    darkMode,
  } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

  const [viewMode, setViewMode] = useState("week"); // "week" | "month"
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [text, setText] = useState("");

  const { weekKey, rangeLabel } = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);
  const { monthKey, label: monthLabel } = useMemo(() => getMonthInfo(monthOffset), [monthOffset]);

  const currentWeekGoals = weekGoals[weekKey] || [];
  const currentMonthGoals = monthGoals[monthKey] || [];

  const handleAdd = () => {
    if (!text.trim()) return;
    if (viewMode === "week") {
      addWeekGoal(weekKey, text.trim());
    } else {
      addMonthGoal(monthKey, text.trim());
    }
    setText("");
  };

  const activeGoals = viewMode === "week" ? currentWeekGoals : currentMonthGoals;
  const doneCount = activeGoals.filter((g) => g.done).length;

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Planner</Text>
          <Text style={styles.subtitle}>Rough, cumulative goals — not tied to specific days. 📝🌷</Text>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeButton, viewMode === "week" && styles.modeButtonActive]}
              onPress={() => setViewMode("week")}
            >
              <Text style={[styles.modeButtonText, viewMode === "week" && styles.modeButtonTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, viewMode === "month" && styles.modeButtonActive]}
              onPress={() => setViewMode("month")}
            >
              <Text style={[styles.modeButtonText, viewMode === "month" && styles.modeButtonTextActive]}>Month</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navHeader}>
            <TouchableOpacity
              onPress={() => (viewMode === "week" ? setWeekOffset((w) => w - 1) : setMonthOffset((m) => m - 1))}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navLabel}>{viewMode === "week" ? rangeLabel : monthLabel}</Text>
            <TouchableOpacity
              onPress={() => (viewMode === "week" ? setWeekOffset((w) => w + 1) : setMonthOffset((m) => m + 1))}
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {(weekOffset !== 0 && viewMode === "week") || (monthOffset !== 0 && viewMode === "month") ? (
            <TouchableOpacity
              style={styles.backToCurrentButton}
              onPress={() => (viewMode === "week" ? setWeekOffset(0) : setMonthOffset(0))}
            >
              <Text style={styles.backToCurrentText}>
                ↺ Back to {viewMode === "week" ? "this week" : "this month"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.progressCard}>
            <Text style={styles.progressText}>
              {doneCount} / {activeGoals.length} done
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${activeGoals.length ? (doneCount / activeGoals.length) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={viewMode === "week" ? "Add a goal for this week..." : "Add a goal for this month..."}
              placeholderTextColor={theme.muted}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {activeGoals.length === 0 ? (
            <Text style={styles.empty}>
              Nothing planned {viewMode === "week" ? "this week" : "this month"} yet — add a rough goal above.
            </Text>
          ) : (
            activeGoals.map((item) => (
              <View key={item.id} style={styles.goalRow}>
                <TouchableOpacity
                  style={[styles.checkbox, item.done && styles.checkboxDone]}
                  onPress={() =>
                    viewMode === "week" ? toggleWeekGoal(weekKey, item.id) : toggleMonthGoal(monthKey, item.id)
                  }
                >
                  {item.done && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text style={[styles.goalText, item.done && styles.goalTextDone]}>{item.text}</Text>
                <TouchableOpacity
                  onPress={() =>
                    viewMode === "week" ? removeWeekGoal(weekKey, item.id) : removeMonthGoal(monthKey, item.id)
                  }
                >
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 12 },

  modeSwitch: {
    flexDirection: "row", backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)",
    borderRadius: 16, padding: 4, marginBottom: 16,
  },
  modeButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modeButtonActive: { backgroundColor: theme.primary },
  modeButtonText: { fontWeight: "700", color: theme.muted, fontSize: 15 },
  modeButtonTextActive: { color: "#fff" },

  navHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  navButton: { paddingHorizontal: 18, paddingVertical: 4 },
  navButtonText: { fontSize: 22, color: theme.primary, fontWeight: "700" },
  navLabel: { fontSize: 16, fontWeight: "700", color: theme.text, minWidth: 170, textAlign: "center" },

  backToCurrentButton: { alignSelf: "center", marginBottom: 12 },
  backToCurrentText: { color: theme.primary, fontWeight: "700", fontSize: 12 },

  progressCard: {
    backgroundColor: theme.cardBg, borderRadius: 16, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  progressText: { color: theme.text, fontWeight: "700", fontSize: 13, marginBottom: 8 },
  progressTrack: { height: 8, backgroundColor: "rgba(242,87,141,0.12)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: theme.primary, borderRadius: 4 },

  inputRow: { flexDirection: "row", marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "#fff",
    color: theme.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  addButton: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },

  empty: { color: theme.muted, textAlign: "center", marginTop: 20 },

  goalRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.primary,
    marginRight: 12, alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: theme.primary },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  goalText: { flex: 1, fontSize: 15, color: theme.text },
  goalTextDone: { textDecorationLine: "line-through", color: theme.muted },
  remove: { color: theme.muted, fontSize: 16, paddingHorizontal: 6 },
});
}