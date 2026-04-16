# MapRaiders: Comprehensive Cross-Analysis (Kreuzanalyse) 
## Scaling & Architecture Review | April 2026

---

## EXECUTIVE SUMMARY

MapRaiders is a sophisticated GPS-based territory MMO with **35+ database entities, 32 service modules, 4 cron jobs, and 32 API routes**. The system implements complex game mechanics across multiple independent but interconnected systems:

**Game Systems:** Territories, Quests, Echos, Challenges, Artifacts, Duels, Races, Bounties, Traps, Silent Zones, Events, Pet System, Travel Routes, Clans, Leaderboards, Titles, Progression, Balance Mechanics

**Architecture:** Node.js/Express + React Native, PostgreSQL 16 + PostGIS 3.4, Redis for caching, WebSocket for real-time updates

**Critical Finding:** System is **feature-complete but has CRITICAL SCALING RISKS AND DATA LIFECYCLE VULNERABILITIES** that will cause cascading failures and data loss as user count grows beyond 10K.

---

## PART 1: GAME SYSTEMS INVENTORY

### 1.1 Core Systems (Sorted by Complexity)

| System | Service(s) | Database Tables | Cron Jobs | Primary Functions | Data Creation Rate | Lifecycle |
|--------|-----------|-----------------|-----------|------------------|-------------------|-----------|
| **Territory** | claimEngine, antiCheat, balanceService | territories, routes, territory_defenses | decayCron (territory decay) | Claim GPS routes as polygons, handle overlaps, takeovers, decay | ~100-1000 territories/day per city | Claimed → Defended → Decayed → Unclaimed |
| **Quests** | questEngine, moderationService, aiVerification | quests, quest_steps, quest_progress | decayCron (quest decay) | Create/solve multi-step location-based tasks with photo verification | ~10-50 quests/day per creator | Created → Active → Legendary (if 4.8★ + 50 solves) → Archived |
| **Echos** | questEngine (shared), aiVerification | echos, echo_likes | decayCron (echo decay) | 30-sec audio drops at GPS coords, auto-expire in 48h unless liked | ~50-500 echos/day per city | Created → Active/Decayed → Legendary (if 200+ likes) → Expired |
| **Challenges** | challengeEngine, defenseGameEngine | challenges, challenge_submissions | decayCron (challenge decay) | Template-based fitness tasks (pushups, pullups, etc) at real locations | ~5-30 challenges/day per creator | Created → Active → Legendary → Archived |
| **Duels** | duelEngine | duels | None (real-time) | 1v1 competition: speed_claim, distance, area, quiz with XP staking | ~10-100 duels/day active players | Active → Completed → Historical |
| **Clans** | clanService, manualClanService | clans, clan_members, clan_messages, clan_invitations | clanFormation (automatic organic clan detection) | Automatic (transit, district, dog_park) + manual player-created clans | ~1-5 clans/day formation | Organic/Manual → Active → Disbanded |
| **Pet System** | petEngine | pets | None (real-time XP) | Dog walker companion with rare finds, tricks, level progression | ~1 pet per dog walker | Created on first walk → Leveled → Permanent |
| **Races** | raceEngine | race_tracks, race_attempts | None (real-time) | Multi-player speed competitions on fixed routes | ~5-20 races/day per city | Created → Active → Completed |
| **Bounties** | bountyService | bounties | None (real-time) + auto-generation check | Place/claim bounties on dominant players for territory takeover reward | ~2-10 bounties/day | Created → Active → Claimed → Expired |
| **Artifacts** | artifactService | artifacts | None (real-time) | Creative content (poems, art) dropped at locations, discoverable for trophies | ~5-20 artifacts/day | Created → Active → Legendary → Permanent |
| **Travel Routes** | meetupService (travel), ratings | travel_routes, travel_spots, ratings | decayCron (legendary promotion) | Long-distance route creation/verification with stops and guides | ~1-5 routes/day per region | Created → Published → Legendary → Historical |
| **Defenses** | defenseGameEngine | territory_defenses, defense_attempts, territory_games | None (real-time) | Multi-layer slot-based defense system on territories (mini-games, quests, challenges) | ~100-500 defenses active | Created → Active → Breached → Removed |
| **Events** | eventEngine, eventEngine | game_events, loot_drops, monuments | None (admin-triggered) | Seasonal/special events: Eclipse, King of Hill, Blitz Claims, Loot Drops | ~5-10 events/month | Created → Active → Completed → Historical |
| **Traps** | trapService | traps | None (real-time) | Hidden anti-cheat/playful challenges at claim locations | ~20-100 traps/day | Created → Active → Triggered → Removed |
| **Silent Zones** | silentZoneService | silent_zones | None (real-time) | GPS-denied zones (restricted by admin), cannot be claimed | ~1-5 zones/city | Created → Active → Permanent |
| **Resonance** | resonanceService | resonance_spots | None (real-time) | Ambient lore/story points at specific coordinates | ~10-50 spots/region | Created → Permanent |
| **Leaderboards** | leaderboardService | User views (denormalized to Redis) | leaderboardCron (hourly refresh) | 8 leaderboard types (territory, questmaker, echo_master, etc) per period | Real-time Redis writes | Continuously updated |
| **Progression** | progressionEngine, notificationService | user_titles, feed_events | titleCheck (every 30min) | Level curve (1000*N^1.5), streaks, titles, XP awards | Continuous (per action) | Permanent accumulation |

### 1.2 Supporting Systems

| System | Service(s) | Tables | Purpose |
|--------|-----------|--------|---------|
| **Friend System** | friendService | friendships, friend_requests, blocked_users | Social networking |
| **Notifications** | notificationService | notifications | Push notifications with priority/batching |
| **Moderation** | moderationService | reports | Content filtering and report queue |
| **Balance Mechanics** | balanceService | Users (settings) | Newcomer protection, return bonus, consolation XP |
| **Anti-Cheat** | antiCheat | Users (flags), routes | GPS plausibility, speed consistency, sensor checks |
| **Class Detection** | classDetection | None (computed) | Walker/Runner/Cyclist/Skater/Dog_Walker/Driver inference |
| **Weather Integration** | weatherService | None (cached) | GPS-based weather bonus multipliers |
| **Aliases** | aliasService | aliases | Anonymous stealth accounts (limited features) |
| **Invites** | inviteService | invites | Referral system with first-claim bonus |
| **User Management** | playerService, users | users, refresh_tokens | Auth, profile, settings |
| **Feed** | claimEngine (triggers) | feed_events | Activity feed for social engagement |
| **Meetups** | meetupService | meetup_events, meetup_attendees, meetup_messages | Player-organized real-world events |

---

## PART 2: SERVICE DEPENDENCY GRAPH

### 2.1 Service Call Chains

```
API Request (User makes claim) 
  ↓
claimEngine.processRoute()
  ├→ classDetection.detectMovementClass()
  ├→ antiCheat.assessRoute()
  ├→ polygon conversion & PostGIS ST_Area()
  ├→ weatherService.getWeatherAtLocation()
  ├→ progressionEngine.updateStreak() + calculateClaimXp()
  ├→ clanService (clan proximity bonus check)
  ├→ balanceService (newcomer protection, consolation XP)
  ├→ petEngine.awardWalkXp() + checkRareFind()
  ├→ trapService.checkTraps()
  ├→ bountyService.checkAndClaimBounties()
  ├→ eventEngine (event bonuses)
  ├→ defenseGameEngine (check defending territories)
  ├→ notificationService (territory_attack, territory_lost)
  ├→ wsService (real-time map updates)
  ├→ leaderboardService (update Redis leaderboards)
  └→ placeMemoryService.recordEvent()
```

**Result:** Single claim triggers **15+ service calls** and updates **8+ tables**. At scale (1000 claims/hour), this cascades into Redis bottleneck.

### 2.2 Critical Cross-Dependencies

