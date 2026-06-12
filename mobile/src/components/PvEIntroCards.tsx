import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZE, RADIUS } from '../utils/constants';

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS = [
  {
    icon: 'aperture' as const,
    iconColor: '#9D4EDD',
    title: 'Erdrisse öffnen sich',
    body: 'Unsichtbare Wunden im Stadtgefüge. Fremde Energien dringen durch die Lücken — und sie suchen unsere Territorien.',
  },
  {
    icon: 'hardware-chip' as const,
    iconColor: '#00D4FF',
    title: 'Die Hyperboreer scannen unsere Welt',
    body: 'Ihre Drohnen, Sonden und Aether-Sauger senden auf verborgenen Frequenzen. Sie wissen, dass wir da sind.',
  },
  {
    icon: 'flash' as const,
    iconColor: '#7B61FF',
    title: 'Hacke ihre Einheiten — mach sie zu deinen',
    body: 'Stimme deine Frequenz auf ihre Signatur ab. Halte die Verbindung. Dann gehören ihre Ressourcen dir.',
  },
];

const VRIL_PRIMARY = '#7B61FF';
const { width } = Dimensions.get('window');

// ─── Component ────────────────────────────────────────────────────────────────

interface PvEIntroCardsProps {
  onFinish: () => void;
}

export default function PvEIntroCards({ onFinish }: PvEIntroCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === CARDS.length - 1;

  const advance = () => {
    if (isLast) {
      onFinish();
      return;
    }
    // Slide-out left then jump to next card (slide-in from right)
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(width);
      setCurrentIndex((i) => i + 1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const card = CARDS[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {CARDS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      <Animated.View style={[styles.card, { transform: [{ translateX: slideAnim }] }]}>
        {/* Icon */}
        <View style={[styles.iconCircle, { borderColor: card.iconColor, backgroundColor: `${card.iconColor}18` }]}>
          <Ionicons name={card.icon} size={48} color={card.iconColor} />
        </View>

        {/* Text */}
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.body}>{card.body}</Text>
      </Animated.View>

      {/* Action button */}
      <TouchableOpacity style={styles.btn} onPress={advance} activeOpacity={0.8}>
        <Text style={styles.btnText}>{isLast ? 'Verstanden — Los geht\'s' : 'Weiter'}</Text>
        <Ionicons name={isLast ? 'flash' : 'arrow-forward'} size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(123,97,255,0.25)',
  },
  dotActive: {
    backgroundColor: VRIL_PRIMARY,
    width: 24,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: FONT_SIZE.md,
    color: '#8892B0',
    textAlign: 'center',
    lineHeight: 26,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VRIL_PRIMARY,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    shadowColor: VRIL_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
