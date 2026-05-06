import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import RiderScreen from "./src/screens/RiderScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: "#1A1F2E", borderTopColor: "#252D3D", height: 80, paddingBottom: 20, paddingTop: 10 },
          tabBarActiveTintColor: "#00D4AA",
          tabBarInactiveTintColor: "#8A9BB0",
          tabBarIcon: ({ focused, color }) => {
            return <Ionicons name={focused ? "bicycle" : "bicycle-outline"} size={26} color={color} />;
          },
        })}
      >
        <Tab.Screen name="🏍️ Rider Checker" component={RiderScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
