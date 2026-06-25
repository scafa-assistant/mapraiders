import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeachStore } from '../../store/teachStore';
import { strings as S, t } from '../../i18n';
import { fx } from '../../services/fx';
import { useReducedMotion } from './useReducedMotion';

// Per-id visual meta (icon + system color). Not translatable, so it lives here
// rather than in i18n. Color follows the game-system palette (blue = you /
// empire, red = battle, green = build, amber = recon / patrol, sky = echo).
const TEACH_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  karte: { icon: 'map', color: '#1558F0' },
  claim: { icon: 'flag', color: '#1558F0' },
  imperium: { icon: 'business', color: '#1558F0' },
  build: { icon: 'hammer', color: '#1B9E5A' },
  battle: { icon: 'flash', color: '#D7263D' },
  recon: { icon: 'eye', color: '#F5A623' },
  quests: { icon: 'compass', color: '#1558F0' },
  clan: { icon: 'people', color: '#1558F0' },
  streifzug: { icon: 'walk', color: '#F5A623' },
  echo: { icon: 'radio', color: '#4B7BFF' },
};

interface TeachStep {
  title: string;
  body: string;
}
interface TeachContent {
  kicker: string;
  steps: TeachStep[];
}

/**
 * Global first-run coachmark host. Mount ONCE near the app root. Screens trigger
 * it via showTeach(id) / useTeachOnMount(id). Renders a dimming scrim plus a
 * bottom card that walks the user through 1-3 steps, then marks the id seen so
 * it never shows again. Respects reduce-motion and the sound/haptic settings
 * (via fx). Changes no game logic: it is a pure hint overlay.
 */
export function Coachmark() {
  const activeId = useTeachStore((s) => s.activeId);
  const dismissActive = useTeachStore((s) => s.dismissActive);
  const loadSeen = useTeachStore((s) => s.loadSeen);
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const scrim = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(0)).current;

  // Hydrate the seen-map once.
  useEffect(() => {
    void loadSeen();
  }, [loadSeen]);

  // Reset to step 0 and play the entrance whenever a new teach opens.
  useEffect(() => {
    if (!activeId) return;
    setStep(0);
    scrim.setValue(0);
    cardY.setValue(reduced ? 0 : 1);
    Animated.parallel([
      Animated.timing(scrim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: reduced ? 0 : 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeId, reduced, scrim, cardY]);

  if (!activeId) return null;

  const meta = TEACH_META[activeId] ?? { icon: 'sparkles' as const, color: '#1558F0' };
  const content = (S.teach as unknown as Record<string, TeachContent>)[activeId];
  if (!content || !content.steps?.length) {
    // Unknown id or missing copy: mark seen so we never get stuck on it.
    dismissActive();
    return null;
  }

  const steps = content.steps;
  const total = steps.length;
  const isLast = step >= total - 1;
  const current = steps[step];

  const next = () => {
    fx.tick();
    if (isLast) {
      dismissActive();
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    fx.tick();
    dismissActive();
  };

  // translateY 14 -> 0 mapped from cardY 1 -> 0.
  const translateY = cardY.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={skip} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={skip} accessibilityLabel={S.teach.ui.skip} />
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: scrim, transform: [{ translateY }] }]}>
          <View style={styles.head}>
            <View style={[styles.iconChip, { backgroundColor: meta.color + '1F' }]}>
              <Ionicons name={meta.icon} size={22} color={meta.color} />
            </View>
            <View style={styles.headText}>
              <Text style={[styles.kicker, { color: meta.color }]} numberOfLines={1}>
                {content.kicker}
                {total > 1 ? `  ·  ${S.teach.ui.step} ${step + 1}/${total}` : ''}
              </Text>
              <Text style={styles.title}>{current.title}</Text>
            </View>
          </View>

          <Text style={styles.body}>{current.body}</Text>

          <View style={styles.foot}>
            <View style={styles.dots}>
              {total > 1 &&
                steps.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === step ? { backgroundColor: meta.color, width: 18 } : null,
                    ]}
                  />
                ))}
            </View>
            <View style={styles.actions}>
              {total > 1 && !isLast && (
                <Pressable onPress={skip} hitSlop={8} style={styles.skipBtn}>
                  <Text style={styles.skipText}>{S.teach.ui.skip}</Text>
                </Pressable>
              )}
              <Pressable
                onPress={next}
                style={[styles.nextBtn, { backgroundColor: meta.color }]}
                accessibilityRole="button"
              >
                <Text style={styles.nextText}>{isLast ? S.teach.ui.gotIt : S.teach.ui.next}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(8,11,22,0.74)' },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 24,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  kicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: { fontSize: 17.5, fontWeight: '800', color: '#141210', letterSpacing: -0.3 },
  body: { fontSize: 14.5, lineHeight: 21, color: '#756F6A', marginTop: 14 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D8D3CD' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { fontSize: 14, fontWeight: '600', color: '#8A847F' },
  nextBtn: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

export default Coachmark;
