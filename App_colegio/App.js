import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notifications';

export default function App() {
  const [user, setUser] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setExpoPushToken(token);
          // In a production app, you would send this token to Supabase:
          // supabase.from('usuarios').update({ push_token: token }).eq('id_usuario', user.id);
          console.log('Token registrado para el usuario:', user.name, token);
        }
      });

      // Listener for when a notification is received while the app is in the foreground
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notificación recibida en primer plano:', notification);
      });

      // Listener for when a user interacts with a notification (taps it)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Usuario interactuó con la notificación:', response);
      });

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setExpoPushToken('');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {user ? (
        <NavigationContainer>
          <AppNavigator user={user} onLogout={handleLogout} />
        </NavigationContainer>
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </SafeAreaProvider>
  );
}