```
Territory Ownership Chain:
  territories (owner_id) → users (level, streak, XP, reputation)
  territories (polygon) → territories (overlap detection for takeovers)
  territories (owner_id, decay_level) → decayCron (daily removal)
  territories + defenses → territory_defenses → defense_attempts

Quest Chain:
  quests (creator_id) → users (reputation, level unlocks)
  quest_steps (locations) → territories (check if in owned territory)
  quest_progress (user_id) → users (progression)
  quests (status) → decayCron (daily archival)
  quests (rating) → legendary promotion (automatic if >= 4.8★)

Duel Chain:
  duels (player_a, player_b) → users (XP stakes)
  duels (territory_id) → territories (territory staking)
  duel outcomes → leaderboardService (real-time ranking updates)

Clan Chain:
  clan_members (user_id) → users (progression)
  clanFormation job → transit/district/dog_park clan detection
  clan scoring → leaderboardService (district leaderboards)
```

### 2.3 Scheduled Jobs Interdependencies

```
Daily 01:00 UTC - Streak Warning Check
  └→ notificationService.notifyStreakAtRisk() (push to at-risk users)

Daily 02:00 UTC - GPS Route TTL Cleanup
  └→ DELETE routes older than 90 days (GDPR)
  └→ Note: territories polygons kept; only raw GPS deleted

Daily 03:00 UTC - Clan Formation
  └→ clanService.detectTransitClans() (15-min transit windows)
  └→ clanService.detectDistrictClans() (geographic + leaderboard)
  └→ clanService.detectDogParkClans() (location-based)
  └→ Creates/updates clans, notifies members

Daily 04:00 UTC - Territory Decay
  └→ decayEngine.runTerritoryDecay()
  └→ For each owned territory: check last_defended
  └→ If > 1 day: phase1 decay (0→0.7, 1-7 days)
  └→ If > 7 days: phase2 decay (0.7→1.0, 7+ days)
  └→ If decay >= 1.0: SET owner_id = NULL, territory becomes unclaimed
  └→ notificationService.notifyTerritoryLost() (auto-sent)

Daily 04:15 UTC - Echo Decay
  └→ decayEngine.runEchoDecay()
  └→ UPDATE echos SET status='expired' WHERE expires_at < NOW()
  └→ Echos created at created_at → expires_at = now + 48 hours
  └→ Unless liked: extends lifetime to 30 days max

Daily 04:30 UTC - Quest Decay
  └→ decayEngine.runQuestDecay()
  └→ Archive if: (no completions in 30 days) AND (avg_rating < 4.0)
  └→ Protected: rating >= 4.0 never auto-archived

Daily 04:45 UTC - Challenge Decay
  └→ decayEngine.runChallengDecay()
  └→ Archive if: (no submissions in 30 days) AND (status != 'legendary')

Daily 05:00 UTC - Legendary Promotion
  └→ UPDATE quests SET status='legendary' WHERE (avg_rating >= 4.8 AND completions >= 50)
  └→ UPDATE echos SET status='legendary' WHERE (likes >= 200)
  └→ UPDATE travel_routes SET status='legendary' WHERE (avg_rating >= 4.8 AND ratings >= 20)

Hourly 00:00 UTC - Refresh Leaderboards
  └→ leaderboardService.refreshAllLeaderboards()
  └→ Recalculates 8 leaderboard types from denormalized views
  └→ Updates Redis sorted sets for real-time ranking

Hourly 30:00 UTC - Title Qualification Check
  └→ progressionEngine.checkTitles()
  └→ Batch check recently-active users for title unlocks
  └→ Awards: claim_N (10/100), streak_N (7/30/90/365), level_N, specialty titles
```

---

## PART 3: COMPLETE GAME SYSTEM INTERACTION MATRIX

### 3.1 Territory × Everything

