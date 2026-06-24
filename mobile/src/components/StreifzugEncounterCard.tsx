import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { StreifzugEncounter } from '../services/api';
import { strings as S, t } from '../i18n';
import { fx } from '../services/fx';
import PressableScale from './fx/PressableScale';
import ParticleBurst from './fx/ParticleBurst';
import { useReducedMotion } from './fx/useReducedMotion';

// ─── Streifzug Encounter Card ────────────────────────────────────────────────
//
// Bottom overlay shown when a patrol ping surfaces a nearby encounter. The
// server provides title/body/distance; the player either heads over (routes
// into the existing HackingScreen flow) or dismisses it.
//
// This component owns ONLY the client-side feel (sound, haptics, animation) of
// the encounter surfacing. It does not touch the server contract or the patrol
// logic — props and data flow are unchanged. Streifzug itself stays flagged as
// "in development" (betaBadge), this is just the juice layer for the teaser.

interface Props {
  encounter: StreifzugEncounter;
  onEngage: (encounter: StreifzugEncounter) => void;
  onDismiss: () => void;
}

const KIND_ICON: Record<StreifzugEncounter['kind'], keyof typeof Ionicons.glyphMap> = {
  loot: 'sparkles',
  recruit: 'people',
  threat: 'warning',
};

function engageLabel(kind: StreifzugEncounter['kind']): string {
  const c = S.components.streifzugCard;
  if (kind === 'loot') return c.engageLoot;
  if (kind === 'recruit') return c.engageRecruit;
  if (kind === 'threat') return c.engageThreat;
  return c.engageDefault;
}

export const StreifzugEncounterCard: React.FC<Props> = ({ encounter, onEngage, onDismiss }) => {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const accent = encounter.kind === 'threat' ? theme.danger : theme.primary;
  const icon = KIND_ICON[encounter.kind] ?? 'sparkles';
  const C = S.components.streifzugCard;

  // Slide-in (translateY + fade), "mrUp" style. New spawnId => re-animate.
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  // Looping pulse for the live dot.
  const pulse = useRef(new Animated.Value(0)).current;
  // Fire-and-forget particle burst on a loot pickup.
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    // Announce the encounter (sound + haptic, both settings-gated via fx).
    fx.notifyFx();

    if (reduced) {
      enter.setValue(1);
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounter.spawnId, reduced]);

  useEffect(() => {
    if (reduced) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  const handleEngage = () => {
    // Transition feel by encounter type. The actual combat feel comes from the
    // combat module, not here, so a threat only gets a soft transition.
    if (encounter.kind === 'loot') {
      fx.victory();
      setBurst(Date.now());
    } else if (encounter.kind === 'recruit') {
      fx.confirm();
    } else {
      fx.soft();
    }
    onEngage(encounter);
  };

  const handleDismiss = () => {
    fx.tick();
    onDismiss();
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.25] });

  return (
    <View pointerEvents="box-none" style={styles.host}>
      {/* Particle burst overlays the card region; never captures touches. */}
      <ParticleBurst fireKey={burst} />

      <Animated.View
        style={[
          styles.wrap,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: enter,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.iconBadge, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={22} color="#FFFFFF" />
          {/* Live "active patrol" pulse dot. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.liveDot,
              {
                backgroundColor: '#FFFFFF',
                opacity: dotOpacity,
                transform: [{ scale: dotScale }],
              },
            ]}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {encounter.title}
            </Text>
            <View style={[styles.betaBadge, { borderColor: theme.border }]}>
              <Text style={[styles.betaText, { color: theme.textSecondary }]}>{C.betaBadge}</Text>
            </View>
          </View>
          <Text style={[styles.text, { color: theme.textSecondary }]} numberOfLines={2}>
            {encounter.body}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {t(C.distanceAway, { distance: encounter.distanceM })}
          </Text>

          <View style={styles.actions}>
            <PressableScale
              style={[styles.engageBtn, { backgroundColor: accent }]}
              onPress={handleEngage}
              feedback="none"
              accessibilityLabel={engageLabel(encounter.kind)}
            >
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.engageText}>{engageLabel(encounter.kind)}</Text>
            </PressableScale>
            <PressableScale
              style={styles.dismissBtn}
              onPress={handleDismiss}
              feedback="none"
              accessibilityLabel={C.dismiss}
            >
              <Text style={[styles.dismissText, { color: theme.textSecondary }]}>{C.dismiss}</Text>
            </PressableScale>
          </View>
        </View>

        <PressableScale
          style={styles.close}
          onPress={handleDismiss}
          feedback="none"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={C.dismiss}
        >
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </PressableScale>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 110,
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  betaBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  betaText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  text: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  engageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  engageText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, marginLeft: 6 },
  dismissBtn: { paddingHorizontal: 14, paddingVertical: 9, marginLeft: 4 },
  dismissText: { fontSize: 14, fontWeight: '600' },
  close: { position: 'absolute', top: 8, right: 8, padding: 4 },
});

export default StreifzugEncounterCard;
