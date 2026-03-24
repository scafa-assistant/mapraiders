import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { petApi } from '../../services/api';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import PetCard from '../../components/PetCard';
import type { PetScreenProps, Pet } from '../../navigation/types';

type RegisterStep = 'form' | 'loading';

export default function PetScreen({ navigation }: PetScreenProps) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Registration form state
  const [showRegister, setShowRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('Dog');
  const [petBreed, setPetBreed] = useState('');

  const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Bird', 'Other'];

  const fetchPet = useCallback(async () => {
    try {
      const res = await petApi.getMine();
      const pets = res.data?.data?.pets ?? res.data?.data ?? res.data ?? [];
      const firstPet = Array.isArray(pets) ? pets[0] : (pets?.id ? pets : null);
      if (firstPet) {
        setPet(firstPet);
        setShowRegister(false);
      } else {
        setPet(null);
        setShowRegister(true);
      }
    } catch {
      setPet(null);
      setShowRegister(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPet();
    setRefreshing(false);
  };

  const handleRegister = async () => {
    if (!petName.trim()) {
      Alert.alert('Name required', 'Please give your pet a name!');
      return;
    }

    setRegisterStep('loading');
    try {
      const res = await petApi.register({
        name: petName.trim(),
        species: petSpecies.toLowerCase(),
        breed: petBreed.trim() || undefined,
      });
      const pet = res.data?.data?.pet ?? res.data?.data ?? res.data;
      setPet(pet);
      setShowRegister(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not register pet');
      setRegisterStep('form');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Pet</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  // Registration view
  if (showRegister && !pet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Pet</Text>
          <View style={{ width: 40 }} />
        </View>

        {registerStep === 'loading' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.secondary} />
            <Text style={styles.loadingText}>Registering your companion...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.registerScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero */}
            <View style={styles.registerHero}>
              <View style={styles.registerPawCircle}>
                <Ionicons name="paw" size={48} color={THEME.secondary} />
              </View>
              <Text style={styles.registerTitle}>Add Your Companion</Text>
              <Text style={styles.registerSubtitle}>
                Your pet walks with you, earns XP, and finds rare items!
              </Text>
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>Pet Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What's their name?"
              placeholderTextColor="#555E78"
              value={petName}
              onChangeText={setPetName}
              maxLength={24}
            />

            {/* Species */}
            <Text style={styles.inputLabel}>Species</Text>
            <View style={styles.speciesGrid}>
              {SPECIES_OPTIONS.map((sp) => (
                <TouchableOpacity
                  key={sp}
                  style={[
                    styles.speciesChip,
                    petSpecies === sp && styles.speciesChipActive,
                  ]}
                  onPress={() => setPetSpecies(sp)}
                >
                  <Text
                    style={[
                      styles.speciesChipText,
                      petSpecies === sp && styles.speciesChipTextActive,
                    ]}
                  >
                    {sp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Breed */}
            <Text style={styles.inputLabel}>Breed (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Golden Retriever"
              placeholderTextColor="#555E78"
              value={petBreed}
              onChangeText={setPetBreed}
              maxLength={40}
            />

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerBtn,
                !petName.trim() && styles.registerBtnDisabled,
              ]}
              onPress={handleRegister}
              disabled={!petName.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="paw" size={20} color="#0A0E17" />
              <Text style={styles.registerBtnText}>Register Companion</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // Pet view
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.secondary}
            colors={[THEME.secondary]}
          />
        }
      >
        {pet && <PetCard pet={pet} />}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>How to level up</Text>
          <View style={styles.tipRow}>
            <Ionicons name="footsteps-outline" size={16} color={THEME.primary} />
            <Text style={styles.tipText}>Walk regularly to earn pet XP</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="compass-outline" size={16} color={THEME.accent} />
            <Text style={styles.tipText}>Explore new areas for bonus XP</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="diamond-outline" size={16} color={THEME.warning} />
            <Text style={styles.tipText}>Find rare items during walks</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="shield-outline" size={16} color={THEME.secondary} />
            <Text style={styles.tipText}>At level 5, choose a specialization</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: THEME.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  // Registration
  registerScroll: {
    paddingHorizontal: 20,
  },
  registerHero: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  registerPawCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(123, 97, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(123, 97, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  registerTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginBottom: SPACING.sm,
  },
  registerSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesChip: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  speciesChipActive: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderColor: THEME.secondary,
  },
  speciesChipText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  speciesChipTextActive: {
    color: THEME.secondary,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  registerBtnDisabled: {
    opacity: 0.4,
  },
  registerBtnText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  // Tips
  tipsCard: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tipsTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tipText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
});
