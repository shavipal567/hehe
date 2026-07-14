import { Platform, Vibration } from "react-native";
import { Audio } from "expo-av";

// The pomodoro alarm now LOOPS continuously (sound + repeating vibration)
// until the person explicitly dismisses it via Snooze or Stop — like a real
// alarm clock, not a one-off chime. startPomodoroAlarm() begins the loop,
// stopPomodoroAlarm() cancels both the sound and the vibration pattern.

let cachedSound = null;

async function getSound() {
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
    await sound.playAsync();
  } catch (e) {
    console.warn("Could not play pomodoro alarm sound", e);
  }

  if (Platform.OS !== "web") {
    try {
      // Repeating vibration pattern: pause, buzz, pause, buzz... (true = repeat)
      Vibration.vibrate([400, 500, 400, 500], true);
    } catch (e) {
      // no-op if vibration isn't supported on this device
    }
  }
}

export async function stopPomodoroAlarm() {
  try {
    if (cachedSound) {
      await cachedSound.stopAsync();
    }
  } catch (e) {
    // no-op — sound may already be stopped
  }

  if (Platform.OS !== "web") {
    try {
      Vibration.cancel();
    } catch (e) {
      // no-op
    }
  }
}
