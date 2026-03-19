import React, { useEffect, useState, useCallback } from 'react';
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
import { QuestListScreenProps, Quest } from '../../navigation/types';
import { useWeather } from '../../hooks/useWeather';

type FilterDifficulty = 0 | 1 | 2 | 3 | 4 | 5;
type FilterDistance = 'any' | '500' | '1000' | '2000';

export default function QuestListScreen({ navigation }: QuestListScreenProps) {
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
        <Ionicons name="compass-outline" size={64} color="#2A3450" />
        <Text style={styles.emptyTitle}>No quests nearby</Text>
        <Text style={styles.emptySubtext}>
          Be the first to create a quest in this area!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quests</Text>
        <Text style={styles.headerSubtitle}>
          {filteredQuests.length} found nearby
        </Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'All', value: 0 as FilterDifficulty },
            { label: '1 Star', value: 1 as FilterDifficulty },
            { label: '2 Stars', value: 2 as FilterDifficulty },
            { label: '3 Stars', value: 3 as FilterDifficulty },
            { label: '4 Stars', value: 4 as FilterDifficulty },
            { label: '5 Stars', value: 5 as FilterDifficulty },
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
              { label: 'Any distance', value: 'any' as FilterDistance },
              { label: '< 500m', value: '500' as FilterDistance },
              { label: '< 1km', value: '1000' as FilterDistance },
              { label: '< 2km', value: '2000' as FilterDistance },
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
                color={filterWeatherActive ? '#00D4FF' : '#8892B0'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  filterWeatherActive && styles.filterChipTextActive,
                ]}
              >
                Weather Active
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quest List */}
      {isLoading && nearbyQuests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D4FF" />
          <Text style={styles.loadingText}>Scanning for quests...</Text>
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
              tintColor="#00D4FF"
              colors={['#00D4FF']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8892B0',
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
    backgroundColor: '#141B2D',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00D4FF',
  },
  filterChipText: {
    color: '#8892B0',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#00D4FF',
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
    color: '#8892B0',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555E78',
    fontSize: 13,
    marginTop: 6,
  },
});
