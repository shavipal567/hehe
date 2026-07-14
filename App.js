import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

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
import { theme } from "./src/theme";

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
        tabBarLabelStyle: { fontSize: 9 },
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
  const { loaded, onboarded } = useStudy();
  if (!loaded) return null; // brief splash while AsyncStorage loads
  return onboarded ? <MainTabs /> : <WelcomeScreen />;
}

export default function App() {
  return (
    <StudyProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootRouter />
      </NavigationContainer>
    </StudyProvider>
  );
}
