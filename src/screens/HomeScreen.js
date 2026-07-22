import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, AppState, Dimensions,Modal, TextInput  } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStudy } from "../context/StudyContext";
import SubjectPicker from "../components/SubjectPicker";
import SkyBackground from "../components/SkyBackground";
import PomodoroRing from "../components/PomodoroRing";
import { startPomodoroAlarm, stopPomodoroAlarm } from "../utils/alarm";
import { getTheme, cardShadow } from "../theme";
import SessionActionSheet from "../components/SessionActionSheet";
const { width: SCREEN_W } = Dimensions.get("window");
const RING_SIZE = Math.min(SCREEN_W * 0.78, 300);
const SNOOZE_SECONDS = 5 * 60;

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

export default function HomeScreen() {
  const { subjects, addSession, sessions, pomodoroSettings, darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);
  const [selectedId, setSelectedId] = useState(subjects[0]?.id);
  const [mode, setMode] = useState("stopwatch"); // "stopwatch" | "pomodoro"
  const [running, setRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [pomoPhase, setPomoPhase] = useState("work"); // "work" | "break"
  const [pomoCyclesDone, setPomoCyclesDone] = useState(0);
  const [alarmActive, setAlarmActive] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState("");
  const [showSessionSheet, setShowSessionSheet] = useState(true);
  const [stopwatchPaused, setStopwatchPaused] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pomoPaused, setPomoPaused] = useState(false);
  const [editTarget, setEditTarget] = useState("stopwatch");
  const [editMinutes, setEditMinutes] = useState("0");
  const [editSeconds, setEditSeconds] = useState("0");

  const startedAtRef = useRef(null);
  const accumulatedRef = useRef(0);
  const pomoTargetRef = useRef(null);
  const tickRef = useRef(null);
  const justCompletedPhaseRef = useRef("work");

  useEffect(() => {
    if (!selectedId && subjects.length) setSelectedId(subjects[0].id);
  }, [subjects]);

  const handlePomoPhaseEnd = useCallback(() => {
    setRunning(false);
    if (pomoPhase === "work") {
      if (selectedId) addSession(selectedId, pomodoroSettings.workMinutes * 60, "pomodoro");
      setPomoCyclesDone((c) => c + 1);
      justCompletedPhaseRef.current = "work";
      setPomoPhase("break");
      setDisplaySeconds(pomodoroSettings.breakMinutes * 60);
      setAlarmMessage("Focus session complete! Time for a 🌸 break.");
    } else {
      justCompletedPhaseRef.current = "break";
      setPomoPhase("work");
      setDisplaySeconds(pomodoroSettings.workMinutes * 60);
      setAlarmMessage("Break's over! Ready to focus again? 🎯");
    }
    setAlarmActive(true);
    startPomodoroAlarm();
  }, [pomoPhase, selectedId, pomodoroSettings]);

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
  }, [running, mode, handlePomoPhaseEnd]);

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

  const todaySeconds = sessions
    .filter((s) => s.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, s) => sum + s.seconds, 0);

  const handleStartStopStopwatch = () => {
  if (running) {
    // Pause only
    const finalSeconds =
      accumulatedRef.current +
      Math.floor((Date.now() - startedAtRef.current) / 1000);

    accumulatedRef.current = finalSeconds;
    setDisplaySeconds(finalSeconds);

    setRunning(false);
    setStopwatchPaused(true);
    return;
  }

  // Start or Resume
  startedAtRef.current = Date.now();
  setRunning(true);
  setStopwatchPaused(false);
};
  const handleFinishAndNew = () => {
  if (accumulatedRef.current > 0 && selectedId) {
    addSession(selectedId, accumulatedRef.current, "stopwatch");
  }

  accumulatedRef.current = 0;
  setDisplaySeconds(0);
  setStopwatchPaused(false);
  setRunning(false);
};

  const handleResume = () => {
  startedAtRef.current = Date.now();
  setRunning(true);
  setStopwatchPaused(false);
};
  const handleOpenEditDuration = () => {
    setEditTarget(target);
    const mins = Math.floor(displaySeconds / 60);
    const secs = displaySeconds % 60;
    setEditMinutes(String(mins));
    setEditSeconds(String(secs));
    setShowEditModal(true);
  };

  const handleSaveEditDuration = () => {
    const mins = parseInt(editMinutes, 10) || 0;
    const secs = parseInt(editSeconds, 10) || 0;
    const totalSeconds = Math.max(0, mins * 60 + secs);
    if (editTarget === "stopwatch") {
    accumulatedRef.current = totalSeconds;
    }
    setDisplaySeconds(totalSeconds);
    setShowEditModal(false);
  };


  const handleStartStopPomodoro = () => {
    if (running) {
      setRunning(false);
      setPomoPaused(true);
    } else {
      const resumeSeconds = displaySeconds > 0 ? displaySeconds : totalPhaseSecondsFor(pomoPhase);
      pomoTargetRef.current = Date.now() + resumeSeconds * 1000;
      setDisplaySeconds(resumeSeconds);
      setRunning(true);
      setPomoPaused(false);
    }
  };

  const handleRestartPomodoro = () => {
    const total = totalPhaseSecondsFor(pomoPhase);
    setDisplaySeconds(total);
    setPomoPaused(false);
    if (running) {
      pomoTargetRef.current = Date.now() + total * 1000;
    }
  };
  const handleFinishPomodoroNow = () => {
    const elapsed = totalPhaseSeconds - displaySeconds;
    setRunning(false);
    setPomoPaused(false);
    if (pomoPhase === "work") {
      if (selectedId && elapsed > 0) addSession(selectedId, elapsed, "pomodoro");
      setPomoCyclesDone((c) => c + 1);
      setPomoPhase("break");
      setDisplaySeconds(pomodoroSettings.breakMinutes * 60);
    } else {
      setPomoPhase("work");
      setDisplaySeconds(pomodoroSettings.workMinutes * 60);
    }
  };
  const handleCutBreak = () => {
    setRunning(false);
    setPomoPaused(false);
    setPomoPhase("work");
    setDisplaySeconds(pomodoroSettings.workMinutes * 60);
  };

  function totalPhaseSecondsFor(phase) {
    return (phase === "work" ? pomodoroSettings.workMinutes : pomodoroSettings.breakMinutes) * 60;
  }

  const switchMode = (m) => {
    if (running || alarmActive) return;
    setMode(m);
    setPomoPaused(false);
    if (m === "pomodoro") {
      setPomoPhase("work");
      setDisplaySeconds(pomodoroSettings.workMinutes * 60);
    } else {
      setDisplaySeconds(0);
    }
  };

  const handleSnooze = () => {
    stopPomodoroAlarm();
    setAlarmActive(false);
    const revertPhase = justCompletedPhaseRef.current;
    setPomoPhase(revertPhase);
    setDisplaySeconds(SNOOZE_SECONDS);
    pomoTargetRef.current = Date.now() + SNOOZE_SECONDS * 1000;
    setRunning(true);
  };

  const handleStopAlarm = () => {
    stopPomodoroAlarm();
    setAlarmActive(false);
  };

  const currentSubject = subjects.find((s) => s.id === selectedId);
  const isPomo = mode === "pomodoro";
  const totalPhaseSeconds = totalPhaseSecondsFor(pomoPhase);
  
  const resumeColors = [theme.primary, "#B94E8C"];
  const finishColors = darkMode ? ["#8BC98F", "#6FB876"] : ["#A8E6A3", "#8BD17E"];
  const editColors = darkMode ? ["#F0D879", "#E0C458"] : ["#FFF2A8", "#FFE066"];
  const startStopColors = running
    ? ["#F65C6C", "#F2578D"]
    : [theme.primary, "#B94E8C"];


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
            <PomodoroRing
              remaining={displaySeconds}
              total={totalPhaseSeconds}
              phase={pomoPhase}
              size={RING_SIZE}
            >
              <Text style={styles.pomoPhaseLabelRing}>
                {pomoPhase === "work" ? "🎯 FOCUS" : "🌸 BREAK"}
              </Text>

              <Text
                style={[
                  styles.timerTextRing,
                  { color: pomoPhase === "work" ? theme.primary : theme.secondary },
                ]}
      >
                {formatCountdown(displaySeconds)}
              </Text>

              <Text style={styles.timerLabelRing}>
                {currentSubject?.name || "Pick a subject"}
              </Text>
            </PomodoroRing>

            {pomoCyclesDone > 0 && (
              <Text style={styles.cycleLabel}>
                🍅 x{pomoCyclesDone} completed today
              </Text>
            )}

          <View style={styles.pomoButtonRow}>
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestartPomodoro}
              disabled={!selectedId}
              >
                <Text style={styles.restartButtonText}>↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonWrapFlex}
              onPress={handleStartStopPomodoro}
              disabled={!selectedId}
              activeOpacity={0.85}
              >
                <LinearGradient
                  colors={startStopColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>
                    {running
                      ? "Pause"
                      : displaySeconds < totalPhaseSeconds
                      ? "Resume"
                      : "Start"}
                  </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>

    {pomoPhase === "break" && !running && (
      <TouchableOpacity
        style={styles.cutBreakButton}
        onPress={handleCutBreak}
        activeOpacity={0.85}
      >
        <Text style={styles.cutBreakButtonText}>⏭ Cut Break</Text>
      </TouchableOpacity>
    )}

    {pomoPaused && (
      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={styles.secondaryButtonWrap}
          onPress={() => handleOpenEditDuration("pomodoro")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={editColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit>
              ✏ Edit
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButtonWrap}
          onPress={handleFinishPomodoroNow}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={finishColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit>
              💾 Finish & New
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )}
  </View>
) : (
  <View style={styles.stopwatchArea}>
    <View style={styles.timerCard}>
      <Text
        style={[
          styles.timerText,
          { color: currentSubject?.color || theme.primary },
        ]}
      >
        {formatTime(displaySeconds)}
      </Text>

      <Text style={styles.timerLabel}>
        {currentSubject?.name || "Pick a subject"}
      </Text>
    </View>

    {!stopwatchPaused ? (
      <TouchableOpacity
        style={styles.buttonWrapSmall}
        onPress={handleStartStopStopwatch}
        disabled={!selectedId}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={startStopColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonSmall}
        >
          <Text style={styles.buttonTextSmall}>
            {running ? "Pause" : "Start Studying"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    ) : (
      <View>
        <TouchableOpacity
          style={styles.buttonWrapSmall}
          onPress={handleResume}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={resumeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonSmall}
          >
            <Text style={styles.buttonTextSmall}>▶ Resume</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryButtonWrap}
            onPress={() => handleOpenEditDuration("stopwatch")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={editColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>✏ Edit Duration</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonWrap}
            onPress={handleFinishAndNew}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={finishColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>💾 Finish & New</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )}

    <View style={styles.todayBox}>
      <Text style={styles.todayLabel}>Today's total</Text>
      <Text style={styles.todayValue}>
        {formatTime(todaySeconds)}
      </Text>
    </View>
  </View>
)}

        {alarmActive && (
          <View style={styles.alarmOverlay}>
            <View style={styles.alarmCard}>
              <Text style={styles.alarmEmoji}>⏰</Text>
              <Text style={styles.alarmMessage}>{alarmMessage}</Text>
              <View style={styles.alarmButtonRow}>
                <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
                  <Text style={styles.snoozeButtonText}>Snooze 5m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopAlarmButtonWrap} onPress={handleStopAlarm} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[theme.primary, "#B94E8C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stopAlarmButton}
                  >
                    <Text style={styles.stopAlarmButtonText}>Stop</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalCard}>
              <Text style={styles.editModalTitle}>Edit Duration</Text>

              <View style={styles.editModalRow}>
                <View style={styles.editModalField}>
                  <TextInput
                    style={styles.editModalInput}
                    keyboardType="number-pad"
                    value={editMinutes}
                    onChangeText={setEditMinutes}
                    maxLength={4}
                  />
                  <Text style={styles.editModalFieldLabel}>min</Text>
                </View>

                <Text style={styles.editModalColon}>:</Text>

                <View style={styles.editModalField}>
                  <TextInput
                    style={styles.editModalInput}
                    keyboardType="number-pad"
                    value={editSeconds}
                    onChangeText={setEditSeconds}
                    maxLength={2}
                  />
                  <Text style={styles.editModalFieldLabel}>sec</Text>
                </View>
              </View>

              <View style={styles.editModalButtonRow}>
                <TouchableOpacity
                  style={styles.editModalCancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.editModalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editModalSaveButtonWrap}
                  onPress={handleSaveEditDuration}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[theme.primary, "#B94E8C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.editModalSaveButton}
                  >
                    <Text style={styles.editModalSaveText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SkyBackground>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  topBar: { marginBottom: 4 },
  title: { fontSize: 34, fontWeight: "800", color: theme.text, letterSpacing: 1 },
  modeSwitch: {
    flexDirection: "row", backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)", borderRadius: 16, padding: 4, marginTop: 10,
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

  pomoFullPage: { flex: 1, alignItems: "center", justifyContent: "space-evenly", paddingTop: 8 },
  pomoPhaseLabelRing: { fontWeight: "800", color: theme.muted, marginBottom: 4, fontSize: 15, letterSpacing: 1 },
  timerTextRing: { fontSize: 52, fontWeight: "800", fontVariant: ["tabular-nums"] },
  timerLabelRing: { marginTop: 6, color: theme.muted, fontWeight: "700", fontSize: 16 },
  cycleLabel: { color: theme.primary, fontWeight: "800", fontSize: 17 },

  pomoButtonRow: { flexDirection: "row", width: "100%", alignItems: "center" },
  restartButton: {
    width: 64, borderRadius: 18, marginRight: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)", borderWidth: 1, borderColor: theme.cardBorder,
  },
  restartButtonText: { color: theme.text, fontWeight: "700", fontSize: 20 },
  cutBreakButton: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  cutBreakButtonText: { color: theme.text, fontWeight: "700", fontSize: 13 },

  button: {
    borderRadius: 18,
    paddingVertical: 14,
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
  buttonWrapFlex: {
    flex: 1,
    borderRadius: 18,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonWrapSmall: {
    width: "100%",
    borderRadius: 14,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: darkMode ? 0.15 : 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSmall: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonTextSmall: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryButtonWrap: {
    flex: 1,
    borderRadius: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: darkMode ? 0.12 : 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryButtonText: { color: darkMode ? "#3A2E2E" : "#4A3B1E", fontWeight: "700", fontSize: 13, textAlign: "center" },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 19 },
  todayBox: { alignItems: "center", marginTop: 14 },
  todayLabel: { color: theme.muted, fontSize: 15, fontWeight: "600" },
  todayValue: { fontSize: 26, fontWeight: "800", color: theme.text, marginTop: 4 },

  alarmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(58,46,69,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    elevation: 50,
    padding: 24,
  },
  alarmCard: {
    backgroundColor: darkMode ? "#241B36" : "#fff",
    borderRadius: 28,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    ...cardShadow,
  },
  alarmEmoji: { fontSize: 44, marginBottom: 12 },
  alarmMessage: { fontSize: 18, fontWeight: "700", color: theme.text, textAlign: "center", lineHeight: 25 },
  alarmButtonRow: { flexDirection: "row", marginTop: 24, width: "100%" },
  snoozeButton: {
    flex: 1, paddingVertical: 16, borderRadius: 16, marginRight: 10,
    backgroundColor: "rgba(242,87,141,0.12)", alignItems: "center",
  },
  snoozeButtonText: { color: theme.primary, fontWeight: "700", fontSize: 15 },
  stopAlarmButtonWrap: { flex: 1, borderRadius: 16 },
  stopAlarmButton: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  stopAlarmButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(58,46,69,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  editModalCard: {
    backgroundColor: darkMode ? "#241B36" : "#fff",
    borderRadius: 24,
    padding: 26,
    width: "100%",
    maxWidth: 340,
    ...cardShadow,
  },
  editModalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: theme.text,
    textAlign: "center",
    marginBottom: 20,
  },
  editModalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  editModalField: { alignItems: "center" },
  editModalInput: {
    width: 70,
    height: 56,
    borderRadius: 14,
    backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderColor: theme.cardBorder,
    color: theme.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  editModalFieldLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  editModalColon: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "800",
    marginHorizontal: 12,
  },
  editModalButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  editModalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
  },
  editModalCancelText: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 15,
  },
  editModalSaveButtonWrap: { flex: 1, borderRadius: 14 },
  editModalSaveButton: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  editModalSaveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
}
