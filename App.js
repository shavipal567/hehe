import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, ActivityIndicator } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { StudyProvider, useStudy } from "./src/context/StudyContext";
import HomeScreen from "./src/screens/HomeScreen";
import PlannerScreen from "./src/screens/PlannerScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import SubjectsScreen from "./src/screens/SubjectsScreen";
import ForYouScreen from "./src/screens/ForYouScreen";
import NotesScreen from "./src/screens/NotesScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import AuthScreen from "./src/screens/AuthScreen";
import { getTheme } from "./src/theme";

const Tab = createBottomTabNavigator();

const ICONS = {
  Timer: "⏱️",
  Planner: "📝",
  Calendar: "🗓️",
  Notes: "📌",
  "For You": "💗",
  Group: "👥",
  Stats: "📊",
  Subjects: "🎯",
};

function MainTabs() {
  const { darkMode } = useStudy();
  const theme = getTheme(darkMode);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
        tabBarLabelStyle: { fontSize: 9 },
        tabBarStyle: { backgroundColor: darkMode ? "#1B1428" : "#ffffff" },
      })}
    >
      <Tab.Screen name="Timer" component={HomeScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="For You" component={ForYouScreen} />
      <Tab.Screen name="Group" component={GroupsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Subjects" component={SubjectsScreen} />
    </Tab.Navigator>
  );
}

function RootRouter() {
  const { loaded, onboarded, darkMode } = useStudy();
  const { user, authLoading } = useAuth();

  if (!loaded || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: darkMode ? "#1B1428" : "#FFF0F6", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <ActivityIndicator size="large" color={darkMode ? "#FF7AAE" : "#F2578D"} />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={darkMode ? "light" : "dark"} />
      {onboarded ? <MainTabs /> : <WelcomeScreen />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudyProvider>
        <NavigationContainer>
          <RootRouter />
        </NavigationContainer>
      </StudyProvider>
    </AuthProvider>
  );
}
