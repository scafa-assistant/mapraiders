import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTeachOnMount } from '../../store/teachStore';
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
import { useTheme } from '../../hooks/useTheme';
import { Theme, SPACING, FONT_SIZE, RADIUS } from '../../utils/constants';
import { clanApi } from '../../services/api';
import { formatArea, formatNumber } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import { strings as S, t } from '../../i18n';
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
  useTeachOnMount('clan');
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

  const clanColor = manualClan?.color || theme.primary;
  const isLeader = myRole === 'leader';
  const isOfficer = myRole === 'officer';

  // ─── Leader Actions ──────────────────────────────────────────
  const handleGearPress = () => {
    if (!manualClan) return;
    Alert.alert(S.profile.clan.optionsTitle, undefined, [
      {
        text: S.profile.clan.rename,
        onPress: () => {
          Alert.prompt?.(S.profile.clan.renameTitle, S.profile.clan.renamePrompt, (newName: string) => {
            if (newName && newName.trim().length >= 3) {
              clanApi.update(manualClan.id, { name: newName.trim() }).then(fetchData).catch(() =>
                Alert.alert(S.common.error, S.profile.clan.renameFailed)
              );
            }
          }) ??
            Alert.alert(S.profile.clan.infoTitle, S.profile.clan.renameUnavailable);
        },
      },
      {
        text: S.profile.clan.editDescription,
        onPress: () => {
          Alert.prompt?.(S.profile.clan.descriptionTitle, S.profile.clan.descriptionPrompt, (desc: string) => {
            clanApi.update(manualClan.id, { description: desc.trim() }).then(fetchData).catch(() =>
              Alert.alert(S.common.error, S.profile.clan.updateFailed)
            );
          }) ??
            Alert.alert(S.profile.clan.infoTitle, S.profile.clan.editUnavailable);
        },
      },
      {
        text: manualClan.privacy === 'private' ? S.profile.clan.makePublic : S.profile.clan.makePrivate,
        onPress: () => {
          const newPrivacy = manualClan.privacy === 'private' ? 'public' : 'private';
          clanApi.update(manualClan.id, { privacy: newPrivacy }).then(fetchData).catch(() =>
            Alert.alert(S.common.error, S.profile.clan.privacyChangeFailed)
          );
        },
      },
      {
        text: S.profile.clan.disband,
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            S.profile.clan.disbandConfirmTitle,
            S.profile.clan.disbandConfirmMessage,
            [
              { text: S.common.cancel, style: 'cancel' },
              {
                text: S.profile.clan.disbandConfirmButton,
                style: 'destructive',
                onPress: () => {
                  clanApi.disband(manualClan.id).then(fetchData).catch(() =>
                    Alert.alert(S.common.error, S.profile.clan.disbandFailed)
                  );
                },
              },
            ]
          );
        },
      },
      { text: S.common.cancel, style: 'cancel' },
    ]);
  };

  const handleMemberLongPress = (member: ClanMember) => {
    if (!isLeader || !manualClan) return;
    if (member.userId === user?.id) return;

    const options: any[] = [];

    if (member.rank === 'member') {
      options.push({
        text: S.profile.clan.promoteToOfficer,
        onPress: () =>
          clanApi.setRole(manualClan.id, member.userId, 'officer').then(fetchData).catch(() =>
            Alert.alert(S.common.error, S.profile.clan.roleChangeFailed)
          ),
      });
    }
    if (member.rank === 'officer') {
      options.push({
        text: S.profile.clan.demoteToMember,
        onPress: () =>
          clanApi.setRole(manualClan.id, member.userId, 'member').then(fetchData).catch(() =>
            Alert.alert(S.common.error, S.profile.clan.roleChangeFailed)
          ),
      });
    }
    options.push({
      text: S.profile.clan.kick,
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          S.profile.clan.kickConfirmTitle,
          t(S.profile.clan.kickConfirmMessage, { username: member.username }),
          [
            { text: S.common.cancel, style: 'cancel' },
            {
              text: S.profile.clan.kick,
              style: 'destructive',
              onPress: () =>
                clanApi.kickMember(manualClan.id, member.userId).then(fetchData).catch(() =>
                  Alert.alert(S.common.error, S.profile.clan.kickFailed)
                ),
            },
          ]
        );
      },
    });
    options.push({ text: S.common.cancel, style: 'cancel' });

    Alert.alert(member.username, S.profile.clan.chooseAction, options);
  };

  const handleLeave = () => {
    if (!manualClan) return;
    Alert.alert(
      S.profile.clan.leaveConfirmTitle,
      S.profile.clan.leaveConfirmMessage,
      [
        { text: S.common.cancel, style: 'cancel' },
        {
          text: S.profile.clan.leaveConfirmButton,
          style: 'destructive',
          onPress: () => {
            clanApi.leave(manualClan.id).then(fetchData).catch(() =>
              Alert.alert(S.common.error, S.profile.clan.leaveFailed)
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
      item.rank === 'leader' ? S.profile.clan.rankLeader : item.rank === 'officer' ? S.profile.clan.rankOfficer : '';
    const rankColor =
      item.rank === 'leader' ? '#F5A623' : item.rank === 'officer' ? theme.textSecondary : 'transparent';
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
              <Ionicons name={rankIcon} size={10} color="#F6F4F1" />
            </View>
          )}
        </View>

        {/* Name + Level */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {item.username}
            {isMe ? ` ${S.profile.clan.youSuffix}` : ''}
          </Text>
          {item.level != null && (
            <Text style={styles.memberLevel}>{t(S.profile.clan.levelLabel, { level: item.level })}</Text>
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
        <Ionicons name="shield-outline" size={56} color={theme.border} />
      </View>
      <Text style={styles.noClanTitle}>{S.profile.clan.noClanTitle}</Text>
      <Text style={styles.noClanSubtext}>
        {S.profile.clan.noClanSubtext}
      </Text>

      <TouchableOpacity
        style={styles.createClanBtn}
        onPress={() => navigation.navigate('CreateClan')}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={22} color="#F6F4F1" />
        <Text style={styles.createClanBtnText}>{S.profile.clan.createClan}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.searchClanBtn}
        onPress={() => Alert.alert(S.profile.clan.searchClan, S.profile.clan.searchComingSoon)}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color={theme.primary} />
        <Text style={styles.searchClanBtnText}>{S.profile.clan.searchClan}</Text>
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
              <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
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
              <Ionicons name="people" size={14} color={theme.textSecondary} />
              <Text style={styles.clanMetaText}>
                {t(S.profile.clan.membersCount, { count: formatNumber(manualClan.memberCount ?? members.length) })}
              </Text>
            </View>
            <View style={styles.clanMetaDot} />
            <View style={styles.clanMetaItem}>
              <Ionicons
                name={isPrivate ? 'lock-closed' : 'globe-outline'}
                size={14}
                color={theme.textSecondary}
              />
              <Text style={styles.clanMetaText}>
                {isPrivate ? S.profile.clan.private : S.profile.clan.public}
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
            <Text style={styles.statLabel}>{S.profile.clan.members}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="resize-outline" size={20} color={theme.accent} />
            <Text style={styles.statValue}>{formatArea(manualClan.totalArea)}</Text>
            <Text style={styles.statLabel}>{S.profile.clan.territory}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up-outline" size={20} color={theme.warning} />
            <Text style={styles.statValue}>{manualClan.level}</Text>
            <Text style={styles.statLabel}>{S.profile.clan.level}</Text>
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
            <View style={[styles.actionIconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Ionicons name="chatbubbles" size={20} color={theme.primary} />
            </View>
            <View style={styles.actionBtnContent}>
              <Text style={styles.actionBtnTitle}>{S.profile.clan.chat}</Text>
              <Text style={styles.actionBtnSubtitle}>{S.profile.clan.chatSubtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.border} />
          </TouchableOpacity>

          {/* Invite Button (Leader or Officer) */}
          {(isLeader || isOfficer) && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert(S.profile.clan.inviteTitle, S.profile.clan.inviteMessage)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: `${theme.accent}15` }]}>
                <Ionicons name="person-add" size={20} color={theme.accent} />
              </View>
              <View style={styles.actionBtnContent}>
                <Text style={styles.actionBtnTitle}>{S.profile.clan.inviteFriend}</Text>
                <Text style={styles.actionBtnSubtitle}>{S.profile.clan.inviteFriendSubtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.border} />
            </TouchableOpacity>
          )}
        </View>

        {/* Members Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="people" size={18} color={clanColor} />
          <Text style={styles.sectionTitle}>{S.profile.clan.members}</Text>
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
          <Ionicons name="flash" size={18} color={theme.warning} />
          <Text style={styles.sectionTitle}>{S.profile.clan.organicClans}</Text>
        </View>
        <Text style={styles.organicHint}>
          {S.profile.clan.organicClansHint}
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
            <View style={[styles.organicColorBar, { backgroundColor: clan.color || theme.secondary }]} />
            <View style={styles.organicContent}>
              <View style={styles.organicTopRow}>
                {clan.tag && (
                  <View style={[styles.organicTag, { backgroundColor: `${theme.secondary}20` }]}>
                    <Text style={[styles.organicTagText, { color: theme.secondary }]}>[{clan.tag}]</Text>
                  </View>
                )}
                <Text style={styles.organicName} numberOfLines={1}>{clan.name}</Text>
              </View>
              <View style={styles.organicMeta}>
                <Ionicons name="people-outline" size={12} color={theme.textSecondary} />
                <Text style={styles.organicMetaText}>{t(S.profile.clan.membersCount, { count: formatNumber(clan.memberCount) })}</Text>
                <Text style={styles.organicMetaText}>{t(S.profile.clan.levelShort, { level: clan.level })}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.border} />
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
          <Ionicons name="exit-outline" size={18} color={theme.danger} />
          <Text style={styles.leaveBtnText}>{S.profile.clan.leaveClan}</Text>
        </TouchableOpacity>
      )}
      {manualClan && isLeader && (
        <View style={styles.leaderHint}>
          <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.leaderHintText}>
            {S.profile.clan.leaderHint}
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
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{S.profile.clan.title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{S.profile.clan.loadingClan}</Text>
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
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.profile.clan.title}</Text>
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
              tintColor={theme.primary}
              colors={[theme.primary]}
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
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListHeaderComponent={renderClanHeader()}
          ListFooterComponent={renderFooter()}
          ListEmptyComponent={
            <View style={styles.noMembersContainer}>
              <Ionicons name="people-outline" size={24} color={theme.border} />
              <Text style={styles.noMembersText}>{S.profile.clan.noMembersFound}</Text>
            </View>
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
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    color: theme.text,
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
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noClanTitle: {
    color: theme.text,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginBottom: SPACING.sm,
  },
  noClanSubtext: {
    color: theme.textSecondary,
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
    backgroundColor: '#F5A623',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: SPACING.md,
  },
  createClanBtnText: {
    color: '#F6F4F1',
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchClanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchClanBtnText: {
    color: theme.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },

  // ─── Clan Card ─────────────────────────────────────
  clanCard: {
    backgroundColor: theme.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: 'rgba(20,18,16,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  clanShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(20,18,16,0.06)',
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
    color: theme.text,
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
    backgroundColor: theme.textSecondary,
  },
  clanMetaText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  clanDescription: {
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  actionBtnSubtitle: {
    color: theme.textSecondary,
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
    color: theme.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    backgroundColor: theme.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },

  // ─── Member Row ────────────────────────────────────
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  memberRowMe: {
    borderColor: 'rgba(21,88,240,0.2)',
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
    borderColor: theme.surface,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: theme.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  memberLevel: {
    color: theme.textSecondary,
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
    color: theme.textSecondary,
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
    borderColor: 'rgba(215,38,61,0.3)',
    backgroundColor: 'rgba(215,38,61,0.08)',
    marginTop: SPACING.xl,
  },
  leaveBtnText: {
    color: theme.danger,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  leaderHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  leaderHintText: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    flex: 1,
    lineHeight: 16,
  },

  // ─── Organic Clans ────────────────────────────────
  organicSection: {
    marginTop: SPACING.xxl,
  },
  organicHint: {
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },
  organicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
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
    color: theme.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
});
