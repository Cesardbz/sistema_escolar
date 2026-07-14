import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';
import { MOCK_LINKS } from '../services/database';

export default function LinksScreen() {
  const handlePressLink = (item) => {
    Alert.alert(
      'Abrir Enlace',
      `¿Desea abrir el enlace externo a "${item.title}"?\n\nURL: ${item.url}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir', 
          onPress: () => {
            Linking.openURL(item.url).catch(() => {
              Alert.alert('Error', 'No se pudo abrir la dirección web.');
            });
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, SHADOWS.light]}
      onPress={() => handlePressLink(item)}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔗</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.desc}</Text>
        </View>
        <Text style={styles.chevron}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Enlaces de Interés</Text>
      <Text style={styles.headerSubtitle}>Accesos rápidos a las plataformas institucionales del colegio</Text>

      <FlatList
        data={MOCK_LINKS}
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
});