| System | Creates Territory? | Uses Territory Data? | Affects Territory Owner? | Risk |
|--------|-------------------|----------------------|--------------------------|------|
| Quest | No | YES (step locations must validate against territory) | No | Query load: quest_steps × territories spatial join |
| Challenges | No | YES (validate location is real gym/park) | No | Moderate |
| Defenses | YES (defenses on territory) | YES (check territory_id) | YES (defender notified) | Defense breach can trigger takeover |
| Duels | NO (duel doesn't create territory, but CAN stake it) | YES (duel_type='territory_stake') | YES (loser loses territory) | Territory loss without decay grace period |
| Echos | No | YES (echo_radius, check territory) | No | Moderate |
| Bounties | No | YES (bounty on dominant player's territory) | YES (claimer gets territory if bounty active) | Territory transfer without normal claim flow |
| Artifacts | No | YES (artifact in territory) | No | Light |
| Clans | No | YES (clan members' territory forms district) | YES (clan scoring based on member territories) | Indirect: clan rankings affect user prestige |
| Races | No | YES (race tracks on territory) | No | Light |
| Events | No | YES (event-specific territorial rules) | YES (event modifiers on claims) | Events can boost/nerf specific regions |
| Traps | No | YES (trap at claim location) | No | Light |
| Silent Zones | YES (prevents claiming) | YES (no claims in silent zone) | No | Admin-only; blocks large regions |
| Leaderboards | No | YES (territory count is metric) | No | Real-time; doesn't affect ownership |
| Progression | No | YES (XP for claims) | No | Light |

**KEY RISK:** Territories can be lost via **6 different mechanisms**:
1. Decay (daily cron, grace period 1 day)
2. Takeover by new claim (overlap handling in claimEngine)
3. Duel loss (immediate, no grace)
4. Bounty claim (immediate)
5. Defense breach (attacker conquers territory)
6. Silent zone admin action (explicit removal)

---

### 3.2 Quest × Everything

| System | Dependency | Data Flow | Risk |
|--------|----------|-----------|------|
| Territory | Quest steps anchor to GPS; must check if in owner's territory for theme/narrative | quest_steps.location_lat/lng → ST_Contains(territory.polygon) | JOIN load at scale |
| Challenges | Quest can include challenge step (e.g., "do 10 pushups at location X") | quest_steps.type='challenge' → challenge_id FK | Moderate; tight coupling |
| Echos | Quest can require listening to echo as narrative clue | quest_steps.type='echo' → echo_id FK | Light |
| Artifacts | Quest can reward artifact discovery | quest_progress.found_artifact_id FK | Light |
| User Progression | Quest completion awards XP; counts toward level/streak | questEngine.calculateQuestXp() → progressionEngine.awardXp() | Critical; cascading XP updates |
| Leaderboards | "questmaker" leaderboard tracks completions & ratings | leaderboardService watches quest status changes | Real-time feed |
| Moderation | User-submitted quests filtered for offensive content | questEngine.validateQuestText() → moderationService | Content validation overhead |
| AI Verification | Photo-based quest steps verified with vision AI | aiVerification.verifyPhoto() for quest_steps.type='photo' | **BLOCKING CALL** — 5-30 sec per submission |

**CRITICAL:** Quest decay runs daily at 04:30 UTC. **Quests below 4.0★ with no activity in 30 days are auto-archived.** This can surprise creators if they're inactive during decay window.

---

### 3.3 Echo × Everything

| System | Interaction | Timing | Risk |
|--------|------------|--------|------|
| Territory | Echo anchored to GPS; proximity-playable only if in territory | Echo discovery triggers during territorial exploration | Light |
| Leaderboards | "echo_master" leaderboard = total echo likes | Real-time updates when echo gets liked | Light |
| Decay Cron | Echo expires at 48h unless liked; max lifetime 30 days | 04:15 UTC daily check; expired echos marked 'expired' | **MAJOR:** Creators must get likes or content vanishes |
| Legendary Status | Echo promoted to 'legendary' if >= 200 likes | 05:00 UTC daily promotion check | Permanent if qualified |
| User Progression | Echo creation = +50 XP; echo_liked = +100 XP | Immediate on creation/like | Light |
| AI Verification | Audio content *could* be filtered for hate speech (not currently implemented) | Would block echo submission if enabled | Future risk |

**MAJOR RISK:** **Echo system has 48-HOUR AUTO-DELETE.** Even if a player creates beloved content, if community doesn't like it fast, it's GONE. This is frustrating but intentional (scarcity mechanic). However, at scale with 10K players, daily echo expirations = constant churn of "lost" content.

---

### 3.4 Challenge × Everything

| System | Interaction | Risk |
|--------|------------|------|
| Defense System | Challenges can be used as territory defense layer | When defending territory, attacker must solve challenge to proceed | Tight coupling |
| User Progression | Challenge completion awards variable XP based on difficulty | XP varies (50 base + 90*difficulty) | Moderate |
| Titles | "street_beast" title = 100 fitness challenges completed | Title check every 30 min; tight coupling to user.challenge_count | Moderate |
| Leaderboards | Challenge submissions count toward "fitness" leaderboards | Real-time updates | Light |
| Decay Cron | Challenge archived if no submissions in 30 days | 04:45 UTC daily check | Moderate |
| Moderation | Challenge instructions are free text; must filter for safety | challengeEngine.validateInstructions() → moderationService | Content validation |

---

### 3.5 Duel × Everything

| System | Interaction | Impact |
|--------|------------|--------|
| Territory | duel_type='territory_stake' — loser forfeits one territory to winner | **IMMEDIATE** territory transfer (bypasses decay/grace periods) | **CRITICAL RISK** |
| User Progression | Duel outcomes affect XP; can stake XP or territory | Winning/losing duels directly modifies user.xp, user.level | High-impact |
| Leaderboards | Duel wins/losses track on "duelist" or PvP leaderboard (if enabled) | Real-time tracking | Light |

**CRITICAL RISK:** Territory-stake duels can instantly strip territorial ownership. No grace period. If player is afk and gets challenged, they lose territory on loss. This is intentional (high-stakes gameplay) but creates frustration.

---

### 3.6 Clan × Everything

| System | Interaction | Risk |
|--------|------------|------|
| Territory | Clan scoring based on member territories; clan leaderboards track "district dominance" | clanService.calculateClanScore() uses SUM(member_territories) | District conflicts; gang dynamics |
| Automatic Formation | clanFormation cron (daily 03:00 UTC) auto-creates transit/district/dog_park clans | Players unknowingly auto-joined; impacts clan_members.user_id | Engagement booster but could be surprising |
| Manual Creation | manualClanService allows player-created clans with roles/discord/leadership | clan_members.role (leader/officer/member) determines permissions | Moderate |
| User Progression | Clan membership (especially "founder") counts toward clan titles | User must be in 5 different clans to unlock title | Moderate |
| Leaderboards | "district" leaderboard is clan-based (top clans by score) | leaderboardService filters by clan_id; real-time | Light |
| Messaging | Clan can have internal messaging (clan_messages table) | Social feature; moderation required | Moderate |

**RISK:** Automatic clan formation (via cron) can create unexpected social structures. Players join transit clans without opt-in, then see themselves in a "team" with strangers. This is by design but needs UX clarity.

---

### 3.7 Pet System × Everything

| System | Interaction | Mechanics |
|--------|------------|-----------|
| Territory | Dog walker claims get 1.2× multiplier (CLASS_MULTIPLIER.dog_walker) | Direct claim value boost | Light |
| Progression | Dog walker earns separate pet XP; pet levels up independently | petEngine.awardWalkXp() tracks pet.xp, pet.level | Parallel progression |
| Rare Finds | Pet can discover rare items on walks (checkRareFind()) | Item IDs stored in artifacts or special inventory | Light |
| Titles | "trail_dog" title = 500km walked with dog | petEngine tracks cumulative distance; titleCheck verifies | Moderate |
| Leaderboards | "pet" leaderboard tracks pets by level/XP | Real-time; light impact | Light |

**RISK:** Pet XP is separate from user XP. Creating two progression trees. Also: dog walker claims get stuck at walker speeds (CLASS_MULTIPLIER only ×1.2). If you jog with your dog, you don't get runner multiplier (×2.5) even if moving at running speed. This is intentional (authenticity rule) but creates underperformance perception.

---

### 3.8 Race System × Everything

| System | Interaction | Impact |
|--------|------------|--------|
| Leaderboards | Race results create "speed_king" or "racer" leaderboard entries | Real-time ranking updates | Light |
| User Progression | Race completion awards XP based on position/time | raceEngine.calculateRaceXp() | Moderate |
| Titles | Race-themed titles could exist (e.g., "speed_runner" if >= 10 race wins) | Not currently in TITLES table; possible future addition | Not yet implemented |

---

### 3.9 Bounty × Everything

| System | Interaction | Outcome |
|--------|------------|---------|
| Territory | Bounty placed on dominant player's territory; claimer wins territory if bounty active | bountyService.claimBounty() transfers territory ownership | **Territory loss without owning the territory being claimed** |
| User Progression | Bounty claimer gets bonus XP | bountyService.calculateBountyXp() | Moderate |
| Duel System | Bounties can be created manually OR auto-generated for top-ranked players | Auto-bounty generation (daily check) | Creates organic competition |

**CRITICAL RISK:** Bounties are a **third mechanism for territory loss** (after decay and takeover). They auto-generate on dominant players (high XP/claims). At scale, top 100 players constantly targeted by bounties. Can create griefing culture.

---

### 3.10 Leaderboard × Everything

| System | Dependency | Update Mechanism |
|--------|-----------|-------------------|
| All Systems | Every territorial, social, and progression action → updates leaderboards | Real-time Redis writes + hourly full refresh | **Performance bottleneck at scale** |
| Clans | District leaderboards track top clans by territory+activity | clan_members.user_id → sum territory value | Clan incentives |
| Titles | Leaderboard position ("top 100 in city") can unlock titles | titleCheck verifies leaderboard rank | Tight coupling |

**BOTTLENECK:** Leaderboard refresh is **hourly for 8 leaderboard types × multiple periods (monthly/alltime)**. With 10K users, that's potentially **millions of Redis operations/hour**. This is mitigatable with denormalization but currently underoptimized.

---

## PART 4: DATA LIFECYCLE & DECAY MECHANISMS

### 4.1 Territory Lifecycle

```
[Created] → [Active/Defended] → [Decaying] → [Unclaimed] → [Deleted]

Created: claimEngine.processRoute() → territories INSERT
  - owner_id = userId
  - decay_level = 0.0
  - last_defended = NOW()
  - claim_value = calculated with all bonuses

Active/Defended: Any time owner claims new territory or defends existing
  - Updates last_defended = NOW()
  - Resets decay_level = 0.0
  - Notifies competing players

Decaying: After 1+ days without defense (decayCron daily 04:00 UTC)
  - 0-1 day: decay_level = 0.0 (grace period)
  - 1-7 days: decay_level = 0 → 0.7 (linear, "slow phase")
  - 7-14 days: decay_level = 0.7 → 1.0 (linear, "fast phase")
  - 14+ days: decay_level = 1.0 (unclaimed)

Unclaimed: When decay_level >= 1.0
  - SET owner_id = NULL
  - Notifies previous owner (notifyTerritoryLost)
  - Territory becomes claimable by others
  - Visual representation changes on map (no longer colored)

Deleted: (Currently never auto-deleted; permanent table entries)
  - Territories with owner_id = NULL remain in table forever
  - Creates database bloat: 10K players × 1000 avg claims each = 10M rows after 5 years
  - RISK: No cleanup strategy → eventual query performance degradation
```

**CRITICAL ISSUE #1: No Deletion Strategy for Unclaimed Territories**
- Territories accumulate indefinitely
- PostGIS spatial indexes become stale
- Overlap detection queries slow down as table grows
- Eventually: "SELECT * FROM territories WHERE ST_Intersects(...)" becomes O(N) scan

---

### 4.2 Quest Lifecycle

```
[Created] → [Active] → [Solving] → [Legendary/Archived] → [Historical]

Created: questEngine.createQuest()
  - creator_id = userId
  - status = 'active'
  - created_at = NOW()
  - quest_steps created with GPS locations

Active: Solvers attempt steps (quest_progress table)
  - quest_progress.current_step_index increments
  - AI verification (aiVerification.verifyPhoto()) blocks step completion
  - quest_progress.completed_at = NULL while in progress

Legendary: If avg_rating >= 4.8 AND total_completions >= 50
  - decayCron (daily 05:00 UTC) promotes
  - Marked as permanent "featured" content
  - Never archived

Archived: If no completions in 30 days AND avg_rating < 4.0
  - decayCron (daily 04:30 UTC) auto-archives
  - Creator receives NO NOTIFICATION of archival
  - Creator may not realize their quest was archived
  - RISK: Surprise content loss

Historical: After archival, quest remains in database forever (never deleted)
  - quest_progress records also remain
  - RISK: Database bloat from 30-day-inactive quests
```

**CRITICAL ISSUE #2: Quest Auto-Archival Without Notification**
- Creators with <4.0★ rating get archived after 30 inactive days
- No warning email or in-game notification sent
- Creator logs in 45 days later; their quest mysteriously gone
- Can damage creator confidence and player retention

---

### 4.3 Echo Lifecycle

```
[Created] → [Active/Decaying] → [Legendary] or [Expired]

Created: questEngine.dropEcho()
  - status = 'active'
  - created_at = NOW()
  - expires_at = NOW() + 48 hours
  - likes = 0

Active (Days 0-2): Echo is discoverable at GPS radius
  - Proximity-playable: within ECHO.DEFAULT_RADIUS_M (40m)
  - Players can like (echo_likes INSERT)

Liked (Days 0-2+): If liked, expires_at extends
  - Each like extends lifetime by some factor (implementation detail)
  - Max lifetime capped at DECAY.ECHO.MAX_DAYS (30)

Legendary: If likes >= 200 (checked daily 05:00 UTC)
  - status = 'legendary'
  - Never expires
  - Featured on "best echos" lists

Expired: If expires_at < NOW() at daily 04:15 UTC cron
  - status = 'expired'
  - No longer discoverable
  - RISK: Beloved content vanishes if community doesn't like fast enough
  - Can feel unfair: good echo expires because discovery window closed

Deleted: (Never auto-deleted; remains in table)
  - RISK: 365 days of daily echos × 10K players × 10 echos/player/day = 36.5B rows/year
```

**CRITICAL ISSUE #3: Echo TTL Creates Content Fragility**
- 48-hour default lifetime is very short
- Community must discover and like within 2 days or content is GONE
- This is intentional scarcity mechanic but causes data loss perception
- At scale: thousands of echos expiring daily; players see "content graveyard"

---

### 4.4 Progression & Streak Lifecycle

```
User Progression:
  xp: Monotonically increases (never decreases)
    - Earned from: claims, quests, echos, challenges, duels, titles
    - XP total → level via levelFromXp() [level = round(1000*N^1.5)]
    - Example: 1000 XP = Level 1, 2378 XP = Level 2, etc.
  
  streak_days: Increases daily if any action taken; resets if no action 24h
    - Updated by progressionEngine.updateStreak()
    - Checked daily at 01:00 UTC for "at risk" warnings
    - Can be lost overnight if player forgets to play

  reputation: Slowly increases based on user actions
    - questEngine, duelEngine, clanService all affect reputation
    - Used for content recommendation and anti-cheat scoring

Titles: Awarded by titleCheck cron every 30 minutes
  - titleCheck scans recently-active users
  - Queries like "SELECT * FROM users WHERE level >= X AND XP >= Y AND ..."
  - If conditions met: INSERT user_titles
  - Can be awarded multiple times (multiple titles per user)

Deletion: User account deletion (account.delete_account)
  - Soft delete: users.banned = true, data retained in "anonymous" form
  - Hard delete: (not currently implemented; risky for referential integrity)
  - RISK: Soft-deleted users' territories/quests/echos remain orphaned
```

**RISK:** Streak is fragile. One missed day = reset. Creates high churn from "streak anxiety" players who feel pressured to play daily.

---

### 4.5 Clan Lifecycle

```
Organic Clan (Auto-Created by clanFormation cron, 03:00 UTC daily):
  - Transit Clan: Players in same transit (bus, train) within 15-min window 3+ times/week
    - Auto-created with clan_type = 'transit'
    - Members get 10% territory score bonus
    - clan_members.user_id added automatically (no opt-in)
    - RISK: Players surprised to find themselves in clan
  
  - District Clan: Top 10 players in geographic district (H3 hex tile)
    - Auto-created with clan_type = 'district'
    - Clan score = sum(member_territories) + weighted(quests/echos)
    - Drives territorial conflict (districts fight for dominance)
  
  - Dog Park Clan: Dog walkers who visit same park 3+ times
    - Auto-created with clan_type = 'dog_park'
    - Members-only dog-walker community

Manual Clan (Player-Created):
  - manualClanService allows player creation
  - clan.clan_type = 'manual'
  - Roles: leader (can disband/kick), officer (can kick members), member (no power)
  - Clan messages can be sent (clan_messages table)
  - Clan invites sent (clan_invitations table)

Disband: Automatic or by leader
  - Organic clans disband if members drop below threshold
  - Manual clans disband if leader disbands explicitly
  - clan_members records remain (orphaned) unless explicitly deleted
  - RISK: Orphaned clan_members entries after disband

Deletion: (Never completely deleted)
  - Clan records remain with end_date or is_active = false
  - clan_members records remain
  - Creates referential integrity risk if code assumes active membership
```

**RISK:** Automatic clan formation can be disorienting. No opt-in process. Players discover themselves in "district clans" with 9 competitors who are now their "team." Social dynamics unclear.

---

## PART 5: CRON JOB DEPENDENCY & EXECUTION RISKS

### 5.1 Daily Cron Chain (04:00-05:00 UTC)

```
01:00 UTC - Streak Warning Check (5 min, 500 users batch)
  └─ SELECT users WHERE streak_days > 0 AND last_active BETWEEN 23-24h ago
  └─ notifyStreakAtRisk() → push notifications
  └─ Risk: If notification service fails, users unaware of streak loss

02:00 UTC - GPS Route TTL Cleanup (GDPR: delete routes >90 days)
  └─ DELETE FROM routes WHERE created_at < NOW() - INTERVAL '90 days'
  └─ Risk: GDPR compliance; ensures data minimization
  └─ NOTE: territories polygons kept; only raw GPS deleted
  └─ This means ST_Area calculations for old territories impossible if re-queried

03:00 UTC - Clan Formation (15-30 min depending on player count)
  └─ detectTransitClans() - scan all routes from last 7 days
    └─ SELECT routes grouped by user, look for 15-min transit overlaps
    └─ JOIN users to find clusters
    └─ INSERT new clans, UPDATE clan_members
    └─ Risk: Heavy DB load; transit_clans table can explode if transit-heavy city
  
  └─ detectDistrictClans() - scan top 10 players per district
    └─ Use H3 hex-tiling to divide city
    └─ SELECT top 10 players by territory_value per tile
    └─ Create/update clan_type='district' for each tile
    └─ Risk: Complex query; slow on cities with many tiles
  
  └─ detectDogParkClans() - scan dog walkers at same locations
    └─ SELECT pet_walks grouped by location, count visits
    └─ Cluster dog walkers who visit same spot 3+ times
    └─ Create clan_type='dog_park'
    └─ Risk: Light compared to transit/district

04:00 UTC - Territory Decay (20-60 min depending on territory count)
  └─ SELECT territories WHERE owner_id IS NOT NULL
  └─ For each territory:
    └─ days_since = NOW() - last_defended
    └─ Calculate decay_level based on days_since (2-phase curve)
    └─ If decay_level >= 1.0: SET owner_id = NULL, notifyTerritoryLost()
    └─ Risk: BLOCKING operation; locks territories table
    └─ Risk: If 100K territories, this can take 2-5 minutes
    └─ During this time, claim operations queue up
    └─ If decay_cron crashes → territories don't decay → game breaks (no territory churn)

04:15 UTC - Echo Decay (5-10 min)
  └─ UPDATE echos SET status='expired' WHERE expires_at < NOW() AND status='active'
  └─ Risk: Fast compared to territory decay
  └─ But: can silence beloved content if community didn't like fast enough

04:30 UTC - Quest Decay (10-20 min)
  └─ UPDATE quests SET status='archived' 
     WHERE status='active' 
     AND last_completion < NOW() - INTERVAL '30 days'
     AND avg_rating < 4.0
  └─ Risk: Creator surprise; no notification sent
  └─ Risk: If 10K quests, 30% inactive = 3K archived quests
  └─ Risk: If query is slow, affects quest_progress JOINs during decay window

04:45 UTC - Challenge Decay (5-10 min)
  └─ UPDATE challenges SET status='archived' 
     WHERE status='active' 
     AND last_submission < NOW() - INTERVAL '30 days'
  └─ Risk: Same as quest decay

05:00 UTC - Legendary Promotion Check (5-10 min)
  └─ UPDATE quests SET status='legendary' 
     WHERE status='active' AND avg_rating >= 4.8 AND total_completions >= 50
  └─ UPDATE echos SET status='legendary' WHERE likes >= 200
  └─ UPDATE travel_routes SET status='legendary' WHERE avg_rating >= 4.8 AND ratings >= 20
  └─ Risk: Light; mostly SELECT then UPDATE
```

**SEQUENTIAL BOTTLENECK:** Crons run sequentially 01:00-05:00 UTC. If any one fails:
- Territory decay fails → territories never decay → top players keep territory forever → game becomes "who logged in first"
- Clan formation fails → organic clans not detected → social dynamics break
- Quest/challenge decay fails → inactive low-quality content accumulates → database bloat → queries slow

**SINGLE POINT OF FAILURE:** No rollback or compensation if cron crashes mid-way. Example:
- Territory decay starts at 04:00 UTC
- After 2 minutes, processes 50K territories
- Server crashes
- Remaining 50K territories not decayed
- Re-run cron same day? No, it's 04:10 UTC and cron doesn't run again until tomorrow 04:00

---

### 5.2 Hourly Leaderboard Refresh

```
Every Hour :00 - Refresh Leaderboards (10-30 min)
  └─ leaderboardService.refreshAllLeaderboards()
  └─ For each leaderboard type (8 types: territory, questmaker, echo_master, etc.):
    └─ For each period (2 periods: monthly, alltime):
      └─ Calculate top 100 players for that leaderboard/period
      └─ Update Redis sorted set: leaderboard:{type}:{period}
      └─ DELETE old entries, INSERT new
  └─ Risk: With 8 types × 2 periods × 100 top entries = 1,600 Redis operations/hour
  └─ At 10K users, that's manageable
  └─ At 100K users: need to optimize to computed/cached views

Risk if leaderboard refresh fails:
  - Stale leaderboards for 1+ hours
  - Users see wrong rankings
  - Competitive players frustrated
  - Titles awarded based on stale data (titleCheck runs at 30 min past hour)
```

---

### 5.3 Cron Failure Cascades

```
Scenario: Territory Decay cron crashes mid-way (04:00 UTC)

Timeline:
  04:00 - Territory decay starts, processes 50K/100K territories
  04:02 - Server OOM, PostgreSQL connection timeout, cron aborts
  04:02 - Remaining 50K territories NOT decayed
  04:04 - Next scheduled event: Echo decay (scheduled for 04:15)
  04:15 - Echo decay runs (unaffected by territory failure)
  05:00 - Legendary promotion runs (unaffected)
  06:00 - Leaderboard refresh runs (unaffected)
  
  Result: Territory decay doesn't run again until tomorrow 04:00 UTC
           For 24 hours: 50K territories in limbo (not decayed)
           Players expect decay to happen; instead territories stay owned
           Dominant players keep advantage uncontested for extra day

Scenario 2: Cron fails completely (e.g., server down 04:00-04:30 UTC)
  
  Result: All 4 cron jobs (territory, echo, quest, challenge decay) skip
           Orphaned territories never decay
           Low-quality quests/challenges/echos never archived
           Database grows with stale data
           Next 24 hours: game behaves as if decay never happens
           Players who rely on territorial churn are disadvantaged
```

**MITIGATION NEEDED:**
- Cron status monitoring + alerts
- Idempotent cron operations (safe to re-run mid-way)
- Compensating jobs if cron fails
- Distributed cron (multiple servers; if one crashes, another runs)

---

## PART 6: CRITICAL SCALING RISKS & DATA LOSS VULNERABILITIES

### 6.1 Territory Claim Bottleneck

**Current Architecture:**
1. User completes GPS route → claimEngine.processRoute()
2. Convert route to polygon (client-side smoothing + server validation)
3. Calculate area with PostGIS ST_Area()
4. **Query: SELECT territories WHERE ST_Intersects(new_polygon, existing_polygon)**
   - This query runs against ALL territories in city to find overlaps
   - With spatial index: O(log N) in best case
   - Without index or with poor index: O(N) scan
5. For each overlapping territory:
   - Calculate overlap percentage (ST_Intersection)
   - Deduct from old owner, add to new owner
   - Update both territory records
6. Award XP, update leaderboards, send notifications (15+ service calls)

**At Scale (1M users, 10M territories in major cities):**
- ST_Intersects query becomes slow if index is stale
- Overlap calculation (ST_Intersection for each overlap) is expensive
- 15+ service calls per claim × 1000 claims/hour = 15,000 service calls/hour
- Leaderboard updates create Redis write storm
- **Risk:** Claim processing takes 5-10 seconds per user; user queue builds up

**Mitigation:**
- Tile-based claiming: divide city into H3 hex tiles; only check claims in adjacent tiles
- Async claim processing: claim request enqueued, processed in background, user notified when complete
- Materialized views: pre-compute overlaps instead of calculating on-the-fly
- Currently: **NOT implemented** — synchronous processing

---

### 6.2 Echo Expiration Churn

**Problem:**
- Each echo created at time T expires at T + 48 hours
- If liked, extends to T + 30 days max
- 10K players × 10 echos/day = 100K echos created daily
- Without likes: 100K echos expire 48h later
- With likes (say 10% rate): 90K expire at 48h, 10K expire at 30 days

**At Daily Decay (04:15 UTC):**
- UPDATE echos SET status='expired' WHERE expires_at < NOW()
- With 100K expirations/day: 365M rows examined per year
- Table grows indefinitely: 365M / 365 = 1M new echo rows per day in city
- After 1 year: 365M rows
- Query performance degrades: SELECT for expired echos becomes slower

**Risk:** No cleanup strategy for expired echos. Table bloat. Query slowdown.

**Mitigation:**
- Hard delete expired echos after 60 days of expiration
- Archive to separate "historical_echos" table
- Currently: **NOT implemented** — expired echos remain in table forever

---

### 6.3 Quest/Challenge Auto-Archival Without Notification

**Problem:**
- Quest with <4.0★ rating AND no activity 30 days → auto-archived at 04:30 UTC
- Challenge with no submissions 30 days → auto-archived at 04:45 UTC
- Creator receives NO notification
- Creator discovers quest missing when they log in days/weeks later
- Creates negative surprise, damages player confidence

**Example:** Alice creates a quest on Day 1. Gets 3.8★ rating (not great). No one plays it for 30 days. On Day 30 at 04:30 UTC, quest archived. Alice logs in on Day 35, quest gone. No email. No in-game alert. Alice confused: "Did I delete it? Did a mod remove it?"

**Risk:** Silent data loss. Players feel cheated.

**Mitigation:**
- Send notification 7 days before auto-archival: "Your quest declining in popularity; will be archived in 7 days if rating stays <4.0"
- Allow creator to "boost" quest if it's at-risk (re-promote to front of discovery)
- Currently: **NOT implemented** — creators get 0 warning

---

### 6.4 Defense Game Complexity & Race Conditions

**Defense System:**
- Attacker attempts to conquer territory
- Territory has up to N defense layers (N = min(5, floor(area_m2 / 1000) + 1))
- Defenses can be: mini-game, challenge, quest, echo (defender chooses)
- Attacker must beat ALL defenses to conquer
- If attacker fails any defense: they lose, territory stays defended

**Race Condition Risk:**
- Territory defense is added via territory_defenses table
- Attacker queries territory_defenses to see what they must beat
- Between query and submission, defender adds a NEW defense layer
- Attacker was expecting 3 defenses, now there are 4
- Attacker can't adapt; attack fails due to "surprise" defense

**Risk:** Unfair gameplay; attacker feels cheated. Defender can grief by adding defenses mid-attack.

**Mitigation:**
- Lock territory during attack: set flag "under_attack" = true
- Freeze defense layers until attack completes (success or fail)
- Release lock after N minutes (attack timed out)
- Currently: **NOT implemented** — no attack lock

---

### 6.5 Duel Territory Stake Loss (No Grace Period)

**Problem:**
- Duel with duel_type='territory_stake'
- Loser forfeits territory to winner
- **Transfer happens immediately; no grace period like normal decay**

**Scenario:** Player is AFK. Gets challenged to duel (challenge sent via notification). Doesn't respond in time. Auto-loses. Territory instantly transferred to challenger. Player wakes up, territory gone. No warning. No decay grace period.

**Risk:** Feels unfair. High-stakes PvP can create grief-play culture.

**Mitigation:**
- Require explicit duel acceptance (not auto-lose on timeout)
- Add cooldown: can't duel same player more than once per day
- Territory stake duels cost XP to initiate (anti-griefing cost)
- Currently: **Partially implemented** (duel acceptance required; unclear if stake cooldown exists)

---

### 6.6 Bounty Auto-Generation on Dominant Players

**Problem:**
- Bounty system auto-generates bounties on players with high territory count
- bountyService.checkAutoBounty() runs daily (unclear time; not in decayCron)
- Auto-bounty: any player can claim bounty to steal dominant player's territory

**Scenario:** Player reaches "top 10 territories" status. Suddenly they have bounties on them. Players queue up to steal their territory. Player can defend with defense layers, but coordinated attacks can overwhelm. Top 100 players constantly under siege.

**Risk:** "King of the Hill" become unplayable; constant pressure drives away engaged players.

**Mitigation:**
- Bounty tax: placing bounty costs XP (limits spam)
- Cooldown: can't place bounty on same player more than once per week
- Bounty expiration: bounty expires if not claimed in 7 days
- Currently: **Partially implemented** (auto-bounty exists; unclear cooldown/tax details)

---

### 6.7 Leaderboard as Implicit Rank Currency

**Problem:**
- Users care deeply about leaderboard position
- Leaderboard update is only hourly (not real-time)
- Between 04:00-05:00 UTC, user might not see their latest claims reflected
- Users think they're #5 on leaderboard, but actually #6 (not updated yet)
- Creates confusion; affects competitive gameplay

**Risk:** Leaderboards become stale; competitive players frustrated by lag.

**Mitigation:**
- Real-time leaderboard updates (every claim updates Redis)
- Still batch-recalculate hourly for consistency, but show real-time to users
- Currently: **Partially implemented** (hourly refresh; unclear if real-time writes exist)

---

### 6.8 No Data Backup/Recovery Strategy

**Problem:**
- No mention of automated backups in codebase (checked schema.sql, constants, cron jobs)
- If PostgreSQL fails, data is lost
- If Redis fails, leaderboards are lost (can be recalculated from DB)
- If backup strategy exists, it's external (AWS RDS backups, separate infra)

**Risk:** Database corruption or data center failure = complete loss.

**Mitigation:**
- (Assumed external): Automated daily backups to S3 or separate region
- Point-in-time recovery
- Regular backup restoration tests
- Currently: **Unclear** (not visible in code; likely in infrastructure config)

---

### 6.9 Notification Delivery Reliability

**Problem:**
- Push notifications sent via notificationService.sendNotification()
- Uses push_tokens from users table
- No mention of notification retry logic or dead-letter queue
- If push service fails, users don't get notified of territory loss, streak warning, etc.

**Risk:** Silent failures. Users unaware of game-state changes. Disengagement.

**Example:**
- Territory decay happens (territory owner_id = NULL)
- System tries to send notifyTerritoryLost() push
- Push service (Firebase, APNs) is down
- Notification silently fails
- User logs in 12 hours later, territory gone, unaware of when it happened

**Mitigation:**
- Notification retry queue with exponential backoff
- Dead-letter queue for failed notifications
- Alternative delivery: email if push fails
- Currently: **Unclear** (notificationService implementation not fully reviewed)

---

### 6.10 Lack of Data Minimization Post-Decay

**Problem:**
- GPS route data deleted after 90 days (GDPR compliance)
- But: territories persist forever even after owner_id = NULL
- Even after 2 years, a claimed-then-unclaimed territory still occupies disk space
- No TTL on unclaimed territories

**Risk:** Database bloat. Table grows indefinitely.

**Mitigation:**
- Hard delete unclaimed territories older than 1 year
- Archive historical territories to separate table if audit trail needed
- Currently: **NOT implemented** — unclaimed territories never deleted

---

## PART 7: DATABASE TABLE DEPENDENCIES & REFERENTIAL INTEGRITY

### 7.1 Foreign Key Relationships

```
users
  ├─ refresh_tokens (user_id FK)
  ├─ territories (owner_id FK, nullable → unclaimed territories)
  ├─ routes (user_id FK → who created route)
  ├─ quests (creator_id FK → who created quest)
  ├─ quest_progress (user_id FK → who's solving quest)
  ├─ challenges (creator_id FK)
  ├─ challenge_submissions (user_id FK)
  ├─ echos (creator_id FK)
  ├─ pets (owner_id FK)
  ├─ duels (player_a_id, player_b_id FK)
  ├─ clans (created_by FK for manual clans)
  ├─ clan_members (user_id FK)
  ├─ notifications (user_id FK)
  ├─ feed_events (actor_id FK)
  ├─ user_titles (user_id FK)
  ├─ artifacts (creator_id FK)
  ├─ bounties (creator_id, target_id FK)
  ├─ aliases (user_id FK)
  ├─ traps (creator_id FK)
  ├─ friendships (user_a_id, user_b_id FK)
  └─ ... and more

territories
  ├─ users (owner_id FK, nullable)
  ├─ defenses (territory_id FK)
  ├─ duels (territory_id FK for territory_stake duels)
  ├─ bounties (territory_id FK)
  └─ ratings (territory_id FK, if territory ratings exist)

quests
  ├─ users (creator_id FK)
  ├─ quest_steps (quest_id FK)
  ├─ ratings (quest_id FK)
  └─ feed_events (refers to quest)

challenges
  ├─ users (creator_id FK)
  ├─ challenge_submissions (challenge_id FK)
  └─ defenses (can reference challenge)

defenses (territory_defenses table)
  ├─ territories (territory_id FK)
  ├─ challenges (challenge_id FK, nullable)
  ├─ quests (quest_id FK, nullable)
  └─ echos (echo_id FK, nullable)
```

**Cascading Delete Risks:**
- If user deleted, quests/challenges/echos orphaned (or deleted if CASCADE)
- If territory deleted, defenses orphaned
- If quest deleted, quest_progress records orphaned

**Currently:** Most FKs have ON DELETE CASCADE (dangerous) or ON DELETE SET NULL (safer).

---

### 7.2 Denormalization Points

```
users table (de-normalized stats):
  - level (calculated from XP; should be VIEW)
  - xp (denormalized from claim XP + quest XP + echo XP + ...)
  - streak_days (calculated from last_active; should be materialized view)
  - reputation (calculated from ratings; should be cached)

territories table (de-normalized):
  - claim_value (calculated at claim-time; never updated; becomes stale)
  - decay_level (calculated nightly but stored)

leaderboards (stored in Redis, not DB):
  - Territory leaderboard
  - Questmaker leaderboard
  - Echo master leaderboard
  - Etc. (8 types)
  - **Vulnerability:** If Redis wipes, leaderboards gone until hourly refresh recalculates

Risk: Denormalization creates consistency issues. If XP updates but level not recalculated, user sees stale level. Should use materialized views or triggers.
```

---

## PART 8: FEEDBACK LOOPS & GAME BALANCE VULNERABILITIES

### 8.1 Positive Feedback Loops (Snowballing)

```
1. Territory Accumulation Loop:
   User claims territory X
   → claim_value high (new_for_player bonus)
   → XP awarded high
   → User levels up
   → Unlocks architect/legend features
   → Can create better quests/challenges
   → Creates better content
   → Attracts solvers
   → Gets higher reputation
   → Next claims get reputation_boost bonus
   → Snowballs

   Mitigation: balanceService.newcomer_protection (first 7 days) reduces multipliers for new users
               ANTI_GRIND_RETURNS reduces repeat claims (1.0, 0.5, 0.25, 0.1)
               Seems balanced but…

2. Leaderboard Momentum:
   Top player claims territory
   → Gets on leaderboard
   → Visibility increases (players see them)
   → Gets challenged by other players (duels, bounties)
   → Wins some, loses some
   → But: visibility means more people know about them
   → Attracts talented rivals
   → Can escalate arms race
   → Top player either becomes unstoppable or gets griefed

3. Clan Momentum:
   District clan forms with top 10 players
   → Clan territory score = sum(member territories)
   → Clan becomes powerful
   → Attracts more good players (want to join winning clan)
   → Clan grows stronger
   → Dominant district becomes even more dominant

   Mitigation: Not clear if clan can grow beyond top 10; if not, locked in
               If can grow, then positive feedback unchecked
```

**Risk:** Early leaders stay leaders forever. New players can't catch up.

**Mitigation (Partial):**
- Decay prevents territory hoarding (must defend every 7 days or lose)
- Bounties target top players (artificially pressure them)
- Balance service reduces new-player disadvantage

---

### 8.2 Negative Feedback Loops (Catch-Up Mechanics)

```
1. Bounty Auto-Generation:
   Player reaches top territory count
   → bountyService.checkAutoBounty() triggers
   → Auto-bounties placed on player
   → Other players try to claim territories
   → Player loses territories despite defending
   → Falls off leaderboard
   → Bounties expire (no longer top)
   → Can climb again
   → Feedback loop re-engages

   This creates "tournament mode" dynamics where top position is temporary. Good.

2. Streak Reset:
   Player on 30-day streak
   → Misses one day
   → streak_days reset to 0
   → Lost all streak_multiplier (×2.0)
   → Next claim worth 2× less value
   → Player frustrated
   → Might quit game
   → Stops playing entirely

   Risk: Streak reset creates harsh penalty. One missed day = catastrophic loss.
   Mitigation: notifyStreakAtRisk (daily 01:00 UTC) warns players at 23-24h mark
               Not enough: player unaware or asleep when warned

3. Territory Loss Cascade:
   Player loses territory (via decay, duel, bounty, or takeover)
   → Territory becomes unclaimed
   → Someone else claims it
   → Original player's claim_value count decreases
   → Level might not change (cumulative XP never decreases)
   → But: new claims in region are harder (novelty_bonus gone)
   → Territory regaining requires more XP per claim
   → Player falls behind

   Risk: Variance in territory can cause snowball defeat if unlucky.
```

---

### 8.3 Unintended Dominance Patterns

```
Class Multiplier Imbalance:
  Runner: ×2.5
  Skater: ×2.0
  Cyclist: ×1.3
  Dog_Walker: ×1.2
  Walker: ×1.0
  Driver: ×0.3

  Problem: Runner gets 2.5× a walker's territory value for same area.
           City of commuters (mostly walkers) becomes dominated by runner(s).
           Runner can hold leaderboard indefinitely.

  Mitigation: Weather bonus (×2.0 in storms) and time bonus (×1.5 at night) help walkers
              But: weaker than class multiplier
              Should: scale by effort×distance not just class

Weather Bonus Cascades:
  Bad weather day (storm, ×2.0 bonus)
  → All claims worth 2× normal
  → Top players grind extra claims that day
  → Lock in 2× value territory
  → Weather clears
  → New claims worth normal
  → Weather players ahead permanently

  Mitigation: Decay eventually rebalances
              But: in short term (days), weather-grinders get advantage

Novelty Bonus Exploitation:
  First-ever claim on street: ×2.0 multiplier
  New-for-player claim: ×1.3 multiplier
  Repeat claim: ×1.0 multiplier

  Problem: Only 1 player per street gets ×2.0 (first to claim).
           In crowded city, all streets claimed fast (days).
           New players joining later find all streets as ×1.0.
           Creates permanent disadvantage for late starters.

  Mitigation: ANTI_GRIND_RETURNS (same route: 1.0, 0.5, 0.25, 0.1) limits repeat farming
              But: first-mover advantage still exists
```

---

## PART 9: SINGLE POINTS OF FAILURE

### 9.1 Critical Infrastructure

| Component | Failure Mode | Impact |
|-----------|-------------|--------|
| **PostgreSQL** | Database down | No claims, quests, echos; app unavailable |
| **PostGIS Extension** | Spatial index corruption | Claim calculation fails; users can't submit routes |
| **Redis** | Cache down | Leaderboards stale; real-time features slow; possible service degradation if not fault-tolerant |
| **Cron Scheduler** | Crashes at 04:00 UTC | Territory decay skipped; no new churn; game breaks next day |
| **Leaderboard Job (hourly)** | Crashes | Leaderboards stale; wrong rankings shown; titles awarded on stale data |
| **Title Check Job (every 30min)** | Crashes | Titles not awarded; players frustrated |
| **Push Notification Service** | Down (Firebase/APNs) | Users unaware of territory loss, streaks at risk, etc. |
| **WebSocket Server** | Down | Real-time map updates fail; players see stale map |
| **Weather API** | Down | Weather bonus calculation fails or uses cached stale data |
| **File Storage (Echos, Photos)** | Down | Echo audio unavailable; quest photo verification fails |

---

### 9.2 Design-Level Single Points of Failure

```
1. Decay Cron is Daily:
   If territory decay fails once, game imbalance for 24 hours.
   Solution: Run decay every 6 hours (or continuous background job).

2. Legendary Promotion is Daily:
   If promotion fails, high-quality content never becomes legendary.
   Solution: Run every 6 hours or continuous.

3. Leaderboard Refresh is Hourly:
   If refresh fails, users see stale rankings.
   Solution: Real-time updates + hourly full recalculation.

4. Clan Formation is Daily:
   If fails, organic clans not detected; social dynamics break.
   Solution: Run every 12 hours or continuous background job.

5. No Compensation Mechanism:
   If cron task fails, there's no automatic retry or compensation.
   A failed territory decay doesn't re-run later; it's just skipped.
   Solution: Idempotent jobs + retry queue.
```

---

## PART 10: SCALING RECOMMENDATIONS

### 10.1 Before Scaling to 100K Users (Now Blocking)

```
1. CRITICAL: Add Cron Monitoring
   - Track cron execution time and success/failure
   - Alert if any cron takes >5 minutes (resource constraint)
   - Alert if cron fails (missing run)
   - Implement: CloudWatch + SNS, or Datadog

2. CRITICAL: Implement Idempotent Cron Jobs
   - Territory decay should track "last_decay_run" timestamp
   - Echo decay should track "last_echo_decay" timestamp
   - If cron runs twice (retry), no double-processing
   - Implement: Distributed lock (Redlock pattern) or version IDs

3. CRITICAL: Add Data Lifecycle Cleanup
   - Delete/archive expired echos after 60 days of expiry (not forever)
   - Delete unclaimed territories older than 1 year
   - Archive historical quest_progress to separate table
   - Implement: Separate daily cleanup job (after 05:00 UTC)

4. HIGH: Add Quest/Challenge Auto-Archival Notifications
   - 7 days before archival, notify creator
   - Option to "boost" quest (re-promote, get another 30-day window)
   - Prevents surprise content loss

5. HIGH: Implement Real-Time Leaderboard Updates
   - Each claim immediately updates Redis
   - Hourly full recalculation for consistency
   - Users see claim count update in real-time

6. HIGH: Add Tile-Based Territory Claiming
   - Divide city into H3 hex tiles (resolution 9)
   - When claiming, only check overlaps in current + adjacent tiles
   - Reduces ST_Intersects query cost from O(N) to O(1)
   - Implement: Add h3_tile column to territories, spatial index on tile

7. HIGH: Implement Async Claim Processing
   - Claim request enqueued to job queue (Bull, RabbitMQ)
   - Server immediately responds "claim processing"
   - Background job calculates overlap, updates leaderboards, sends notifications
   - User notified when complete
   - Prevents claim blocking other requests

8. MEDIUM: Add Territory Stake Duel Cooldown
   - Can't place territory-stake duel on same opponent more than 1/week
   - Reduces grief-play potential

9. MEDIUM: Implement Defense Lock During Attack
   - When attack initiated, territory marked "under_attack"
   - Defender can't add new defenses during attack
   - Prevents race condition
   - Implement: Add attack_status, attack_start_time columns to territory_defenses

10. MEDIUM: Improve Balance for Newcomers
    - Extend newcomer_protection from 7 days to 14 days
    - Increase consolation_xp during first 30 days
    - Reduce difficulty of first 10 quests available to player
```

---

### 10.2 Before Scaling to 1M Users (Next Phase)

```
1. Sharding by Geographic Region
   - Data center per continent
   - Each region owns its territories/quests/etc
   - Cross-region travel routes require federation
   - Prevents global database from becoming bottleneck

2. Event Sourcing for Territory Ownership
   - Current model: territories table with owner_id (mutable)
   - Problem: hard to track ownership history, disputes
   - Solution: Create territorial_claims table (immutable log)
   - Each claim = new event (created, transferred, lost)
   - Reconstruct current state from event log
   - Enables: "show me who owned this territory over time"

3. Materialized Views for Progression
   - user_stats view: level, xp, streak, reputation (computed)
   - Currently: stored in users table (denormalized, stale)
   - Solution: Materialized view, refresh every 1 minute
   - Enables: always-accurate stats without denormalization

4. Kafka/Event Bus for Cross-Service Communication
   - Currently: services call each other directly
   - Problem: tight coupling, cascading failures
   - Solution: Publish events to event bus (Kafka)
   - claimEngine publishes "claim_created" event
   - leaderboardService, notificationService, clanService subscribe
   - Enables: decoupled async processing, replay-ability

5. Read Replicas for Leaderboards
   - Write leaderboards to primary DB
   - Read from read replica for leaderboard queries
   - Reduces lock contention on primary

6. Archive Old Data
   - Completed duels older than 6 months → archive table
   - Expired echos older than 60 days → archive table
   - Archived quests older than 1 year → archive table
   - Keeps hot tables small, improves query speed

7. Implement Batch Processing for High-Load Operations
   - Claim XP awards: batch 1000 at a time (not per-claim)
   - Leaderboard updates: batch 100 at a time
   - Reduce transaction overhead

8. Add Circuit Breakers for External Services
   - Weather API down? Use cached data, don't fail claims
   - Push notification service down? Queue notifications, retry later
   - Prevent cascade failures
```

---

## PART 11: SUMMARY TABLE — SYSTEM HEALTH SCORECARD

| Aspect | Score | Risk | Priority |
|--------|-------|------|----------|
| **Architecture Clarity** | 8/10 | Low | Low |
| **Code Organization** | 8/10 | Low | Low |
| **Feature Completeness** | 9/10 | Low | N/A |
| **Scaling to 10K Users** | 6/10 | **HIGH** | **CRITICAL** |
| **Scaling to 100K Users** | 3/10 | **CRITICAL** | **CRITICAL** |
| **Data Lifecycle Management** | 4/10 | **HIGH** | **HIGH** |
| **Error Recovery** | 5/10 | **HIGH** | **HIGH** |
| **Notification Reliability** | 6/10 | **MEDIUM** | **HIGH** |
| **Database Performance** | 7/10 | **MEDIUM** | **HIGH** |
| **Cron Job Reliability** | 5/10 | **HIGH** | **CRITICAL** |
| **Anti-Cheat Robustness** | 8/10 | **MEDIUM** | **MEDIUM** |
| **Balance Fairness** | 7/10 | **MEDIUM** | **MEDIUM** |

---

## PART 12: FINAL SUMMARY & ACTIONABLE NEXT STEPS

### Key Findings

1. **System is feature-rich and well-architected at small scale (1-10K users)**
   - Clear service boundaries
   - Explicit game mechanics from GDD
   - Multiple interacting systems create depth

2. **System has multiple critical scaling blockers (10K-100K+ users)**
   - Cron job failures = game broken for 24 hours
   - Territory decay accumulates; table grows without cleanup
   - No leaderboard real-time updates; laggy rankings
   - Echo/Quest auto-delete without warning = bad UX
   - Defense race conditions enable grief

3. **Single points of failure exist**
   - PostgreSQL down = app down (no read replica mentioned)
   - Cron failure = no recovery
   - Redis failure = leaderboards gone

4. **Data loss risks**
   - Unclaimed territories never deleted (table bloat)
   - Expired echos remain forever
   - Archived quests remain forever
   - No backup/recovery mentioned in code (assumed external)

5. **Game balance issues**
   - Runner class (×2.5) dominates walker (×1.0) in mixed-class cities
   - First-mover advantage permanent (novelty bonus only once)
   - Bounty system targets top players (good), but auto-generation unclear
   - Streak reset too harsh (one missed day = massive penalty)

### Immediate Actions (Pre-Launch if <1000 Users)

```
[ ] 1. Implement cron monitoring + alerting (CloudWatch/Datadog)
[ ] 2. Add data cleanup job (delete old echos/territories/archived quests)
[ ] 3. Add quest auto-archival notifications (7-day warning)
[ ] 4. Implement H3 tile-based territory claiming (reduce overlap query load)
[ ] 5. Add territorial_claims audit log (track ownership history)
[ ] 6. Implement defense lock during attack (prevent race condition)
[ ] 7. Add territory-stake duel cooldown (1/week per opponent)
[ ] 8. Extend newcomer protection to 14 days
[ ] 9. Add cron idempotency (Redlock pattern)
[ ] 10. Setup automated database backups + restoration tests
```

### Phase 1 (1-10K Users)

```
[ ] 1. Real-time leaderboard updates (Redis write-through)
[ ] 2. Async claim processing (job queue)
[ ] 3. Event bus for service communication (Kafka/RabbitMQ)
[ ] 4. Read replicas for leaderboards
[ ] 5. Materialized views for user stats
[ ] 6. Archive old duels/quests (table cleanup)
[ ] 7. Improve push notification reliability (retry queue)
[ ] 8. Load testing up to 10K concurrent claims/day
```

### Phase 2 (10-100K Users)

```
[ ] 1. Geographic sharding (per-region databases)
[ ] 2. Event sourcing for territories
[ ] 3. Distributed cron (multiple servers)
[ ] 4. Circuit breakers for external APIs
[ ] 5. Batch processing for high-load operations
[ ] 6. Advanced monitoring (metrics, dashboards)
[ ] 7. Chaos engineering tests (failure injection)
```

---

**Document prepared:** 2026-04-16
**Codebase version:** MapRaiders v1.0 (pre-launch)
**Scope:** 35 database entities, 32 services, 4 cron jobs, 32 API routes
