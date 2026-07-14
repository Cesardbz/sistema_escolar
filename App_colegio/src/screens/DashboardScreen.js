import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import { MOCK_ATTENDANCE } from '../services/database';

export default function DashboardScreen({ user, navigation }) {
  const attendanceLogs = MOCK_ATTENDANCE[user.id] || [];
  const todayLog = attendanceLogs[0]; // Simulation: today's log

  const getStatusColor = (status) => {
    switch (status) {
      case 'Presente': return COLORS.success;
      case 'Tardanza': return COLORS.warning;
      case 'Ausente': return COLORS.danger;
      default: return COLORS.textMuted;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={[styles.profileCard, SHADOWS.light]}>
        <Image source={{ uri: user.photo }} style={styles.avatar} />
        <View style={styles.profileText}>
          <Text style={styles.welcomeText}>Hola,</Text>
          <Text style={styles.nameText}>{user.name}</Text>
          <Text style={styles.gradeText}>{user.grade}</Text>
        </View>
      </View>

      {/* Attendance Today Card */}
      <View style={[styles.card, SHADOWS.medium]}>
        <Text style={styles.cardTitle}>Estado de Asistencia Hoy</Text>
        <Text style={styles.dateLabel}>9 de Julio, 2026</Text>

        {todayLog ? (
          <View style={styles.todayLogContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(todayLog.status) }]} />
            <View style={styles.todayLogInfo}>
              <Text style={styles.logStatusText}>{todayLog.status}</Text>
              <Text style={styles.logTimeText}>
                {todayLog.status === 'Ausente' ? 'Inasistencia Registrada' : `Ingreso: ${todayLog.time}`}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noLogText}>No hay registros de ingreso para hoy.</Text>
        )}
      </View>

      {/* Quick Menu Grid */}
      <Text style={styles.sectionTitle}>Secciones</Text>
      <View style={styles.grid}>
        <TouchableOpacity 
          style={[styles.gridItem, SHADOWS.light]} 
          onPress={() => navigation.navigate('Cursos')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#eff6ff' }]}>
            <Text style={styles.iconText}>📚</Text>
          </View>
          <Text style={styles.gridLabel}>Cursos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.gridItem, SHADOWS.light]} 
          onPress={() => navigation.navigate('Horarios')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.iconText}>⏰</Text>
          </View>
          <Text style={styles.gridLabel}>Horarios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.gridItem, SHADOWS.light]} 
          onPress={() => navigation.navigate('Identificación')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#ecfdf5' }]}>
            <Text style={styles.iconText}>🪪</Text>
          </View>
          <Text style={styles.gridLabel}>Identificación</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.gridItem, SHADOWS.light]} 
          onPress={() => navigation.navigate('Cumpleaños')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#fdf2f8' }]}>
            <Text style={styles.iconText}>🎂</Text>
          </View>
          <Text style={styles.gridLabel}>Cumpleaños</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.gridItem, SHADOWS.light]} 
          onPress={() => navigation.navigate('Cronograma')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#f5f3ff' }]}>
            <Text style={styles.iconText}>📅</Text>
          </View>
          <Text style={styles.gridLabel}>Cronograma</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.gridItem, SHADOWS.light]} 
          onPress={() => navigation.navigate('Enlaces')}
        >
          <View style={[styles.iconBg, { backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.iconText}>🔗</Text>
          </View>
          <Text style={styles.gridLabel}>Enlaces</Text>
        </TouchableOpacity>
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
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gradeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  todayLogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  todayLogInfo: {
    flex: 1,
  },
  logStatusText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logTimeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  noLogText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 22,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
