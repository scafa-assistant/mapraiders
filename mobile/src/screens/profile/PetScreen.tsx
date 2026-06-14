import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { petApi } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import PetCard from '../../components/PetCard';
import { strings as S } from '../../i18n';
import type { PetScreenProps, Pet } from '../../navigation/types';

type RegisterStep = 'form' | 'loading';

export default function PetScreen({ navigation }: PetScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Registration form state
  const [showRegister, setShowRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(S.profile.pet.permissionNeededTitle, S.profile.pet.libraryPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(S.profile.pet.permissionNeededTitle, S.profile.pet.cameraPermission);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert(S.profile.pet.addPhotoTitle, S.profile.pet.addPhotoMessage, [
      { text: S.profile.pet.takePhoto, onPress: takePhoto },
      { text: S.profile.pet.chooseFromLibrary, onPress: pickPhoto },
      { text: S.common.cancel, style: 'cancel' },
    ]);
  };

  const handleRegister = async () => {
    if (!petName.trim()) {
      Alert.alert(S.profile.pet.nameRequiredTitle, S.profile.pet.nameRequiredMessage);
      return;
    }

    setRegisterStep('loading');
    try {
      const res = await petApi.register({
        name: petName.trim(),
        species: 'dog',
        breed: petBreed.trim() || undefined,
      });
      const newPet = res.data?.data?.pet ?? res.data?.data ?? res.data;

      // Upload photo if one was selected
      if (photoUri && newPet?.id) {
        try {
          const formData = new FormData();
          const filename = photoUri.split('/').pop() || 'photo.jpg';
          const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
          const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
          formData.append('photo', {
            uri: photoUri,
            name: filename,
            type: mimeType,
          } as any);
          const photoRes = await petApi.uploadPhoto(newPet.id, formData);
          const photoUrl = photoRes.data?.data?.photo_url ?? photoRes.data?.photo_url;
          if (photoUrl) {
            newPet.photo_url = photoUrl;
          }
        } catch {
          // Photo upload failed, but pet was registered — continue
        }
      }

      setPet(newPet);
      setShowRegister(false);
    } catch (err: any) {
      Alert.alert(S.common.error, err.message || S.profile.pet.registerFailed);
      setRegisterStep('form');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.profile.pet.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
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
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.profile.pet.registerDog}</Text>
          <View style={{ width: 40 }} />
        </View>

        {registerStep === 'loading' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.secondary} />
            <Text style={styles.loadingText}>{S.profile.pet.registering}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.registerScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero */}
            <View style={styles.registerHero}>
              <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.registerPhotoCircle} />
                ) : (
                  <View style={styles.registerPawCircle}>
                    <Ionicons name="camera" size={36} color={theme.secondary} />
                    <Text style={styles.addPhotoHint}>{S.profile.pet.addPhoto}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.registerTitle}>{S.profile.pet.heroTitle}</Text>
              <Text style={styles.registerSubtitle}>
                {S.profile.pet.heroSubtitle}
              </Text>
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>{S.profile.pet.nameLabel}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={S.profile.pet.namePlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={petName}
              onChangeText={setPetName}
              maxLength={24}
            />

            {/* Breed */}
            <Text style={styles.inputLabel}>{S.profile.pet.breedLabel}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={S.profile.pet.breedPlaceholder}
              placeholderTextColor={theme.textSecondary}
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
              <Ionicons name="paw" size={20} color="#F6F4F1" />
              <Text style={styles.registerBtnText}>{S.profile.pet.registerDog}</Text>
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
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Dog</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.secondary}
            colors={[theme.secondary]}
          />
        }
      >
        {pet && <PetCard pet={pet} />}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>{S.profile.pet.tipsTitle}</Text>
          <View style={styles.tipRow}>
            <Ionicons name="footsteps-outline" size={16} color={theme.primary} />
            <Text style={styles.tipText}>{S.profile.pet.tipWalk}</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="compass-outline" size={16} color={theme.accent} />
            <Text style={styles.tipText}>{S.profile.pet.tipExplore}</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="diamond-outline" size={16} color={theme.warning} />
            <Text style={styles.tipText}>{S.profile.pet.tipItems}</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="shield-outline" size={16} color={theme.secondary} />
            <Text style={styles.tipText}>{S.profile.pet.tipSpecialization}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: theme.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.textSecondary,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(21,88,240,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(21,88,240,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  registerPhotoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.secondary,
    marginBottom: SPACING.lg,
  },
  addPhotoHint: {
    color: theme.secondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 4,
  },
  registerTitle: {
    color: theme.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginBottom: SPACING.sm,
  },
  registerSubtitle: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabel: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    color: theme.text,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  registerBtnDisabled: {
    opacity: 0.4,
  },
  registerBtnText: {
    color: '#F6F4F1',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  // Tips
  tipsCard: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tipsTitle: {
    color: theme.text,
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
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
});
