import { Platform, Vibration } from "react-native";
import { Audio } from "expo-av";

// Plays a short chime and vibrates the phone when a Pomodoro phase (focus or
// break) ends. Sound uses expo-av (works on iOS/Android/web). Vibration is
// silently skipped on web since browsers don't support it the same way.

let cachedSound = null;

async function getSound() {
  if (cachedSound) return cachedSound;
  const { sound } = await Audio.Sound.createAsync(require("../../assets/alarm.wav"));
  cachedSound = sound;
  return sound;
}

export async function playPomodoroAlarm() {
  try {
    const sound = await getSound();
    await sound.replayAsync();
  } catch (e) {
    console.warn("Could not play pomodoro alarm sound", e);
  }

  if (Platform.OS !== "web") {
    try {
      Vibration.vibrate([0, 300, 150, 300]);
    } catch (e) {
      // no-op if vibration isn't supported on this device
    }
  }
}
