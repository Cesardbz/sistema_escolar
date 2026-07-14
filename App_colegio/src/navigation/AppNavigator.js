import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../styles/theme';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import AccountScreen from '../screens/AccountScreen';
import BirthdaysScreen from '../screens/BirthdaysScreen';
import LinksScreen from '../screens/LinksScreen';
import CalendarScreen from '../screens/CalendarScreen';
import IDCardScreen from '../screens/IDCardScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ emoji, focused, label }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconEmoji, focused && styles.iconEmojiActive]}>{emoji}</Text>
      <Text style={[styles.iconLabel, focused && styles.iconLabelActive]}>{label}</Text>
    </View>
  );
}

function MainTabNavigator({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 6,
        },
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        options={{
          headerTitle: 'Colegio San José',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} label="Inicio" />
        }}
      >
        {(props) => <DashboardScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="Horarios" 
        options={{
          headerTitle: 'Horarios',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⏰" focused={focused} label="Horarios" />
        }}
      >
        {(props) => <ScheduleScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="IdentificaciónTab" 
        options={{
          headerTitle: 'Identificación Digital',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🪪" focused={focused} label="ID" />
        }}
      >
        {(props) => <IDCardScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen 
        name="Cuenta" 
        options={{
          headerTitle: 'Mi Cuenta',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} label="Mi Cuenta" />
        }}
      >
        {(props) => <AccountScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {(props) => <MainTabNavigator {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen name="Cursos" options={{ title: 'Mis Cursos' }}>
        {(props) => <CoursesScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen name="Cumpleaños" component={BirthdaysScreen} options={{ title: 'Cumpleaños' }} />
      <Stack.Screen name="Enlaces" component={LinksScreen} options={{ title: 'Enlaces Útiles' }} />
      <Stack.Screen name="Cronograma" component={CalendarScreen} options={{ title: 'Cronograma' }} />
      <Stack.Screen name="Identificación" options={{ title: 'Mi Credencial' }}>
        {(props) => <IDCardScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  iconEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  iconEmojiActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  iconLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  iconLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
