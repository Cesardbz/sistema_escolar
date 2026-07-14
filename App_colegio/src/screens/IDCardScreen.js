import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import DigitalIDCard from '../components/DigitalIDCard';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

export default function IDCardScreen({ user }) {
  const [downloading, setDownloading] = useState(false);
  const [useQR, setUseQR] = useState(false);
  const viewRef = useRef();

  const handleDownloadID = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu galería para poder guardar la imagen de tu credencial.'
        );
        return;
      }

      setDownloading(true);

      // Capture the card view as a temporary image file URI
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
      });

      // Save the captured image to the device gallery
      await MediaLibrary.saveToLibraryAsync(uri);
      
      setDownloading(false);
      Alert.alert('Éxito', '¡Credencial digital guardada en tu galería de fotos!');
    } catch (error) {
      setDownloading(false);
      Alert.alert('Error', 'No se pudo guardar la credencial en la galería.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Mi Identificación</Text>
      <Text style={styles.headerSubtitle}>Muestra esta credencial digital frente al escáner de asistencia al ingresar o salir del colegio</Text>

      <View style={styles.cardContainer}>
        <DigitalIDCard student={user} useQR={useQR} cardRef={viewRef} />
      </View>

      <TouchableOpacity 
        style={[styles.toggleButton, SHADOWS.light]} 
        onPress={() => setUseQR(!useQR)}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleButtonText}>
          {useQR ? '🔄 Mostrar Código de Barras' : '🔄 Mostrar Código QR'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.downloadButton, SHADOWS.light]} 
        onPress={handleDownloadID}
        disabled={downloading}
        activeOpacity={0.8}
      >
        {downloading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.downloadButtonText}>⬇️ Descargar Identificación</Text>
        )}
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.infoTitle}>💡 Instrucciones de escaneo</Text>
        <Text style={styles.infoText}>
          1. Asegúrate de tener el brillo de pantalla alto.{'\n'}
          2. Coloca el código de barras a unos 10-15 cm del lector.{'\n'}
          3. Espera a que el terminal emita un pitido de confirmación.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    alignSelf: 'flex-start',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 24,
    alignSelf: 'flex-start',
    lineHeight: 18,
  },
  cardContainer: {
    width: '100%',
    marginVertical: 10,
  },
  instructions: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 24,
    width: '100%',
    maxWidth: 340,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
    maxWidth: 340,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
    maxWidth: 340,
  },
  toggleButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
