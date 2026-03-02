# Public Contact Page Design & Implementation Details

## Overview
The public contact page is implemented as the **Locations & Contact** screen (`locations.tsx`). It combines contact information, training locations, and social media links in a single, comprehensive view.

## File Structure

### Main Screen
- **File**: `src/app/(public)/locations.tsx`
- **Route**: `/(public)/locations`
- **Purpose**: Displays contact information, training locations, and social media links

### Components Used
1. **ContactCard** - `src/components/public/ContactCard.tsx`
2. **LocationCard** - `src/components/public/LocationCard.tsx`
3. **SocialLinksCard** - `src/components/public/SocialLinksCard.tsx`
4. **PublicHeader** - `src/components/public/shared/PublicHeader.tsx`

---

## Screen Layout & Structure

### 1. Header Section
```tsx
<View style={styles.header}>
  <Text variant="headlineSmall" style={styles.title}>
    Locations & Contact
  </Text>
  <Text variant="bodyMedium" style={styles.subtitle}>
    Reach us easily wherever we are training.
  </Text>
</View>
```

**Design Details:**
- **Title**: "Locations & Contact" (Headline Small, 24px, Bold, #111827)
- **Subtitle**: "Reach us easily wherever we are training." (Body Medium, 15px, #6B7280)
- **Alignment**: Centered
- **Padding**: Top (safe area + 8px), Horizontal 20px, Bottom 24px

### 2. Contact Information Card
**Component**: `ContactCard`

**Features:**
- Logo display (120x120px, rounded corners)
- Three contact action buttons:
  1. **Call Now** - Phone icon (Ionicons), displays phone number
  2. **Email Us** - Google icon (FontAwesome), displays email address
  3. **WhatsApp Chat** - WhatsApp icon (FontAwesome), opens WhatsApp

**Button Design:**
- Rounded pill shape (borderRadius: 50)
- Background: #F7F7F7
- Border: 1px solid #DDDDDD
- Padding: 18px vertical, 20px horizontal
- Icon + Text on left, contact info/chevron on right

**Contact Information (Hardcoded):**
```typescript
const CONTACT_INFO = {
  phone: '+91 9916836930',
  email: 'shotokankaratehubli@gmail.com',
  whatsapp: 'https://wa.me/919916836930',
}
```

### 3. Training Locations Section
**Header:**
- Icon: Map marker multiple (MaterialCommunityIcons, 28px, #7B2CBF)
- Title: "Training Locations" (Title Large, 20px, Bold)

**Location Cards** (using `LocationCard` component):
Each location displays:
- Location name with map marker icon
- Full address (multi-line)
- "Open in Google Maps" button
- Training schedule with calendar-clock icons

**Locations Data:**
```typescript
const LOCATIONS = [
  {
    id: '1',
    name: 'Main Dojo',
    address: 'Shree Siddeshwara Kailasa Mantapa\nHosamath P.B Road, Unkal\nHubballi-31, Karnataka 580031',
    mapsUrl: 'https://www.google.co.in/maps/place/...',
    schedule: [
      { days: 'Monday, Wednesday, Friday', time: 'Morning: 6:00-7:30 AM' },
      { days: 'Monday, Wednesday, Friday', time: 'Evening: 6:00-7:30 PM' },
    ],
  },
  {
    id: '2',
    name: 'Secondary Dojo',
    address: 'Dr. B.R. Ambedkar Samudaya Bhavana\nTeachers Colony, Sai Nagar, Unkal\nHubballi-31, Karnataka 580031',
    mapsUrl: 'https://maps.app.goo.gl/...',
    schedule: [
      { days: 'Tuesday, Thursday', time: 'Morning: 6:00-7:30 AM' },
      { days: 'Tuesday, Thursday', time: 'Evening: 6:00-7:30 PM' },
      { days: 'Saturday', time: 'Evening: 6:00-7:30 PM' },
      { days: 'Sunday', time: 'Morning: 6:00-8:00 AM' },
    ],
  },
]
```

### 4. Social Media Section
**Component**: `SocialLinksCard`

**Features:**
- Header: "Follow Us" with share icon
- List of social media platforms with icons and colors

**Social Links Data:**
```typescript
const SOCIAL_LINKS = [
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/@rajeshyaragatti1699',
    icon: 'youtube',
    color: '#FF0000',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/shotokankaratedoassociat/',
    icon: 'instagram',
    color: '#E4405F',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://www.facebook.com/COACH.R.B.YARAGATTI',
    icon: 'facebook',
    color: '#1877F2',
  },
]
```

### 5. Footer Section
```tsx
<View style={styles.footer}>
  <Text variant="bodyMedium" style={styles.footerName}>
    Shotokan Karate-Do Association Youth Sports Club
  </Text>
  <Text variant="bodySmall" style={styles.footerLocation}>
    Hubballi, Karnataka, India
  </Text>
</View>
```

---

## Component Details

### ContactCard Component

**File**: `src/components/public/ContactCard.tsx`

**Props Interface:**
```typescript
interface ContactCardProps {
  logoUrl?: string | null
  phone: string
  email: string
  whatsappUrl: string
  onPhonePress: () => void
  onEmailPress: () => void
  onWhatsAppPress: () => void
}
```

**Structure:**
1. **Logo Section**
   - Displays logo image (120x120px) or placeholder with karate icon
   - Centered, margin bottom: 32px

2. **Contact Buttons Container**
   - Gap: 16px between buttons
   - Three buttons in vertical stack

**Button Styles:**
- **Container**: 
  - FlexDirection: row
  - JustifyContent: space-between
  - Padding: 18px vertical, 20px horizontal
  - Background: #F7F7F7
  - BorderRadius: 50 (pill shape)
  - Border: 1px solid #DDDDDD

- **Button Content** (left side):
  - Icon (20px) + Text (16px, font-weight 600, #111827)
  - Gap: 12px

- **Button Subtext** (right side):
  - Contact info (13px, #6B7280)
  - Right-aligned

**Card Styles:**
- BorderRadius: 18px
- Background: #FFFFFF
- Elevation: 2
- Shadow: rgba(0,0,0,0.08)
- Padding: 24px
- MarginBottom: 24px

---

### LocationCard Component

**File**: `src/components/public/LocationCard.tsx`

**Props Interface:**
```typescript
interface LocationCardProps {
  name: string
  address: string
  mapsUrl: string
  schedule: ScheduleItem[]
  onMapsPress: (url: string) => void
}

interface ScheduleItem {
  days: string
  time: string
}
```

**Structure:**
1. **Location Header**
   - Map marker icon (24px, #7B2CBF)
   - Location name (Title Large, 20px, Bold, #111827)
   - Gap: 12px, MarginBottom: 16px

2. **Address Container**
   - Address text (Body Medium, 15px, #374151)
   - LineHeight: 24px
   - MarginBottom: 20px

3. **Google Maps Button**
   - Google Maps icon (24px, #4285F4)
   - "Open in Google Maps" text (Body Medium, 15px, #7B2CBF, font-weight 600)
   - Chevron right icon (20px, #7B2CBF)
   - Same pill button style as contact buttons
   - MarginBottom: 20px

4. **Training Schedule**
   - Section title: "Training Schedule:" (Label Medium, 14px, Bold, #111827)
   - Border top: 1px solid #E5E5E5
   - PaddingTop: 20px
   - Each schedule item:
     - Calendar-clock icon (16px, #6B7280)
     - Days text (Body Small, 13px, Bold, #111827)
     - Time text (Body Small, 13px, #6B7280)
     - MarginBottom: 14px

**Card Styles:**
- Same as ContactCard (borderRadius: 18px, white background, elevation 2)
- MarginBottom: 20px

---

### SocialLinksCard Component

**File**: `src/components/public/SocialLinksCard.tsx`

**Props Interface:**
```typescript
interface SocialLinksCardProps {
  socialLinks: SocialLink[]
  onSocialPress: (url: string) => void
}

interface SocialLink {
  id: string
  name: string
  url: string
  icon: string
  color: string
}
```

**Structure:**
1. **Section Header**
   - Share icon (24px, #7B2CBF)
   - "Follow Us" title (Title Large, 20px, Bold, #111827)
   - Gap: 12px, MarginBottom: 20px

2. **Social Links List**
   - Gap: 4px between items
   - Each item:
     - Platform icon (FontAwesome, 24px, custom color)
     - Platform name (Body Large, 16px, font-weight 600, #111827)
     - Chevron right icon (20px, #9CA3AF)
     - Padding: 16px vertical, 4px horizontal

**Card Styles:**
- Same as ContactCard
- MarginBottom: 24px

---

## Styling Details

### Screen Container
```typescript
container: {
  flex: 1,
  backgroundColor: '#FFFFFF',
}
```

### Header Styles
```typescript
header: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 20,
  paddingBottom: 24,
  paddingTop: insets.top + 8,
}
title: {
  fontWeight: '700',
  color: '#111827',
  textAlign: 'center',
  marginBottom: 8,
  fontSize: 24,
}
subtitle: {
  color: '#6B7280',
  textAlign: 'center',
  fontSize: 15,
  lineHeight: 22,
}
```

### ScrollView
```typescript
scrollView: {
  flex: 1,
}
scrollContent: {
  padding: 20,
  paddingBottom: 40,
}
```

### Locations Header
```typescript
locationsHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginBottom: 20,
  marginTop: 8,
  paddingHorizontal: 4,
}
locationsTitle: {
  fontWeight: '700',
  color: '#111827',
  fontSize: 20,
}
```

### Footer Styles
```typescript
footer: {
  alignItems: 'center',
  paddingVertical: 32,
  paddingHorizontal: 20,
}
footerName: {
  color: '#111827',
  fontWeight: '600',
  textAlign: 'center',
  marginBottom: 6,
  fontSize: 15,
}
footerLocation: {
  color: '#6B7280',
  textAlign: 'center',
  fontSize: 13,
}
```

---

## Functionality

### Action Handlers

1. **Phone Call**
```typescript
const handlePhonePress = () => {
  Linking.openURL(`tel:${CONTACT_INFO.phone}`)
}
```

2. **Email**
```typescript
const handleEmailPress = () => {
  Linking.openURL(`mailto:${CONTACT_INFO.email}`)
}
```

3. **WhatsApp**
```typescript
const handleWhatsAppPress = () => {
  Linking.openURL(CONTACT_INFO.whatsapp)
}
```

4. **Google Maps**
```typescript
const handleMapsPress = (url: string) => {
  Linking.openURL(url)
}
```

5. **Social Media**
```typescript
const handleSocialPress = (url: string) => {
  Linking.openURL(url)
}
```

---

## Data Flow

1. **Public Data Hook**: Uses `usePublicData()` to fetch:
   - Logo URL
   - Branch name (for header)

2. **Hardcoded Data**:
   - Contact information (phone, email, WhatsApp)
   - Training locations (addresses, maps URLs, schedules)
   - Social media links

3. **Logo Source**: Fetched from Supabase storage via `data.logoUrl`

---

## Color Scheme

- **Primary Purple**: #7B2CBF (icons, accents)
- **Text Primary**: #111827 (headings, important text)
- **Text Secondary**: #6B7280 (subtext, descriptions)
- **Background**: #FFFFFF (main background)
- **Card Background**: #F7F7F7 (button backgrounds)
- **Border**: #DDDDDD (button borders)
- **Divider**: #E5E5E5 (schedule section divider)
- **Social Colors**:
  - YouTube: #FF0000
  - Instagram: #E4405F
  - Facebook: #1877F2
  - WhatsApp: #25D366
  - Google: #EA4335
  - Google Maps: #4285F4

---

## Typography

- **Headline Small**: 24px, Bold (700)
- **Title Large**: 20px, Bold (700)
- **Body Large**: 16px, Semi-bold (600)
- **Body Medium**: 15px, Regular
- **Body Small**: 13px, Regular
- **Label Medium**: 14px, Semi-bold (600)

---

## Spacing & Layout

- **Card Padding**: 24px
- **Card Margin Bottom**: 20-24px
- **Section Gap**: 16px (buttons), 4px (social links)
- **Button Padding**: 18px vertical, 20px horizontal
- **Screen Padding**: 20px horizontal
- **Footer Padding**: 32px vertical

---

## Accessibility

All interactive elements include:
- `accessibilityLabel` for screen readers
- `accessibilityRole="button"` for buttons
- Proper touch targets (minimum 44x44px)

---

## Loading State

```tsx
if (loading) {
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color="#7B2CBF" />
      <Text variant="bodyMedium" style={styles.loadingText}>
        Loading...
      </Text>
    </View>
  )
}
```

---

## Navigation

- **Route**: `/(public)/locations`
- **Access**: From public navigation menu
- **Header**: Uses `PublicHeader` component with logo and dojo name

---

## Dependencies

- `react-native` - Core components
- `react-native-paper` - UI components (Text, Card, ActivityIndicator)
- `@expo/vector-icons` - Icons (MaterialCommunityIcons, FontAwesome, Ionicons)
- `expo-router` - Navigation
- `react-native-safe-area-context` - Safe area handling
- `react-native` Linking API - Opening external URLs

---

## Summary

The public contact page is a comprehensive screen that combines:
1. **Contact Information** - Phone, email, WhatsApp with actionable buttons
2. **Training Locations** - Multiple dojo locations with addresses, maps links, and schedules
3. **Social Media** - Links to YouTube, Instagram, and Facebook
4. **Footer** - Organization name and location

All components use a consistent design language with:
- White cards with subtle shadows
- Pill-shaped buttons with icons
- Clear typography hierarchy
- Proper spacing and padding
- Smooth user interactions with Linking API



