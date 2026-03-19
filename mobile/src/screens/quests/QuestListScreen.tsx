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
import { QuestListScreenProps, Quest, MovementClass } from '../../navigation/types';

const CLASS_COLORS: Record<MovementClass, string> = {
  walker: '#00D4FF',
  runner: '#FF4757',
  cyclist: '#00FF88',
  skater: '#FFB800',
  dog_walker: '#7B61FF',
  driver: '#8892B0',
  unknown: '#555E78',
};

const CLASS_ICONS: Record<MovementClass, keyof typeof Ionicons.glyphMap> = {
  walker: 'walk',
  runner: 'speedometer',
  cyclist: 'bicycle',
  skater: 'flash',
  dog_walker: 'paw',
  driver: 'car',
  unknown: 'help-circle',
};

type FilterDifficulty = 0 | 1 | 2 | 3 | 4 | 5;
type FilterDistance = 'any' | '500' | '1000' | '2000';

export default function QuestListScreen({ navigation }: QuestListScreenProps) {
  const { nearbyQuests, isLoading, fetchNearby } = useQuestStore();
  const { currentLocation } = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>(0);
  const [filterDistance, setFilterDistance] = useState<FilterDistance>('any');

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
    return true;
  });

  const renderDifficultyStars = (difficulty: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= difficulty ? 'star' : 'star-outline'}
            size={12}
            color={star <= difficulty ? '#FFB800' : '#2A3450'}
          />
        ))}
      </View>
    );
  };

  const renderQuestCard = ({ item }: { item: Quest }) => {
    const classColor = CLASS_COLORS[item.movementClass];

    return (
      <TouchableOpacity
        style={styles.questCard}
        onPress={() => navigation.navigate('QuestDetail', { questId: item.id })}
        activeOpacity={0.7}
      >
        {/* Class Icon */}
        <View style={[styles.questClassIcon, { backgroundColor: `${classColor}15` }]}>
          <Ionicons name={CLASS_ICONS[item.movementClass]} size={24} color={classColor} />
        </View>

        {/* Content */}
        <View style={styles.questCardContent}>
          <Text style={styles.questTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.questMeta}>
            {renderDifficultyStars(item.difficulty)}
            <View style={styles.metaDivider} />
            <Ionicons name="footsteps-outline" size={12} color="#8892B0" />
            <Text style={styles.metaText}>{item.stepCount} steps</Text>
            <View style={styles.metaDivider} />
            <Ionicons name="star" size={12} color="#FFB800" />
            <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
          </View>

          <View style={styles.questBottom}>
            <Text style={styles.distanceText}>
              {item.estimatedDistance < 1000
                ? `${Math.round(item.estimatedDistance)}m away`
                : `${(item.estimatedDistance / 1000).toFixed(1)}km away`}
            </Text>
            <Text style={styles.completionsText}>
              {item.completions} completed
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#2A3450" />
      </TouchableOpacity>
    );
  };

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
          contentContainerStyle={styles.filterList}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A2340',
  },
  questClassIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  questCardContent: {
    flex: 1,
  },
  questTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2A3450',
  },
  metaText: {
    color: '#8892B0',
    fontSize: 11,
  },
  questBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  completionsText: {
    color: '#555E78',
    fontSize: 11,
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
