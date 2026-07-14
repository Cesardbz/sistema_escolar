import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import { MOCK_BIRTHDAYS } from '../services/database';

export default function BirthdaysScreen() {
  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.light, item.isMe && styles.cardMe]}>
      <View style={styles.contentRow}>
        <View style={styles.leftSection}>
          <Text style={styles.avatarIcon}>🎁</Text>
          <View>
            <Text style={[styles.name, item.isMe && styles.textMe]}>
              {item.name} {item.isMe && '(Tú)'}
            </Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        </View>
        <View style={[styles.dateBadge, item.isMe && styles.dateBadgeMe]}>
          <Text style={[styles.dateText, item.isMe && styles.dateTextMe]}>{item.day}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Cumpleaños del Mes</Text>
      <Text style={styles.headerSubtitle}>Celebremos juntos a nuestros compañeros y docentes en Julio</Text>

      <FlatList
        data={MOCK_BIRTHDAYS}
        keyExtractor={(item, index) => index.toString()}
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
  cardMe: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarIcon: {
    fontSize: 24,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  textMe: {
    color: COLORS.primary,
  },
  role: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  dateBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateBadgeMe: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dateTextMe: {
    color: COLORS.white,
  },
});
