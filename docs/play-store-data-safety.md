# MapRaiders — Google Play Data Safety Section

Dieses Dokument dient als Vorlage zum Ausfuellen des Data Safety Formulars in der Google Play Console.

## Data collected

### Location
- **Approximate location**: Yes (collected)
- **Precise location**: Yes (collected)
- Purpose: App functionality (territory claiming, quest proximity, echo discovery)
- Required: Yes (core game mechanic)
- Shared with third parties: No (only Google Maps receives IP for map tiles)
- Processing: Stored on our servers (Hetzner EU), deleted after 90 days (detailed routes), aggregated territory data kept until account deletion

### Personal info
- **Email address**: Yes (collected at registration)
- Purpose: Account management, authentication
- Required: Yes
- Shared: No

- **Name/Username**: Yes (collected at registration)
- Purpose: App functionality (public game identity)
- Required: Yes
- Shared: Visible to other players (public profile)

### Photos and videos
- **Photos**: Yes (collected, user-initiated only)
- Purpose: App functionality (quest verification, echo content)
- Required: No (optional feature)
- Shared: Visible to other players

### Audio
- **Voice or sound recordings**: Yes (collected, user-initiated only)
- Purpose: App functionality (audio echoes)
- Required: No (optional feature)
- Shared: Visible to other players

### App activity
- **In-app search history**: No
- **Other user-generated content**: Yes (quests, challenges, echos, travel routes)
- Purpose: App functionality
- Shared: Visible to other players

### Device or other IDs
- **Device push token**: Yes (collected)
- Purpose: Push notifications (Expo Push Service)
- Required: No (notifications are optional)
- Shared: Expo Inc. (USA) as push delivery service

## Data NOT collected
- Financial info (no payments)
- Contacts
- SMS/Call logs
- Health/Fitness data
- Web browsing history
- Advertising ID
- Cookies

## Data sharing
- **Google LLC (USA)**: Map tile requests (IP address only) — EU-US Data Privacy Framework
- **Expo/650 Industries (USA)**: Push notification tokens — Standard Contractual Clauses
- No data sold to third parties
- No data shared for advertising

## Security practices
- Data encrypted in transit (TLS/HTTPS)
- Passwords hashed (bcrypt, cost factor 12)
- JWT authentication with token rotation
- Servers in EU (Hetzner, Germany)

## Data deletion
- Users can request deletion via: App Settings > Delete Account
- All personal data deleted within 30 days
- Contact: contact@mapraiders.com
