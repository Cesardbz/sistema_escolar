import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import { MOCK_SCHEDULES } from '../services/database';

export default function ScheduleScreen({ user }) {
  const scheduleData = MOCK_SCHEDULES[user.id] || [];
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const [activeDay, setActiveDay] = useState('Lunes');

  const currentDayData = scheduleData.find(d => d.day === activeDay) || { items: [] };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Horario Escolar</Text>
      <Text style={styles.headerSubtitle}>Distribución semanal de clases por asignatura</Text>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {days.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.tab,
              activeDay === day && styles.tabActive
            ]}
            onPress={() => setActiveDay(day)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              activeDay === day && styles.tabTextActive
            ]}>
              {day.substring(0, 2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.list}>
        {currentDayData.items.length > 0 ? (
          currentDayData.items.map((item, index) => (
            <View key={index} style={[styles.card, SHADOWS.light]}>
              <Text style={styles.timeText}>⏰ {item.time}</Text>
              <Text style={styles.subjectText}>{item.subject}</Text>
              <Text style={styles.roomText}>📍 {item.room}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay clases programadas para este día.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  roomText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 40,
    fontStyle: 'italic',
  },
});
