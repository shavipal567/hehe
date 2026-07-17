import React, { useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { getTheme, cardShadow } from "../theme";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const { todos, sessions, addTodo, toggleTodo, removeTodo, darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(toDateStr(now.getFullYear(), now.getMonth(), now.getDate()));
  const [text, setText] = useState("");

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const activityByDate = useMemo(() => {
    const map = {};
    todos.forEach((t) => { map[t.date] = map[t.date] || { todos: 0, studied: false }; map[t.date].todos++; });
    sessions.forEach((s) => { map[s.date] = map[s.date] || { todos: 0, studied: false }; map[s.date].studied = true; });
    return map;
  }, [todos, sessions]);

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dayTodos = todos.filter((t) => t.date === selectedDate);
  const isToday = selectedDate === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), selectedDate);
    setText("");
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Plan ahead, not just for today. 🗓️🌷</Text>

          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((w, i) => (
              <Text key={i} style={styles.weekdayLabel}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={styles.cell} />;
              const dateStr = toDateStr(viewYear, viewMonth, d);
              const activity = activityByDate[dateStr];
              const selected = dateStr === selectedDate;
              const todayCell = dateStr === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
              return (
                <TouchableOpacity key={i} style={styles.cell} onPress={() => setSelectedDate(dateStr)}>
                  <View style={[
                    styles.dayCircle,
                    selected && styles.dayCircleSelected,
                    todayCell && !selected && styles.dayCircleToday,
                  ]}>
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{d}</Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {activity?.todos > 0 && <View style={[styles.dot, { backgroundColor: theme.secondary }]} />}
                    {activity?.studied && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dayCard}>
            <Text style={styles.dayCardTitle}>
              {isToday ? "Today" : new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Add a task for this day..."
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleAdd}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {dayTodos.length === 0 ? (
              <Text style={styles.empty}>Nothing planned for this day yet.</Text>
            ) : (
              dayTodos.map((item) => (
                <View key={item.id} style={styles.todoRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, item.done && styles.checkboxDone]}
                    onPress={() => toggleTodo(item.id)}
                  >
                    {item.done && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={[styles.todoText, item.done && styles.todoTextDone]}>{item.text}</Text>
                  <TouchableOpacity onPress={() => removeTodo(item.id)}>
                    <Text style={styles.remove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
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
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  navButton: { paddingHorizontal: 18, paddingVertical: 4 },
  navButtonText: { fontSize: 22, color: theme.primary, fontWeight: "700" },
  monthLabel: { fontSize: 16, fontWeight: "700", color: theme.text, minWidth: 160, textAlign: "center" },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: "center", color: theme.muted, fontWeight: "700", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 6 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayCircleSelected: { backgroundColor: theme.primary },
  dayCircleToday: { borderWidth: 1.5, borderColor: theme.primary },
  dayText: { color: theme.text, fontWeight: "600" },
  dayTextSelected: { color: "#fff" },
  dotsRow: { flexDirection: "row", marginTop: 3, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginHorizontal: 1 },
  dayCard: {
    backgroundColor: theme.cardBg, borderRadius: 20, padding: 16, marginTop: 16, marginBottom: 30,
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  dayCardTitle: { fontSize: 17, fontWeight: "700", color: theme.text, marginBottom: 10 },
  inputRow: { flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8,
  },
  addButton: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "700" },
  empty: { color: theme.muted, textAlign: "center", paddingVertical: 12 },
  todoRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.primary,
    marginRight: 10, alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: theme.primary },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  todoText: { flex: 1, color: theme.text },
  todoTextDone: { textDecorationLine: "line-through", color: theme.muted },
  remove: { color: theme.muted, fontSize: 15, paddingHorizontal: 4 },
});
}
