import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications should be handled when the app is running in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0f4c9c',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('¡Permiso de notificaciones denegado!');
      return 'ExponentPushToken[mock-denied]';
    }
    
    // Get the expo push token
    try {
      // In Expo Go, fetching token might fail if EAS project ID is not set.
      // We pass a mock token in that case to prevent crashes.
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.log('Advertencia de Expo Go: No se pudo obtener el token real (falta projectId). Usando token simulado para desarrollo.');
      token = 'ExponentPushToken[simulado-expo-go]';
    }
  } else {
    console.log('Simulador detectado. Usando token simulado para desarrollo.');
    token = 'ExponentPushToken[simulado-simulador]';
  }

  return token;
}

// Helper function to send local/simulated push notifications for testing
export async function sendLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: true,
    },
    trigger: null, // send immediately
  });
}
