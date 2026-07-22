import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SkyBackground from "../components/SkyBackground";
import { useAuth } from "../context/AuthContext";
import { useStudy } from "../context/StudyContext";
import { getTheme, cardShadow } from "../theme";
import { supabase } from "../utils/supabase";
import React, { useState} from "react";

export default function AuthScreen() {
  const { darkMode } = useStudy();
  const { signUp, signIn } = useAuth();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Please enter your email.";
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address.";
    if (!password) return "Please enter a password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (mode === "register" && password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async () => {
    if (busy) return;
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setBusy(true);
    try {
      const fn = mode === "login" ? signIn : signUp;
      const { data, error: authError } = await fn(email.trim().toLowerCase(), password);
      if (authError) { setError(authError.message); return; }
      if (mode === "register" && !data?.session) setRegistered(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
 const handleGoogleSignIn = async () => {
  setError("");

  const redirectTo = window.location.hostname === "localhost"
    ? window.location.origin
    : "https://shavipal567.github.io/hehe/";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    setError(error.message);
  }
};

  const switchMode = () => {
    setError("");
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  if (registered) {
    return (
      <SkyBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>📧✨</Text>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a confirmation link to{"\n"}{email.trim().toLowerCase()}.
              {"\n\n"}Tap the link in the email to verify your account, then come back and sign in.
            </Text>
            <TouchableOpacity style={styles.buttonWrap} onPress={() => { setMode("login"); setRegistered(false); }} activeOpacity={0.85}>
              <LinearGradient
                colors={[theme.primary, "#B94E8C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SkyBackground>
    );
  }

  return (
    <SkyBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>🩺🌸✨</Text>
            <Text style={styles.title}>GRIND</Text>
            <Text style={styles.subtitle}>
              {mode === "login"
                ? "Welcome back — ready to study?"
                : "Create an account to start your study journey."}
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              editable={!busy}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                editable={!busy}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)} disabled={busy}>
                <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>

            {mode === "register" && (
              <>
                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat your password"
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    autoComplete="new-password"
                    editable={!busy}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword((v) => !v)} disabled={busy}>
                    <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.buttonWrap} onPress={handleSubmit} disabled={busy} activeOpacity={0.85}>
              <LinearGradient
                colors={[theme.primary, "#B94E8C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
  style={styles.googleButton}
  onPress={handleGoogleSignIn}
  disabled={busy}
>
  <Text style={styles.googleText}>
    Continue with Google
  </Text>
</TouchableOpacity>

            <TouchableOpacity onPress={switchMode} disabled={busy} style={styles.switchWrap}>
              <Text style={styles.switchText}>
                {mode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SkyBackground>
  );
}

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: theme.cardBg,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...cardShadow,
  },
  emoji: { fontSize: 32, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, textAlign: "center" },
  subtitle: { color: theme.muted, textAlign: "center", marginTop: 8, marginBottom: 20, lineHeight: 20 },
  label: { color: theme.muted, fontWeight: "600", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: "#3A2E45",
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: "#3A2E45",
  },
  eyeButton: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 14 },
  eyeText: { color: theme.primary, fontWeight: "700", fontSize: 13 },
  errorText: { color: theme.danger, marginTop: 12, fontWeight: "600", fontSize: 13, textAlign: "center" },
  button: {
    borderRadius: 16, paddingVertical: 16, alignItems: "center",
  },
  buttonWrap: {
    marginTop: 20, borderRadius: 16,
    shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  googleButton: {
  marginTop: 14,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#ddd",
  backgroundColor: "#fff",
  paddingVertical: 15,
  alignItems: "center",
},

googleText: {
  fontSize: 16,
  fontWeight: "700",
  color: "#444",
},
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchWrap: { marginTop: 16, alignItems: "center" },
  switchText: { color: theme.primary, fontWeight: "600", fontSize: 14 },
});
}