import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { getTheme } from "../theme";
import { useStudy } from "../context/StudyContext";

export default function SubjectPicker({ subjects, selectedId, onSelect }) {
  const { darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {subjects.map((s) => {
        const active = s.id === selectedId;
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => onSelect(s.id)}
            style={[
              styles.chip,
              { borderColor: s.color },
              active && { backgroundColor: s.color },
            ]}
          >
            <Text style={[styles.chipText, active && { color: "#fff" }]}>{s.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
    row: { flexGrow: 0, marginVertical: 12 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      marginRight: 8,
      backgroundColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)",
    },
    chipText: { fontWeight: "600", color: theme.text },
  });
}
