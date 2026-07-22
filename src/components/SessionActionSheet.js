import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function SessionActionSheet({
  visible,
  duration,
  subjectName,
  onResume,
  onFinishAndNew,
  onEdit,
  onCancel,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          <Text style={styles.title}>Previous Session</Text>

          <Text style={styles.subject}>
            {subjectName}
          </Text>

          <Text style={styles.duration}>
            {duration}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onResume}
          >
            <Text style={styles.buttonText}>▶ Resume</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={onFinishAndNew}
          >
            <Text style={styles.buttonText}>
              💾 Finish & Start New
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={onEdit}
          >
            <Text style={styles.buttonText}>
              ✏ Edit Duration
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancel}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  subject: {
    marginTop: 8,
    fontSize: 18,
    textAlign: "center",
  },

  duration: {
    marginVertical: 20,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },

  button: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    marginTop: 12,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  cancel: {
    marginTop: 16,
    padding: 16,
  },

  cancelText: {
    color: "red",
    textAlign: "center",
    fontWeight: "600",
  },
});