import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import { MOCK_CALENDAR } from '../services/database';

export default function CalendarScreen() {
  const getEventBadgeColor = (type) => {
    switch (type) {
      case 'academic': return COLORS.primary;
      case 'holiday': return COLORS.success;
      case 'event': return COLORS.accent;
      default: return COLORS.textMuted;
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.light]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: getEventBadgeColor(item.type) }]}>
          <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateText}>📅 {item.date}</Text>
      </View>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.descText}>{item.desc}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Cronograma Escolar</Text>
      <Text style={styles.headerSubtitle}>Fechas importantes, exámenes y eventos institucionales</Text>

      <FlatList
        data={MOCK_CALENDAR}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
