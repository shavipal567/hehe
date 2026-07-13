import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { StudyProvider } from "./src/context/StudyContext";
import HomeScreen from "./src/screens/HomeScreen";
import PlannerScreen from "./src/screens/PlannerScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import SubjectsScreen from "./src/screens/SubjectsScreen";

const Tab = createBottomTabNavigator();

const ICONS = {
  Timer: "⏱️",
  Planner: "📝",
  Group: "👥",
  Stats: "📊",
  Subjects: "🎯",
};

export default function App() {
  return (
    <StudyProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: "#F2578D",
            tabBarInactiveTintColor: "#B4AFC9",
            tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
          })}
        >
          <Tab.Screen name="Timer" component={HomeScreen} />
          <Tab.Screen name="Planner" component={PlannerScreen} />
          <Tab.Screen name="Group" component={GroupsScreen} />
          <Tab.Screen name="Stats" component={StatsScreen} />
          <Tab.Screen name="Subjects" component={SubjectsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </StudyProvider>
  );
}
