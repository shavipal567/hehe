import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { getTheme, cardShadow } from "../theme";
import { getEffectiveDateStr } from "../utils/dayBoundary";

// ---------- date/time helpers ----------
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
function todayStr(dayStartHour = 0) {
  return getEffectiveDateStr(dayStartHour);
}
function yesterdayStr(dayStartHour = 0) {
  const [y, m, d] = todayStr(dayStartHour).split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return ymd(dt);
}
function last7Dates(dayStartHour = 0) {
  const [y, m, d] = todayStr(dayStartHour).split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(base.getDate() - i);
    dates.push(ymd(dt));
  }
  return dates;
}
function currentYearMonth(dayStartHour = 0) {
  return todayStr(dayStartHour).slice(0, 7);
}
function formatDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function formatWeekday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}
function formatTimeRange(session) {
  if (!session.startedAt) return null;
  const start = new Date(session.startedAt);
  const end = new Date(start.getTime() + session.seconds * 1000);
  const fmt = (d) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fmt(start)}–${fmt(end)}`;
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
  if (h === 0) parts.push(`${s}s`);
  return parts.join(" ") || "0s";
}

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "lifetime", label: "Lifetime" },
];

function filterByRange(sessions, range, dayStartHour = 0) {
  if (range === "lifetime") return sessions;
  if (range === "today") {
    const t = todayStr(dayStartHour);
    return sessions.filter((s) => s.date === t);
  }
  if (range === "yesterday") {
    const y = yesterdayStr(dayStartHour);
    return sessions.filter((s) => s.date === y);
  }
  if (range === "week") {
    const set = new Set(last7Dates(dayStartHour));
    return sessions.filter((s) => set.has(s.date));
  }
  if (range === "month") {
    const ym = currentYearMonth(dayStartHour);
    return sessions.filter((s) => s.date.slice(0, 7) === ym);
  }
  return sessions;
}

function aggregate(sessions, subjects) {
  const total = sessions.reduce((sum, s) => sum + s.seconds, 0);
  const pomoSeconds = sessions.filter((s) => s.mode === "pomodoro").reduce((sum, s) => sum + s.seconds, 0);
  const stopwatchSeconds = sessions.filter((s) => s.mode !== "pomodoro").reduce((sum, s) => sum + s.seconds, 0);
  const bySubject = subjects
    .map((subj) => ({
      ...subj,
      total: sessions.filter((s) => s.subjectId === subj.id).reduce((sum, s) => sum + s.seconds, 0),
      pomo: sessions.filter((s) => s.subjectId === subj.id && s.mode === "pomodoro").reduce((sum, s) => sum + s.seconds, 0),
      stopwatch: sessions.filter((s) => s.subjectId === subj.id && s.mode !== "pomodoro").reduce((sum, s) => sum + s.seconds, 0),
    }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);
  return { total, pomoSeconds, stopwatchSeconds, bySubject };
}

function groupByDate(sessions) {
  const map = new Map();
  sessions.forEach((s) => {
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date).push(s);
  });
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, sess]) => ({
      date,
      sessions: sess.sort((a, b) => (a.startedAt || "").localeCompare(b.startedAt || "")),
      total: sess.reduce((sum, s) => sum + s.seconds, 0),
    }));
}

// ---------- dynamic chart bucket builder ----------
// Builds bars appropriate to the selected range: hourly for today/yesterday,
// daily for week/month, monthly for lifetime.
function buildChartBuckets(sessions, range, dayStartHour = 0) {
  if (range === "today" || range === "yesterday") {
    const targetDate = range === "today" ? todayStr(dayStartHour) : yesterdayStr(dayStartHour);
    const buckets = Array.from({ length: 24 }, (_, h) => ({ key: `h${h}`, label: h % 3 === 0 ? `${h}` : "", total: 0 }));
    sessions
      .filter((s) => s.date === targetDate && s.startedAt)
      .forEach((s) => {
        const hour = new Date(s.startedAt).getHours();
        buckets[hour].total += s.seconds;
      });
    return buckets;
  }

  if (range === "week") {
    return last7Dates(dayStartHour).map((date) => ({
      key: date,
      label: formatWeekday(date),
      total: sessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.seconds, 0),
    }));
  }

  if (range === "month") {
    const ym = currentYearMonth(dayStartHour);
    const totalDays = new Date().getDate();
    const bars = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${ym}-${String(d).padStart(2, "0")}`;
      bars.push({
        key: dateStr,
        label: d % 5 === 0 || d === 1 || d === totalDays ? `${d}` : "",
        total: sessions.filter((s) => s.date === dateStr).reduce((sum, s) => sum + s.seconds, 0),
      });
    }
    return bars;
  }

  // lifetime: one bar per month that has any data, oldest to newest
  const map = new Map();
  sessions.forEach((s) => {
    const ym = s.date.slice(0, 7);
    map.set(ym, (map.get(ym) || 0) + s.seconds);
  });
  const sortedKeys = [...map.keys()].sort();
  if (sortedKeys.length === 0) return [];
  return sortedKeys.map((ym) => ({
    key: ym,
    label: new Date(ym + "-01T00:00:00").toLocaleDateString(undefined, { month: "short" }),
    total: map.get(ym),
  }));
}

