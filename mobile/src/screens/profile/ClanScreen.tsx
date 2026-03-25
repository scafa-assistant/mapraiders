import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { clanApi } from '../../services/api';
import { formatArea, formatNumber } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import type { ClanScreenProps } from '../../navigation/types';
import type { Clan } from '../../utils/types';

const API_AVATAR_BASE = 'https://api.mapraiders.com';

interface ClanMember {
  userId: string;
  username: string;
  rank: 'leader' | 'officer' | 'member';
  level?: number;
  avatarUrl?: string;
  avatar_url?: string;
  joinedAt: string;
}

interface ManualClan extends Clan {
  color?: string;
  privacy?: string;
  creator_id?: string;
  creatorId?: string;
  type?: string;
}

export default function ClanScreen({ navigation }: ClanScreenProps) {
  const user = useAuthStore((s) => s.user);
  const [manualClan, setManualClan] = useState<ManualClan | null>(null);
  const [organicClans, setOrganicClans] = useState<ManualClan[]>([]);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRole, setMyRole] = useState<'leader' | 'officer' | 'member' | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await clanApi.getMine();
      const clans = data?.data?.clans ?? data?.data ?? data ?? [];
      const clanList: ManualClan[] = Array.isArray(clans) ? clans : clans ? [clans] : [];

      const manual = clanList.find((c: ManualClan) => c.type === 'manual') ?? null;
      const organic = clanList.filter((c: ManualClan) => c.type !== 'manual');

      setManualClan(manual);
      setOrganicClans(organic);

      if (manual?.id) {
        try {
          const membersRes = await clanApi.getMembers(manual.id);
          const memberData = membersRes.data?.data?.members ?? membersRes.data?.data ?? membersRes.data ?? [];
          const memberList: ClanMember[] = Array.isArray(memberData) ? memberData : [];
          setMembers(memberList);

          const me = memberList.find((m) => m.userId === user?.id);
          setMyRole(me?.rank ?? null);
        } catch {
          setMembers([]);
          setMyRole(null);
        }
      } else {
        setMembers([]);
        setMyRole(null);
      }
    } catch {
      setManualClan(null);
      setOrganicClans([]);
      setMembers([]);
      setMyRole(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when navigating back from CreateClan
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const clanColor = manualClan?.color || THEME.primary;
  const isLeader = myRole === 'leader';
  const isOfficer = myRole === 'officer';

  // ─── Leader Actions ──────────────────────────────────────────
  const handleGearPress = () => {
    if (!manualClan) return;
    Alert.alert('Clan Optionen', undefined, [
      {
        text: 'Umbenennen',
        onPress: () => {
          Alert.prompt?.('Neuer Name', 'Gib den neuen Clan-Namen ein', (newName: string) => {
            if (newName && newName.trim().length >= 3) {
              clanApi.update(manualClan.id, { name: newName.trim() }).then(fetchData).catch(() =>
                Alert.alert('Fehler', 'Name konnte nicht geandert werden.')
              );
            }
          }) ??
            Alert.alert('Info', 'Umbenennen ist auf diesem Gerat nicht verfugbar.');
        },
      },
      {
        text: 'Beschreibung andern',
        onPress: () => {
          Alert.prompt?.('Beschreibung', 'Neue Beschreibung', (desc: string) => {
            clanApi.update(manualClan.id, { description: desc.trim() }).then(fetchData).catch(() =>
              Alert.alert('Fehler', 'Konnte nicht geandert werden.')
            );
          }) ??
            Alert.alert('Info', 'Bearbeitung ist auf diesem Gerat nicht verfugbar.');
        },
      },
      {
        text: manualClan.privacy === 'private' ? 'Offentlich machen' : 'Privat machen',
        onPress: () => {
          const newPrivacy = manualClan.privacy === 'private' ? 'public' : 'private';
          clanApi.update(manualClan.id, { privacy: newPrivacy }).then(fetchData).catch(() =>
            Alert.alert('Fehler', 'Sichtbarkeit konnte nicht geandert werden.')
          );
        },
      },
      {
        text: 'Clan auflosen',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Clan auflosen?',
            'Diese Aktion kann nicht ruckgangig gemacht werden!',
            [
              { text: 'Abbrechen', style: 'cancel' },
              {
                text: 'Auflosen',
                style: 'destructive',
                onPress: () => {
                  clanApi.disband(manualClan.id).then(fetchData).catch(() =>
                    Alert.alert('Fehler', 'Clan konnte nicht aufgelost werden.')
                  );
                },
              },
            ]
          );
        },
      },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  };

  const handleMemberLongPress = (member: ClanMember) => {
    if (!isLeader || !manualClan) return;
    if (member.userId === user?.id) return;

    const options: any[] = [];

    if (member.rank === 'member') {
      options.push({
        text: 'Zum Officer befordern',
        onPress: () =>
          clanApi.setRole(manualClan.id, member.userId, 'officer').then(fetchData).catch(() =>
            Alert.alert('Fehler', 'Rolle konnte nicht geandert werden.')
          ),
      });
    }
    if (member.rank === 'officer') {
      options.push({
        text: 'Zum Member degradieren',
        onPress: () =>
          clanApi.setRole(manualClan.id, member.userId, 'member').then(fetchData).catch(() =>
            Alert.alert('Fehler', 'Rolle konnte nicht geandert werden.')
          ),
      });
    }
    options.push({
      text: 'Kicken',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Spieler kicken?',
          `${member.username} aus dem Clan entfernen?`,
          [
            { text: 'Abbrechen', style: 'cancel' },
            {
              text: 'Kicken',
              style: 'destructive',
              onPress: () =>
                clanApi.kickMember(manualClan.id, member.userId).then(fetchData).catch(() =>
                  Alert.alert('Fehler', 'Spieler konnte nicht entfernt werden.')
                ),
            },
          ]
        );
      },
    });
    options.push({ text: 'Abbrechen', style: 'cancel' });

    Alert.alert(member.username, 'Aktion wahlen', options);
  };

  const handleLeave = () => {
    if (!manualClan) return;
    Alert.alert(
      'Clan verlassen?',
      'Mochtest du diesen Clan wirklich verlassen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Verlassen',
          style: 'destructive',
          onPress: () => {
            clanApi.leave(manualClan.id).then(fetchData).catch(() =>
              Alert.alert('Fehler', 'Clan konnte nicht verlassen werden.')
            );
          },
        },
      ]
    );
  };

  const getAvatarUrl = (member: ClanMember) => {
    const url = member.avatarUrl || member.avatar_url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_AVATAR_BASE}${url}`;
  };

  // ─── Member Row ─────────────────────────────────────────────
  const renderMember = ({ item }: { item: ClanMember }) => {
    const avatarUrl = getAvatarUrl(item);
    const isMe = item.userId === user?.id;
    const rankLabel =
      item.rank === 'leader' ? 'Leader' : item.rank === 'officer' ? 'Officer' : '';
    const rankColor =
      item.rank === 'leader' ? '#FFB800' : item.rank === 'officer' ? '#8892B0' : 'transparent';
    const rankIcon: keyof typeof Ionicons.glyphMap =
      item.rank === 'leader' ? 'star' : item.rank === 'officer' ? 'shield' : 'person-outline';

    return (
      <TouchableOpacity
        style={[styles.memberRow, isMe && styles.memberRowMe]}
        onLongPress={() => handleMemberLongPress(item)}
        activeOpacity={isLeader && !isMe ? 0.6 : 1}
        delayLongPress={400}
      >
        {/* Avatar */}
        <View style={[styles.memberAvatar, { borderColor: `${clanColor}40` }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.memberAvatarImage} />
          ) : (
            <View style={[styles.memberAvatarPlaceholder, { backgroundColor: `${clanColor}15` }]}>
              <Text style={[styles.memberAvatarInitial, { color: clanColor }]}>
                {item.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Rank badge overlay */}
          {item.rank !== 'member' && (
            <View style={[styles.memberRankOverlay, { backgroundColor: rankColor }]}>
              <Ionicons name={rankIcon} size={10} color="#0A0E17" />
            </View>
          )}
        </View>

        {/* Name + Level */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {item.username}
            {isMe ? ' (Du)' : ''}
          </Text>
          {item.level != null && (
            <Text style={styles.memberLevel}>Level {item.level}</Text>
          )}
        </View>

        {/* Role Badge */}
        {rankLabel.length > 0 && (
          <View style={[styles.roleBadge, { backgroundColor: `${rankColor}20` }]}>
            <Ionicons name={rankIcon} size={12} color={rankColor} />
            <Text style={[styles.roleBadgeText, { color: rankColor }]}>{rankLabel}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ─── No Manual Clan (empty state) ──────────────────────────
  const renderNoClan = () => (
    <View style={styles.noClanContainer}>
      <View style={styles.noClanIconCircle}>
        <Ionicons name="shield-outline" size={56} color="#1E293B" />
      </View>
      <Text style={styles.noClanTitle}>Kein Clan</Text>
      <Text style={styles.noClanSubtext}>
        Erstelle deinen eigenen Clan oder tritt einem bestehenden bei.
      </Text>

      <TouchableOpacity
        style={styles.createClanBtn}
        onPress={() => navigation.navigate('CreateClan')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={22} color="#0A0E17" />
        <Text style={styles.createClanBtnText}>Clan erstellen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.searchClanBtn}
        onPress={() => Alert.alert('Clan suchen', 'Diese Funktion kommt bald!')}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color={THEME.primary} />
        <Text style={styles.searchClanBtnText}>Clan suchen</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Manual Clan Header ────────────────────────────────────
  const renderClanHeader = () => {
    if (!manualClan) return null;
    const isPrivate = manualClan.privacy === 'private';

    return (
      <View>
        {/* Clan Card */}
        <View style={[styles.clanCard, { borderTopColor: clanColor }]}>
          {/* Leader gear icon */}
          {isLeader && (
            <TouchableOpacity style={styles.gearBtn} onPress={handleGearPress}>
              <Ionicons name="settings-outline" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
          )}

          <View style={[styles.clanShieldCircle, { borderColor: `${clanColor}40` }]}>
            <Ionicons name="shield" size={32} color={clanColor} />
          </View>

          {/* Tag badge */}
          {manualClan.tag && (
            <View style={[styles.clanTagBadge, { backgroundColor: `${clanColor}20` }]}>
              <Text style={[styles.clanTagText, { color: clanColor }]}>[{manualClan.tag}]</Text>
            </View>
          )}

          <Text style={styles.clanName}>{manualClan.name}</Text>

          {/* Member count + privacy */}
          <View style={styles.clanMetaRow}>
            <View style={styles.clanMetaItem}>
              <Ionicons name="people" size={14} color={THEME.textSecondary} />
              <Text style={styles.clanMetaText}>
                {formatNumber(manualClan.memberCount ?? members.length)} Mitglieder
              </Text>
            </View>
            <View style={styles.clanMetaDot} />
            <View style={styles.clanMetaItem}>
              <Ionicons
                name={isPrivate ? 'lock-closed' : 'globe-outline'}
                size={14}
                color={THEME.textSecondary}
              />
              <Text style={styles.clanMetaText}>
                {isPrivate ? 'Privat' : 'Offentlich'}
              </Text>
            </View>
          </View>

          {manualClan.description ? (
            <Text style={styles.clanDescription}>{manualClan.description}</Text>
          ) : null}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="people-outline" size={20} color={clanColor} />
            <Text style={styles.statValue}>{formatNumber(manualClan.memberCount ?? members.length)}</Text>
            <Text style={styles.statLabel}>Mitglieder</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="resize-outline" size={20} color={THEME.accent} />
            <Text style={styles.statValue}>{formatArea(manualClan.totalArea)}</Text>
            <Text style={styles.statLabel}>Gebiet</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up-outline" size={20} color={THEME.warning} />
            <Text style={styles.statValue}>{manualClan.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          {/* Chat Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate('ClanChat', {
                clanId: manualClan.id,
                clanName: manualClan.name,
              })
            }
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${THEME.primary}15` }]}>
              <Ionicons name="chatbubbles" size={20} color={THEME.primary} />
            </View>
            <View style={styles.actionBtnContent}>
              <Text style={styles.actionBtnTitle}>Chat</Text>
              <Text style={styles.actionBtnSubtitle}>Clan Nachrichten</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1E293B" />
          </TouchableOpacity>

          {/* Invite Button (Leader or Officer) */}
          {(isLeader || isOfficer) && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Einladung', 'Lade einen Freund per Link oder Suche ein.')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: `${THEME.accent}15` }]}>
                <Ionicons name="person-add" size={20} color={THEME.accent} />
              </View>
              <View style={styles.actionBtnContent}>
                <Text style={styles.actionBtnTitle}>Freund einladen</Text>
                <Text style={styles.actionBtnSubtitle}>Spieler rekrutieren</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Members Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="people" size={18} color={clanColor} />
          <Text style={styles.sectionTitle}>Mitglieder</Text>
          <Text style={styles.sectionCount}>{members.length}</Text>
        </View>
      </View>
    );
  };

  // ─── Organic Clans Section ─────────────────────────────────
  const renderOrganicClans = () => {
    if (organicClans.length === 0) return null;
    return (
      <View style={styles.organicSection}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="flash" size={18} color={THEME.warning} />
          <Text style={styles.sectionTitle}>Organische Clans</Text>
        </View>
        <Text style={styles.organicHint}>
          Automatisch basierend auf deiner Aktivitat gebildet
        </Text>
        {organicClans.map((clan) => (
          <TouchableOpacity
            key={clan.id}
            style={styles.organicCard}
            onPress={() =>
              navigation.navigate('ClanChat', {
                clanId: clan.id,
                clanName: clan.name,
              })
            }
            activeOpacity={0.7}
          >
            <View style={[styles.organicColorBar, { backgroundColor: clan.color || THEME.secondary }]} />
            <View style={styles.organicContent}>
              <View style={styles.organicTopRow}>
                {clan.tag && (
                  <View style={[styles.organicTag, { backgroundColor: `${THEME.secondary}20` }]}>
                    <Text style={[styles.organicTagText, { color: THEME.secondary }]}>[{clan.tag}]</Text>
                  </View>
                )}
                <Text style={styles.organicName} numberOfLines={1}>{clan.name}</Text>
              </View>
              <View style={styles.organicMeta}>
                <Ionicons name="people-outline" size={12} color={THEME.textSecondary} />
                <Text style={styles.organicMetaText}>{formatNumber(clan.memberCount)} Mitglieder</Text>
                <Text style={styles.organicMetaText}>Lv.{clan.level}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1E293B" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ─── Footer (Leave button + organic clans) ─────────────────
  const renderFooter = () => (
    <View>
      {/* Leave Button */}
      {manualClan && !isLeader && (
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.7}>
          <Ionicons name="exit-outline" size={18} color={THEME.danger} />
          <Text style={styles.leaveBtnText}>Clan verlassen</Text>
        </TouchableOpacity>
      )}
      {manualClan && isLeader && (
        <View style={styles.leaderHint}>
          <Ionicons name="information-circle-outline" size={14} color={THEME.textSecondary} />
          <Text style={styles.leaderHintText}>
            Als Leader musst du den Clan auflosen oder die Fuhrung ubertragen.
          </Text>
        </View>
      )}

      {/* Organic Clans */}
      {renderOrganicClans()}

      <View style={{ height: 100 }} />
    </View>
  );

  // ─── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mein Clan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Lade Clan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Render ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mein Clan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!manualClan ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {renderNoClan()}
              {renderOrganicClans()}
              <View style={{ height: 100 }} />
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          renderItem={renderMember}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
          ListHeaderComponent={renderClanHeader()}
          ListFooterComponent={renderFooter()}
          ListEmptyComponent={
            <View style={styles.noMembersContainer}>
              <Ionicons name="people-outline" size={24} color="#1E293B" />
              <Text style={styles.noMembersText}>Keine Mitglieder gefunden</Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: THEME.text,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // ─── No Clan Empty State ───────────────────────────
  noClanContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: SPACING.xxl,
  },
  noClanIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  noClanTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginBottom: SPACING.sm,
  },
  noClanSubtext: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
    paddingHorizontal: 20,
  },
  createClanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB800',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: SPACING.md,
  },
  createClanBtnText: {
    color: '#0A0E17',
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchClanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchClanBtnText: {
    color: THEME.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },

  // ─── Clan Card ─────────────────────────────────────
  clanCard: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    borderTopWidth: 4,
    overflow: 'hidden',
  },
  gearBtn: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  clanShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
  },
  clanTagBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  clanTagText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
    letterSpacing: 2,
  },
  clanName: {
    color: THEME.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  clanMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  clanMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clanMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2A3450',
  },
  clanMetaText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  clanDescription: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.xs,
  },

  // ─── Stats Grid ────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statValue: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },

  // ─── Action Buttons ────────────────────────────────
  actionRow: {
    gap: 8,
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionBtnContent: {
    flex: 1,
  },
  actionBtnTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  actionBtnSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },

  // ─── Section Header ────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    backgroundColor: THEME.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },

  // ─── Member Row ────────────────────────────────────
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  memberRowMe: {
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SPACING.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  memberAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  memberRankOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.surface,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  memberLevel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  roleBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  noMembersContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    gap: 8,
  },
  noMembersText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.sm,
  },

  // ─── Leave Button ──────────────────────────────────
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    backgroundColor: 'rgba(255, 71, 87, 0.08)',
    marginTop: SPACING.xl,
  },
  leaveBtnText: {
    color: THEME.danger,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  leaderHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  leaderHintText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    flex: 1,
    lineHeight: 16,
  },

  // ─── Organic Clans ────────────────────────────────
  organicSection: {
    marginTop: SPACING.xxl,
  },
  organicHint: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },
  organicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
  },
  organicColorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  organicContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  organicTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  organicTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  organicTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  organicName: {
    color: THEME.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    flex: 1,
  },
  organicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organicMetaText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
});
