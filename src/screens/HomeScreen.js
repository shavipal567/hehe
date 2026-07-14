import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, AppState, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStudy } from "../context/StudyContext";
import SubjectPicker from "../components/SubjectPicker";
import SkyBackground from "../components/SkyBackground";
import PomodoroRing from "../components/PomodoroRing";
import { playPomodoroAlarm } from "../utils/alarm";
import { theme, cardShadow } from "../theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const RING_SIZE = Math.min(SCREEN_W * 0.78, 300);

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

  const startedAtRef = useRef(null);
  const accumulatedRef = useRef(0);
  const pomoTargetRef = useRef(null);
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
    playPomodoroAlarm();
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
    if (running) return;
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
  const totalPhaseSeconds = (pomoPhase === "work" ? pomodoroSettings.workMinutes : pomodoroSettings.breakMinutes) * 60;

  return (
    <SkyBackground showFloaters={!isPomo}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.title}>GRIND</Text>
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

        {isPomo ? (
          <View style={styles.pomoFullPage}>
            <PomodoroRing remaining={displaySeconds} total={totalPhaseSeconds} phase={pomoPhase} size={RING_SIZE}>
              <Text style={styles.pomoPhaseLabelRing}>
                {pomoPhase === "work" ? "🎯 FOCUS" : "🌸 BREAK"}
              </Text>
              <Text style={[styles.timerTextRing, { color: pomoPhase === "work" ? theme.primary : theme.secondary }]}>
                {formatCountdown(displaySeconds)}
              </Text>
              <Text style={styles.timerLabelRing}>{currentSubject?.name || "Pick a subject"}</Text>
            </PomodoroRing>

            {pomoCyclesDone > 0 && (
              <Text style={styles.cycleLabel}>🍅 x{pomoCyclesDone} completed today</Text>
            )}

            <TouchableOpacity
              style={styles.buttonWrap}
              onPress={handleStartStopPomodoro}
              disabled={!selectedId}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={running ? ["#F65C6C", "#F2578D"] : [theme.primary, "#B94E8C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{running ? "Pause" : "Start Focus"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stopwatchArea}>
            <View style={styles.timerCard}>
              <Text style={[styles.timerText, { color: currentSubject?.color || theme.primary }]}>
                {formatTime(displaySeconds)}
              </Text>
              <Text style={styles.timerLabel}>{currentSubject?.name || "Pick a subject"}</Text>
            </View>

            <TouchableOpacity
              style={styles.buttonWrap}
              onPress={handleStartStopStopwatch}
              disabled={!selectedId}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={running ? ["#F65C6C", "#F2578D"] : [theme.primary, "#B94E8C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{running ? "Stop & Save" : "Start Studying"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.todayBox}>
              <Text style={styles.todayLabel}>Today's total</Text>
              <Text style={styles.todayValue}>{formatTime(todaySeconds)}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  topBar: { marginBottom: 4 },
  title: { fontSize: 34, fontWeight: "800", color: theme.text, letterSpacing: 1 },
  modeSwitch: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 16, padding: 4, marginTop: 10,
  },
  modeButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modeButtonActive: { backgroundColor: theme.primary },
  modeButtonText: { fontWeight: "700", color: theme.muted, fontSize: 15 },
  modeButtonTextActive: { color: "#fff" },
  emptyCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 16,
    padding: 20,
    marginVertical: 14,
  },
  emptyText: { color: theme.muted, lineHeight: 22, textAlign: "center", fontSize: 15 },

  // Stopwatch layout
  stopwatchArea: { flex: 1, justifyContent: "space-between", paddingTop: 8 },
  timerCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 28,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...cardShadow,
  },
  timerText: { fontSize: 64, fontWeight: "800", fontVariant: ["tabular-nums"] },
  timerLabel: { marginTop: 12, color: theme.muted, fontWeight: "700", fontSize: 18 },

  // Pomodoro full-page layout
  pomoFullPage: { flex: 1, alignItems: "center", justifyContent: "space-evenly", paddingTop: 8 },
  pomoPhaseLabelRing: { fontWeight: "800", color: theme.muted, marginBottom: 4, fontSize: 15, letterSpacing: 1 },
  timerTextRing: { fontSize: 52, fontWeight: "800", fontVariant: ["tabular-nums"] },
  timerLabelRing: { marginTop: 6, color: theme.muted, fontWeight: "700", fontSize: 16 },
  cycleLabel: { color: theme.primary, fontWeight: "800", fontSize: 17 },

  button: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
  },
  buttonWrap: {
    width: "100%",
    borderRadius: 18,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 19 },
  todayBox: { alignItems: "center", marginTop: 14 },
  todayLabel: { color: theme.muted, fontSize: 15, fontWeight: "600" },
  todayValue: { fontSize: 26, fontWeight: "800", color: theme.text, marginTop: 4 },
});
