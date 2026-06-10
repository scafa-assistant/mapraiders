import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME, FONT_SIZE } from '../../utils/constants';
import { strings as S } from '../../i18n';

export default function TravelRouteListScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="trail-sign-outline" size={48} color={THEME.primary} />
        </View>
        <Text style={styles.title}>{S.travel.list.title}</Text>
        <Text style={styles.subtitle}>{S.common.comingSoon}</Text>
        <Text style={styles.description}>
          {S.travel.list.description}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: THEME.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: THEME.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
