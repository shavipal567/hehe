import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, AppState } from "react-native";
import { useStudy } from "../context/StudyContext";
import SubjectPicker from "../components/SubjectPicker";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// This timer is "background safe": instead of counting ticks (which pause or
// drift when the app is backgrounded / the phone sleeps), it stores the real
// clock timestamp the timer started at, and always recomputes elapsed time
// from Date.now() - startedAt. So switching apps, locking the phone, or the
// OS throttling background JS never loses time — the moment you come back,
// the correct elapsed time is recalculated instantly from the real clock.

export default function HomeScreen() {
  const { subjects, addSession, sessions, pomodoroSettings } = useStudy();
  const [selectedId, setSelectedId] = useState(subjects[0]?.id);
  const [mode, setMode] = useState("stopwatch"); // "stopwatch" | "pomodoro"
  const [running, setRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [pomoPhase, setPomoPhase] = useState("work"); // "work" | "break"
  const [pomoCyclesDone, setPomoCyclesDone] = useState(0);

  const startedAtRef = useRef(null); // real timestamp (ms) when current run started
  const accumulatedRef = useRef(0); // seconds already banked before the current run (stopwatch only)
  const pomoTargetRef = useRef(null); // timestamp (ms) the current pomodoro phase should end at
  const tickRef = useRef(null);

  useEffect(() => {
    if (!selectedId && subjects.length) setSelectedId(subjects[0].id);
  }, [subjects]);

  const recompute = useCallback(() => {
    if (!running) return;
    if (mode === "stopwatch") {
      const elapsed = accumulatedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000);
      setDisplaySeconds(elapsed);
    } else {
      const remaining = Math.max(0, Math.round((pomoTargetRef.current - Date.now()) / 1000));
      setDisplaySeconds(remaining);
      if (remaining === 0) {
        handlePomoPhaseEnd();
      }
    }
  }, [running, mode]);

  // Recompute immediately whenever the app returns to the foreground —
  // this is what makes the timer "keep going" while she's on another app.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") recompute();
    });
    return () => sub.remove();
  }, [recompute]);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(recompute, 1000);
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [running, recompute]);

  const handlePomoPhaseEnd = () => {
    if (pomoPhase === "work") {
      if (selectedId) addSession(selectedId, pomodoroSettings.workMinutes * 60, "pomodoro");
      setPomoCyclesDone((c) => c + 1);
      setPomoPhase("break");
      pomoTargetRef.current = Date.now() + pomodoroSettings.breakMinutes * 60 * 1000;
      setDisplaySeconds(pomodoroSettings.breakMinutes * 60);
    } else {
      setPomoPhase("work");
      pomoTargetRef.current = Date.now() + pomodoroSettings.workMinutes * 60 * 1000;
      setDisplaySeconds(pomodoroSettings.workMinutes * 60);
    }
  };

  const todaySeconds = sessions
    .filter((s) => s.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, s) => sum + s.seconds, 0);

  const handleStartStopStopwatch = () => {
    if (running) {
      setRunning(false);
      const finalSeconds = accumulatedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000);
      if (finalSeconds > 0 && selectedId) addSession(selectedId, finalSeconds, "stopwatch");
      accumulatedRef.current = 0;
      setDisplaySeconds(0);
    } else {
      startedAtRef.current = Date.now();
      setRunning(true);
    }
  };

  const handleStartStopPomodoro = () => {
    if (running) {
      setRunning(false);
    } else {
      pomoTargetRef.current = Date.now() + (pomoPhase === "work" ? pomodoroSettings.workMinutes : pomodoroSettings.breakMinutes) * 60 * 1000;
      setDisplaySeconds((pomoPhase === "work" ? pomodoroSettings.workMinutes : pomodoroSettings.breakMinutes) * 60);
      setRunning(true);
    }
  };

  const switchMode = (m) => {
    if (running) return; // avoid switching mid-run and losing state
    setMode(m);
    if (m === "pomodoro") {
      setPomoPhase("work");
      setDisplaySeconds(pomodoroSettings.workMinutes * 60);
    } else {
      setDisplaySeconds(0);
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedId);
  const isPomo = mode === "pomodoro";

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>GRIND</Text>
        <Text style={styles.subtitle}>Studying is a marathon, not a sprint. 🩺💗</Text>

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, !isPomo && styles.modeButtonActive]}
            onPress={() => switchMode("stopwatch")}
          >
            <Text style={[styles.modeButtonText, !isPomo && styles.modeButtonTextActive]}>Stopwatch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isPomo && styles.modeButtonActive]}
            onPress={() => switchMode("pomodoro")}
          >
            <Text style={[styles.modeButtonText, isPomo && styles.modeButtonTextActive]}>🍅 Pomodoro</Text>
          </TouchableOpacity>
        </View>

        {subjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No subjects yet — head to the "Subjects" tab and add your first one to start the timer. 🌸
            </Text>
          </View>
        ) : (
          <SubjectPicker subjects={subjects} selectedId={selectedId} onSelect={setSelectedId} />
        )}

        <View style={styles.timerCard}>
          {isPomo && (
            <Text style={styles.pomoPhaseLabel}>
              {pomoPhase === "work" ? "🎯 Focus time" : "🌸 Break time"}
            </Text>
          )}
          <Text style={[styles.timerText, { color: currentSubject?.color || theme.primary }]}>
            {isPomo ? formatCountdown(displaySeconds) : formatTime(displaySeconds)}
          </Text>
          <Text style={styles.timerLabel}>{currentSubject?.name || "Pick a subject"}</Text>
          {isPomo && pomoCyclesDone > 0 && (
            <Text style={styles.cycleLabel}>🍅 x{pomoCyclesDone} completed today</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, running ? styles.stopButton : styles.startButton]}
          onPress={isPomo ? handleStartStopPomodoro : handleStartStopStopwatch}
          disabled={!selectedId}
        >
          <Text style={styles.buttonText}>
            {running ? (isPomo ? "Pause" : "Stop & Save") : "Start Studying"}
          </Text>
        </TouchableOpacity>

        <View style={styles.todayBox}>
          <Text style={styles.todayLabel}>Today's total</Text>
          <Text style={styles.todayValue}>{formatTime(todaySeconds)}</Text>
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 30, fontWeight: "800", color: theme.text, marginTop: 8, letterSpacing: 1 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 8 },
  modeSwitch: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 16, padding: 4, marginTop: 8,
  },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  modeButtonActive: { backgroundColor: theme.primary },
  modeButtonText: { fontWeight: "700", color: theme.muted },
  modeButtonTextActive: { color: "#fff" },
  emptyCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 18,
    marginVertical: 12,
  },
  emptyText: { color: theme.muted, lineHeight: 20, textAlign: "center" },
  timerCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 24,
    paddingVertical: 40,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...cardShadow,
  },
  pomoPhaseLabel: { fontWeight: "700", color: theme.muted, marginBottom: 6 },
  timerText: { fontSize: 46, fontWeight: "800", fontVariant: ["tabular-nums"] },
  timerLabel: { marginTop: 8, color: theme.muted, fontWeight: "600" },
  cycleLabel: { marginTop: 10, color: theme.primary, fontWeight: "700" },
  button: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  startButton: { backgroundColor: theme.primary },
  stopButton: { backgroundColor: theme.danger },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  todayBox: { marginTop: 24, alignItems: "center" },
  todayLabel: { color: theme.muted },
  todayValue: { fontSize: 20, fontWeight: "700", color: theme.text, marginTop: 4 },
});
