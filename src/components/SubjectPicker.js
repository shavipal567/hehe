import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function SubjectPicker({ subjects, selectedId, onSelect }) {
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

const styles = StyleSheet.create({
  row: { flexGrow: 0, marginVertical: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  chipText: { fontWeight: "600", color: "#333" },
});
