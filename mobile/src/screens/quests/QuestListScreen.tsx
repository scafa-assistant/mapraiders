import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuestStore } from '../../store/questStore';
import { useLocationStore } from '../../store/locationStore';
import QuestCard from '../../components/QuestCard';
import { strings as S, t, plural } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/constants';
import { QuestListScreenProps, Quest } from '../../navigation/types';
import { useWeather } from '../../hooks/useWeather';

type FilterDifficulty = 0 | 1 | 2 | 3 | 4 | 5;
type FilterDistance = 'any' | '500' | '1000' | '2000';

export default function QuestListScreen({ navigation }: QuestListScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { nearbyQuests, isLoading, fetchNearby } = useQuestStore();
  const { currentLocation } = useLocationStore();
  const { weather } = useWeather(currentLocation?.latitude, currentLocation?.longitude);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>(0);
  const [filterDistance, setFilterDistance] = useState<FilterDistance>('any');
  const [filterWeatherActive, setFilterWeatherActive] = useState(false);

  const loadQuests = useCallback(async () => {
    if (currentLocation) {
      await fetchNearby(currentLocation.latitude, currentLocation.longitude, 5000);
    }
  }, [currentLocation]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuests();
    setRefreshing(false);
  };

  const filteredQuests = nearbyQuests.filter((quest) => {
    if (filterDifficulty > 0 && quest.difficulty !== filterDifficulty) return false;
    if (filterDistance !== 'any') {
      const maxDist = parseInt(filterDistance, 10);
      if (quest.estimatedDistance > maxDist) return false;
    }
    // Weather Active filter: only show quests that match current weather
    if (filterWeatherActive && weather) {
      const qw = (quest as any).weather_condition;
      if (!qw || qw !== weather.condition) return false;
    }
    return true;
  });

  const renderQuestCard = ({ item }: { item: Quest }) => (
    <QuestCard
      quest={item}
      onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
      distance={item.estimatedDistance}
    />
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="compass-outline" size={64} color={theme.textSecondary} />
        <Text style={styles.emptyTitle}>{S.quests.list.emptyTitle}</Text>
        <Text style={styles.emptySubtext}>
          {S.quests.list.emptySubtitle}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{S.quests.list.title}</Text>
        <Text style={styles.headerSubtitle}>
          {t(S.quests.list.foundNearby, { count: filteredQuests.length })}
        </Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: S.quests.list.filterAll, value: 0 as FilterDifficulty },
            { label: plural(1, S.quests.list.filterStarsOne, S.quests.list.filterStarsOther), value: 1 as FilterDifficulty },
            { label: plural(2, S.quests.list.filterStarsOne, S.quests.list.filterStarsOther), value: 2 as FilterDifficulty },
            { label: plural(3, S.quests.list.filterStarsOne, S.quests.list.filterStarsOther), value: 3 as FilterDifficulty },
            { label: plural(4, S.quests.list.filterStarsOne, S.quests.list.filterStarsOther), value: 4 as FilterDifficulty },
            { label: plural(5, S.quests.list.filterStarsOne, S.quests.list.filterStarsOther), value: 5 as FilterDifficulty },
          ]}
          keyExtractor={(item) => item.value.toString()}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterDifficulty === item.value && styles.filterChipActive,
              ]}
              onPress={() => setFilterDifficulty(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterDifficulty === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.filterList}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { label: S.quests.list.filterAnyDistance, value: 'any' as FilterDistance },
              { label: S.quests.list.filterUnder500m, value: '500' as FilterDistance },
              { label: S.quests.list.filterUnder1km, value: '1000' as FilterDistance },
              { label: S.quests.list.filterUnder2km, value: '2000' as FilterDistance },
            ]}
            keyExtractor={(item) => item.value}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterDistance === item.value && styles.filterChipActive,
                ]}
                onPress={() => setFilterDistance(item.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterDistance === item.value && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
          {weather && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                styles.weatherFilterChip,
                filterWeatherActive && styles.filterChipActive,
              ]}
              onPress={() => setFilterWeatherActive(!filterWeatherActive)}
            >
              <Ionicons
                name="rainy"
                size={12}
                color={filterWeatherActive ? '#1558F0' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  filterWeatherActive && styles.filterChipTextActive,
                ]}
              >
                {S.quests.list.filterWeatherActive}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quest List */}
      {isLoading && nearbyQuests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1558F0" />
          <Text style={styles.loadingText}>{S.quests.list.scanning}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuests}
          keyExtractor={(item) => item.id}
          renderItem={renderQuestCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1558F0"
              colors={['#1558F0']}
            />
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  filterBar: {
    marginBottom: 8,
    gap: 8,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(21, 88, 240, 0.15)',
    borderColor: '#1558F0',
  },
  filterChipText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#1558F0',
  },
  weatherFilterChip: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
});
