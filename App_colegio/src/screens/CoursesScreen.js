import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import { MOCK_COURSES } from '../services/database';

export default function CoursesScreen({ user }) {
  const courses = MOCK_COURSES[user.id] || [];

  const renderCourseItem = ({ item }) => (
    <View style={[styles.courseCard, SHADOWS.light]}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{item.name}</Text>
        <View style={styles.roomBadge}>
          <Text style={styles.roomText}>{item.room}</Text>
        </View>
      </View>
      <Text style={styles.teacherText}>👨‍🏫 {item.teacher}</Text>
      <Text style={styles.scheduleText}>📅 {item.schedule}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Mis Asignaturas</Text>
      <Text style={styles.headerSubtitle}>Lista de cursos inscritos para el periodo actual</Text>

      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tienes cursos registrados en este grado.</Text>
        }
      />
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
  list: {
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  roomBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roomText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  teacherText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
  },
  scheduleText: {
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
