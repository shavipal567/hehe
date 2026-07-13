import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useStudy } from "../context/StudyContext";
import SubjectPicker from "../components/SubjectPicker";

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function HomeScreen() {
  const { subjects, addSession, sessions } = useStudy();
  const [selectedId, setSelectedId] = useState(subjects[0]?.id);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!selectedId && subjects.length) setSelectedId(subjects[0].id);
  }, [subjects]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const todaySeconds = sessions
    .filter((s) => s.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, s) => sum + s.seconds, 0);

  const handleStartStop = () => {
    if (running) {
      setRunning(false);
      if (seconds > 0 && selectedId) {
        addSession(selectedId, seconds);
      }
      setSeconds(0);
    } else {
      setRunning(true);
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedId);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>GRIND</Text>
      <Text style={styles.subtitle}>Studying is a marathon, not a sprint.</Text>

      {subjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No subjects yet — head to the "Subjects" tab below and add your first one to start the timer.
          </Text>
        </View>
      ) : (
        <SubjectPicker subjects={subjects} selectedId={selectedId} onSelect={setSelectedId} />
      )}

      <View style={styles.timerCard}>
        <Text style={[styles.timerText, { color: currentSubject?.color || "#333" }]}>
          {formatTime(seconds)}
        </Text>
        <Text style={styles.timerLabel}>{currentSubject?.name || "Pick a subject"}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, running ? styles.stopButton : styles.startButton]}
        onPress={handleStartStop}
        disabled={!selectedId}
      >
        <Text style={styles.buttonText}>{running ? "Stop & Save" : "Start Studying"}</Text>
      </TouchableOpacity>

      <View style={styles.todayBox}>
        <Text style={styles.todayLabel}>Today's total</Text>
        <Text style={styles.todayValue}>{formatTime(todaySeconds)}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F6", padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#2B2540", marginTop: 12 },
  subtitle: { color: "#B27F92", marginTop: 4, marginBottom: 8 },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginVertical: 12,
  },
  emptyText: {
    color: "#B27F92",
    lineHeight: 20,
    textAlign: "center",
  },
  timerCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 48,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  timerText: { fontSize: 48, fontWeight: "700", fontVariant: ["tabular-nums"] },
  timerLabel: { marginTop: 8, color: "#B27F92", fontWeight: "600" },
  button: {
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  startButton: { backgroundColor: "#F2578D" },
  stopButton: { backgroundColor: "#F65C6C" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  todayBox: { marginTop: 24, alignItems: "center" },
  todayLabel: { color: "#B27F92" },
  todayValue: { fontSize: 20, fontWeight: "700", color: "#2B2540", marginTop: 4 },
});
