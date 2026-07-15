import { Platform, Vibration } from "react-native";
import { Audio } from "expo-av";

let cachedSound = null;
let audioModeConfigured = false;

async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      interruptionModeIOS: 1, // DoNotMix — takes priority like a real alarm
      interruptionModeAndroid: 1,
    });
    audioModeConfigured = true;
  } catch (e) {
    console.warn("Could not configure audio mode", e);
  }
}

async function getSound() {
  await ensureAudioMode();
  if (cachedSound) return cachedSound;
  const { sound } = await Audio.Sound.createAsync(
    require("../../assets/alarm.wav"),
    { isLooping: true }
  );
  cachedSound = sound;
  return sound;
}

export async function startPomodoroAlarm() {
  try {
    const sound = await getSound();
    await sound.setIsLoopingAsync(true);
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(1.0);
    await sound.playAsync();
  } catch (e) {
    console.warn("Could not play pomodoro alarm sound", e);
  }

  if (Platform.OS !== "web") {
    try {
      Vibration.vibrate([400, 500, 400, 500], true);
    } catch (e) {
    }
  }
}

export async function stopPomodoroAlarm() {
  try {
    if (cachedSound) {
      await cachedSound.stopAsync();
    }
  } catch (e) {
  }

  if (Platform.OS !== "web") {
    try {
      Vibration.cancel();
    } catch (e) {
    }
  }
}
