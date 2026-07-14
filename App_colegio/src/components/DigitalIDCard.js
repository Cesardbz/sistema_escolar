import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { COLORS, SHADOWS } from '../styles/theme';

export default function DigitalIDCard({ student, useQR = false, cardRef }) {
  if (!student) return null;

  // Generate a mock barcode graphic (vertical lines of varying width)
  const renderBarcodeLines = () => {
    const lines = [2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 4, 1, 3, 2];
    return (
      <View style={styles.barcodeContainer}>
        <Text style={styles.barcodeTitle}>CREDENCIAL DE ACCESO</Text>
        <View style={styles.barcodeLines}>
          {lines.map((width, index) => (
            <View
              key={index}
              style={[
                styles.barcodeLine,
                {
                  width: width * 1.5,
                  backgroundColor: index % 2 === 0 ? '#000000' : 'transparent',
                  marginRight: index % 3 === 0 ? 1 : 0.5
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.barcodeText}>{student.barcode}</Text>
      </View>
    );
  };

  // Generate a mock QR code graphic (grid of cells)
  const renderQRCodeMock = () => {
    const size = 15;
    const cells = [];
    const isFinder = (x, y) => {
      if (x < 5 && y < 5) return true;
      if (x >= size - 5 && y < 5) return true;
      if (x < 5 && y >= size - 5) return true;
      return false;
    };
    const isFinderFilled = (x, y) => {
      if (x < 5 && y < 5) {
        if (x === 0 || x === 4 || y === 0 || y === 4) return true;
        if (x === 2 && y === 2) return true;
        return false;
      }
      if (x >= size - 5 && y < 5) {
        const rx = x - (size - 5);
        if (rx === 0 || rx === 4 || y === 0 || y === 4) return true;
        if (rx === 2 && y === 2) return true;
        return false;
      }
      if (x < 5 && y >= size - 5) {
        const ry = y - (size - 5);
        if (x === 0 || x === 4 || ry === 0 || ry === 4) return true;
        if (x === 2 && ry === 2) return true;
        return false;
      }
      return false;
    };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (isFinder(x, y)) {
          cells.push(isFinderFilled(x, y));
        } else {
          cells.push(((x * 7 + y * 13) % 3) === 0);
        }
      }
    }

    return (
      <View style={styles.barcodeContainer}>
        <Text style={styles.barcodeTitle}>CREDENCIAL DE ACCESO</Text>
        <View style={styles.qrGrid}>
          {Array.from({ length: size }).map((_, y) => (
            <View key={y} style={styles.qrRow}>
              {Array.from({ length: size }).map((_, x) => {
                const filled = cells[y * size + x];
                return (
                  <View
                    key={x}
                    style={[
                      styles.qrCell,
                      { backgroundColor: filled ? '#000000' : 'transparent' }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <Text style={styles.barcodeText}>{student.barcode}</Text>
      </View>
    );
  };

  // Get student initials for fallback avatar
  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : 'MS';
  };

  return (
    <View ref={cardRef} collapsable={false} style={[styles.card, SHADOWS.premium]}>
      {/* Background Watermark/Aesthetic Details */}
      <View style={styles.watermarkContainer}>
        <Text style={styles.watermarkIcon}>🎓</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolTitle}>COLEGIO SAN JOSÉ</Text>
          <Text style={styles.schoolSubtitle}>DE CALASANZ</Text>
        </View>
      </View>

      {/* Dashed line replacement */}
      <View style={styles.divider} />

      {/* Body */}
      <View style={styles.body}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {student.photo ? (
            <Image source={{ uri: student.photo }} style={styles.photo} />
          ) : (
            <Text style={styles.initialsText}>{getInitials(student.name)}</Text>
          )}
        </View>
        
        {/* Name */}
        <Text style={styles.name}>{student.name}</Text>

        {/* Role Pill */}
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>ESTUDIANTE</Text>
        </View>

        {/* Info Rows */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Grado:</Text>
            <Text style={styles.infoValue}>{student.grade}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Código:</Text>
            <Text style={styles.infoValue}>{student.barcode}</Text>
          </View>
        </View>
      </View>

      {/* Graphic Code Area */}
      {useQR ? renderQRCodeMock() : renderBarcodeLines()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a2d5c',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    padding: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    opacity: 0.04,
  },
  watermarkIcon: {
    fontSize: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 18,
    color: '#0a2d5c',
  },
  schoolInfo: {
    flex: 1,
  },
  schoolTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  schoolSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginBottom: 16,
  },
  body: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a2d5c',
  },
  name: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  rolePill: {
    backgroundColor: '#f59e0b',
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  roleText: {
    color: '#0f172a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  barcodeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  barcodeTitle: {
    fontSize: 7,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  barcodeLine: {
    height: '100%',
  },
  barcodeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  qrGrid: {
    padding: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  qrRow: {
    flexDirection: 'row',
  },
  qrCell: {
    width: 4.5,
    height: 4.5,
  },
});
