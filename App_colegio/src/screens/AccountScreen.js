import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';

export default function AccountScreen({ user, onLogout }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.header}>
        <Image source={{ uri: user.photo }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Personal Info Card */}
      <View style={[styles.card, SHADOWS.light]}>
        <Text style={styles.cardTitle}>Datos Académicos y Personales</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Grado</Text>
          <Text style={styles.value}>{user.grade}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Nro. de Documento (DNI)</Text>
          <Text style={styles.value}>{user.document}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Celular</Text>
          <Text style={styles.value}>{user.celular || 'No registrado'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Dirección</Text>
          <Text style={styles.value}>{user.direccion || 'No registrado'}</Text>
        </View>
      </View>

      {/* Guardian Info Card */}
      <View style={[styles.card, SHADOWS.light]}>
        <Text style={styles.cardTitle}>Contacto de Emergencia / Apoderado</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Nombre Apoderado</Text>
          <Text style={styles.value}>{user.guardianName || 'No registrado'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Celular Apoderado</Text>
          <Text style={[styles.value, { color: COLORS.primary, fontWeight: 'bold' }]}>
            {user.guardianPhone || 'No registrado'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Parentesco</Text>
          <Text style={styles.value}>{user.guardianRelation || 'No registrado'}</Text>
        </View>
      </View>

      {/* Medical Info Card */}
      <View style={[styles.card, SHADOWS.light]}>
        <Text style={styles.cardTitle}>Ficha Médica</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Tipo de Sangre</Text>
          <Text style={styles.value}>{user.bloodType}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Seguro Médico</Text>
          <Text style={styles.value}>{user.insurance}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Alergias</Text>
          <Text style={[styles.value, user.allergies !== 'Ninguna' && { color: COLORS.danger, fontWeight: 'bold' }]}>
            {user.allergies}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Observaciones Médicas</Text>
          <Text style={styles.value}>{user.observations}</Text>
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  label: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    maxWidth: '60%',
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