function DynamicBarChart({ sessions, range, theme, styles, dayStartHour = 0 }) {
  const buckets = useMemo(() => buildChartBuckets(sessions, range, dayStartHour), [sessions, range, dayStartHour]);
  const maxSeconds = Math.max(...buckets.map((b) => b.total), 1);
  const isScrollable = range === "month" || range === "lifetime";
  const barWidth = range === "today" || range === "yesterday" ? 8 : range === "week" ? 18 : 12;

  if (buckets.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.empty}>No data yet for this range.</Text>
      </View>
    );
  }

  const content = (
    <View style={[styles.barsRow, isScrollable && { justifyContent: "flex-start", gap: 6, paddingHorizontal: 4 }]}>
      {buckets.map((b) => {
        const heightPct = (b.total / maxSeconds) * 100;
        return (
          <View key={b.key} style={[styles.barColumn, isScrollable && { flex: 0, width: barWidth + 10 }]}>
            <View style={[styles.barTrack, { width: barWidth }]}>
              <View style={[styles.barFill, { height: `${b.total > 0 ? Math.max(heightPct, 3) : 0}%` }]} />
            </View>
            {!!b.label && <Text style={styles.barLabel}>{b.label}</Text>}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartCardTitle}>
        {range === "today" || range === "yesterday" ? "By hour" : range === "week" ? "By day" : range === "month" ? "By day this month" : "By month"}
      </Text>
      {isScrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

export default function StatsScreen() {
  const { sessions, subjects, darkMode,dayStartHour} = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

  const [activeTab, setActiveTab] = useState("overview"); // overview | daily | subject
  const [range, setRange] = useState("week");
  const [expandedDate, setExpandedDate] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id);
  const [subjectRange, setSubjectRange] = useState("week");
  const [subjectExpandedDate, setSubjectExpandedDate] = useState(null);

  const subjectById = useMemo(() => {
    const m = new Map();
    subjects.forEach((s) => m.set(s.id, s));
    return m;
  }, [subjects]);

  // ---------- Overview data ----------
  const rangedSessions = useMemo(() => filterByRange(sessions, range, dayStartHour), [sessions, range, dayStartHour]);
  const overview = useMemo(() => aggregate(rangedSessions, subjects), [rangedSessions, subjects]);

  // ---------- Daily history ----------
  const allByDate = useMemo(() => groupByDate(sessions), [sessions]);

  // ---------- Subject stats ----------
  const currentSubject = subjectById.get(selectedSubjectId);
  const subjectSessions = useMemo(
    () => sessions.filter((s) => s.subjectId === selectedSubjectId),
    [sessions, selectedSubjectId]
  );
  const subjectRangedSessions = useMemo(() => filterByRange(subjectSessions, subjectRange, dayStartHour), [subjectSessions, subjectRange, dayStartHour]);
  const subjectByDate = useMemo(() => groupByDate(subjectSessions), [subjectSessions]);

  const lifetimeTotal = useMemo(() => sessions.reduce((sum, s) => sum + s.seconds, 0), [sessions]);

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Lifetime · {formatHours(lifetimeTotal)}h ({formatDetailed(lifetimeTotal)})</Text>

        <View style={styles.tabRow}>
          {[
            { key: "overview", label: "Overview" },
            { key: "daily", label: "Daily History" },
            { key: "subject", label: "By Subject" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabButton, activeTab === t.key && styles.tabButtonActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabButtonText, activeTab === t.key && styles.tabButtonTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === "overview" && (
            <>
              <View style={styles.rangeRow}>
                {RANGES.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.rangeChip, range === r.key && styles.rangeChipActive]}
                    onPress={() => setRange(r.key)}
                  >
                    <Text style={[styles.rangeChipText, range === r.key && styles.rangeChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{formatDetailed(overview.total)}</Text>
                <Text style={styles.totalLabel}>{RANGES.find((r) => r.key === range)?.label} total</Text>
              </View>

              <DynamicBarChart sessions={sessions} range={range} theme={theme} styles={styles} dayStartHour={dayStartHour} />

              <View style={styles.splitRow}>
                <View style={styles.splitCard}>
                  <Text style={styles.splitEmoji}>⏱️</Text>
                  <Text style={styles.splitValue}>{formatDetailed(overview.stopwatchSeconds)}</Text>
                  <Text style={styles.splitLabel}>Stopwatch</Text>
                </View>
                <View style={styles.splitCard}>
                  <Text style={styles.splitEmoji}>🍅</Text>
                  <Text style={styles.splitValue}>{formatDetailed(overview.pomoSeconds)}</Text>
                  <Text style={styles.splitLabel}>Pomodoro</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>By subject</Text>
              {overview.bySubject.length === 0 ? (
                <Text style={styles.empty}>No sessions in this range yet. 📊🌸</Text>
              ) : (
                overview.bySubject.map((s) => {
                  const pct = overview.total ? Math.round((s.total / overview.total) * 100) : 0;
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
                      <Text style={styles.subjectDetailed}>
                        {formatDetailed(s.total)} · ⏱️ {formatDetailed(s.stopwatch)} · 🍅 {formatDetailed(s.pomo)}
                      </Text>
                    </View>
                  );
                })
              )}
            </>
          )}

          {activeTab === "daily" && (
            <>
              {allByDate.length === 0 ? (
                <Text style={styles.empty}>No sessions recorded yet. 📊🌸</Text>
              ) : (
                allByDate.map((day) => {
                  const isOpen = expandedDate === day.date;
                  const bySubj = subjects
                    .map((subj) => ({
                      ...subj,
                      total: day.sessions.filter((s) => s.subjectId === subj.id).reduce((sum, s) => sum + s.seconds, 0),
                    }))
                    .filter((s) => s.total > 0)
                    .sort((a, b) => b.total - a.total);

                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={styles.dayCard}
                      onPress={() => setExpandedDate(isOpen ? null : day.date)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.dayCardHeader}>
                        <Text style={styles.dayCardDate}>{formatDayLabel(day.date)}</Text>
                        <Text style={styles.dayCardTotal}>{formatDetailed(day.total)}</Text>
                      </View>
                      {bySubj.map((s) => (
                        <View key={s.id} style={styles.dayCardSubjectRow}>
                          <View style={[styles.dot, { backgroundColor: s.color }]} />
                          <Text style={styles.dayCardSubjectName}>{s.name}</Text>
                          <Text style={styles.dayCardSubjectTotal}>{formatDetailed(s.total)}</Text>
                        </View>
                      ))}

                      {isOpen && (
                        <View style={styles.sessionListInline}>
                          {day.sessions.map((s) => {
                            const subj = subjectById.get(s.subjectId);
                            const range = formatTimeRange(s);
                            return (
                              <View key={s.id} style={styles.sessionRow}>
                                <View style={[styles.dot, { backgroundColor: subj?.color || theme.primary }]} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.sessionSubject}>{subj?.name || "Unknown"}</Text>
                                  {range && <Text style={styles.sessionTime}>{range}</Text>}
                                </View>
                                <Text style={styles.sessionModeIcon}>{s.mode === "pomodoro" ? "🍅" : "⏱️"}</Text>
                                <Text style={styles.sessionDuration}>{formatDetailed(s.seconds)}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {activeTab === "subject" && (
            <>
              {subjects.length === 0 ? (
                <Text style={styles.empty}>Add a subject first to see per-subject stats. 📊🌸</Text>
              ) : (
                <>
                  <View style={styles.rangeRow}>
                    {subjects.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.rangeChip,
                          selectedSubjectId === s.id && { backgroundColor: s.color, borderColor: s.color },
                        ]}
                        onPress={() => {
                          setSelectedSubjectId(s.id);
                          setSubjectExpandedDate(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.rangeChipText,
                            selectedSubjectId === s.id && styles.rangeChipTextActive,
                          ]}
                        >
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {currentSubject && (
                    <>
                      <View style={styles.rangeRow}>
                        {RANGES.map((r) => (
                          <TouchableOpacity
                            key={r.key}
                            style={[styles.rangeChip, subjectRange === r.key && styles.rangeChipActive]}
                            onPress={() => setSubjectRange(r.key)}
                          >
                            <Text style={[styles.rangeChipText, subjectRange === r.key && styles.rangeChipTextActive]}>
                              {r.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={[styles.totalCard, { borderColor: currentSubject.color }]}>
                        <Text style={styles.totalValue}>{formatDetailed(subjectOverview.total)}</Text>
                        <Text style={styles.totalLabel}>
                          {currentSubject.name} · {RANGES.find((r) => r.key === subjectRange)?.label}
                        </Text>
                      </View>

                      <DynamicBarChart sessions={subjectSessions} range={subjectRange} theme={theme} styles={styles} dayStartHour={dayStartHour} />

                      <View style={styles.splitRow}>
                        <View style={styles.splitCard}>
                          <Text style={styles.splitEmoji}>⏱️</Text>
                          <Text style={styles.splitValue}>{formatDetailed(subjectOverview.stopwatchSeconds)}</Text>
                          <Text style={styles.splitLabel}>Stopwatch</Text>
                        </View>
                        <View style={styles.splitCard}>
                          <Text style={styles.splitEmoji}>🍅</Text>
                          <Text style={styles.splitValue}>{formatDetailed(subjectOverview.pomoSeconds)}</Text>
                          <Text style={styles.splitLabel}>Pomodoro</Text>
                        </View>
                      </View>

                      <Text style={styles.sectionTitle}>Daily history</Text>
                      {subjectByDate.length === 0 ? (
                        <Text style={styles.empty}>No sessions logged for {currentSubject.name} yet.</Text>
                      ) : (
                        subjectByDate.map((day) => {
                          const isOpen = subjectExpandedDate === day.date;
                          return (
                            <TouchableOpacity
                              key={day.date}
                              style={styles.dayCard}
                              onPress={() => setSubjectExpandedDate(isOpen ? null : day.date)}
                              activeOpacity={0.85}
                            >
                              <View style={styles.dayCardHeader}>
                                <Text style={styles.dayCardDate}>{formatDayLabel(day.date)}</Text>
                                <Text style={styles.dayCardTotal}>{formatDetailed(day.total)}</Text>
                              </View>

                              {isOpen && (
                                <View style={styles.sessionListInline}>
                                  {day.sessions.map((s) => {
                                    const range = formatTimeRange(s);
                                    return (
                                      <View key={s.id} style={styles.sessionRow}>
                                        <View style={{ flex: 1 }}>
                                          {range && <Text style={styles.sessionTime}>{range}</Text>}
                                        </View>
                                        <Text style={styles.sessionModeIcon}>
                                          {s.mode === "pomodoro" ? "🍅" : "⏱️"}
                                        </Text>
                                        <Text style={styles.sessionDuration}>{formatDetailed(s.seconds)}</Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      )}

                      <Text style={styles.sectionTitle}>All sessions</Text>
                      {subjectByDate.length === 0 ? (
                        <Text style={styles.empty}>Nothing recorded yet.</Text>
                      ) : (
                        subjectByDate.map((day) => (
                          <View key={`log-${day.date}`} style={styles.sessionDayGroup}>
                            <Text style={styles.sessionDayGroupTitle}>{formatDayLabel(day.date)}</Text>
                            {day.sessions.map((s) => {
                              const range = formatTimeRange(s);
                              return (
                                <View key={s.id} style={styles.sessionRow}>
                                  <View style={[styles.dot, { backgroundColor: currentSubject.color }]} />
                                  <View style={{ flex: 1 }}>
                                    {range ? (
                                      <Text style={styles.sessionSubject}>{range}</Text>
                                    ) : (
                                      <Text style={styles.sessionSubject}>Duration only</Text>
                                    )}
                                  </View>
                                  <Text style={styles.sessionModeIcon}>{s.mode === "pomodoro" ? "🍅" : "⏱️"}</Text>
                                  <Text style={styles.sessionDuration}>{formatDetailed(s.seconds)}</Text>
                                </View>
                              );
                            })}
                          </View>
                        ))
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
    title: { fontSize: 28, fontWeight: "800", color: theme.text, marginTop: 8 },
    subtitle: { color: theme.muted, marginTop: 4, marginBottom: 14 },

    tabRow: {
      flexDirection: "row",
      backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)",
      borderRadius: 14,
      padding: 4,
      marginBottom: 14,
    },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    tabButtonActive: { backgroundColor: theme.primary },
    tabButtonText: { fontSize: 12, fontWeight: "700", color: theme.muted },
    tabButtonTextActive: { color: "#fff" },

    rangeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    rangeChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)",
    },
    rangeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    rangeChipText: { fontSize: 13, fontWeight: "700", color: theme.text },
    rangeChipTextActive: { color: "#fff" },

    totalCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 14,
      ...cardShadow,
    },
    totalValue: { fontSize: 30, fontWeight: "800", color: theme.text },
    totalLabel: { color: theme.muted, fontWeight: "600", marginTop: 4 },

    chartCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 20,
      padding: 20,
      height: 200,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      marginBottom: 14,
      ...cardShadow,
    },
    chartCardTitle: { color: theme.muted, fontWeight: "700", fontSize: 13, marginBottom: 8 },
    barsRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    barColumn: { alignItems: "center", flex: 1 },
    barTrack: {
      height: 120,
      backgroundColor: "rgba(242,87,141,0.12)",
      borderRadius: 9,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    barFill: { width: "100%", backgroundColor: theme.primary, borderRadius: 9 },
    barLabel: { marginTop: 8, color: theme.muted, fontSize: 11, fontWeight: "600" },

    sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 10, marginBottom: 12 },
    splitRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
    splitCard: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...cardShadow,
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

    dayCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      ...cardShadow,
    },
    dayCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    dayCardDate: { fontWeight: "800", color: theme.text, fontSize: 15 },
    dayCardTotal: { fontWeight: "800", color: theme.primary, fontSize: 15 },
    dayCardSubjectRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    dayCardSubjectName: { flex: 1, color: theme.text, fontSize: 13, fontWeight: "600" },
    dayCardSubjectTotal: { color: theme.muted, fontSize: 12, fontWeight: "600" },

    sessionListInline: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
    },
    sessionDayGroup: { marginBottom: 20 },
    sessionDayGroupTitle: { fontWeight: "800", color: theme.text, fontSize: 15, marginBottom: 8 },
    sessionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    sessionSubject: { color: theme.text, fontWeight: "700", fontSize: 13 },
    sessionTime: { color: theme.muted, fontSize: 12, marginTop: 1 },
    sessionModeIcon: { fontSize: 14, marginHorizontal: 8 },
    sessionDuration: { color: theme.text, fontWeight: "700", fontSize: 12, minWidth: 60, textAlign: "right" },
  });
}