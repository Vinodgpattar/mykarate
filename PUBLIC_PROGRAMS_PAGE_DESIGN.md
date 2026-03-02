# Public Programs Page Design & Implementation Details

## Overview
The public programs page displays all available karate training programs offered by the dojo. It provides a clean, card-based layout showcasing different program types with icons and descriptions.

## File Structure

### Main Screen
- **File**: `src/app/(public)/programs.tsx`
- **Route**: `/(public)/programs`
- **Purpose**: Display all available training programs

### Section Component
- **File**: `src/components/public/sections/ProgramsSection.tsx`
- **Purpose**: Reusable programs section with expandable cards (used on homepage)

### Components Used
1. **PublicHeader** - `src/components/public/shared/PublicHeader.tsx`
2. **Card** - React Native Paper component
3. **MaterialCommunityIcons** - Icon library
4. **TouchableOpacity** - For interactive cards (in ProgramsSection)

---

## Screen Layout & Structure

### 1. Header Section
```tsx
<View style={styles.header}>
  <Text variant="titleLarge" style={styles.title}>
    Our Programs
  </Text>
</View>
```

**Design Details:**
- **Title**: "Our Programs" (Title Large, Bold, #1A1A1A)
- **Padding**: Top (safe area + 8px), Horizontal 16px, Bottom 16px
- **Background**: #FFF8E7 (cream/beige background)

### 2. Programs List
**Layout**: Vertical scrollable list of program cards

**Program Cards Structure:**
Each program is displayed in a card with:
- Icon (32px, purple #7B2CBF)
- Program name (Title Medium, Bold, #1A1A1A)
- Description (Body Medium, #6B7280)

---

## Program Data Structure

### Interface
```typescript
interface Program {
  id: string
  name: string
  description: string
  icon: string  // MaterialCommunityIcons icon name
}
```

### Available Programs (Hardcoded)

#### 1. Kids Program
- **ID**: `'1'`
- **Name**: "Kids Program"
- **Description**: "Ages 5-12. Fun and engaging karate training designed specifically for children. Builds confidence, discipline, and physical fitness."
- **Icon**: `'baby-face-outline'`

#### 2. Adult Program
- **ID**: `'2'`
- **Name**: "Adult Program"
- **Description**: "Comprehensive karate training for adults of all levels. Improve fitness, learn self-defense, and master traditional karate techniques."
- **Icon**: `'account-multiple'`

#### 3. Advanced Training
- **ID**: `'3'`
- **Name**: "Advanced Training"
- **Description**: "Intensive training for advanced students. Focus on advanced techniques, kata, and competition preparation."
- **Icon**: `'sword-cross'`

#### 4. Personality Development
- **ID**: `'4'`
- **Name**: "Personality Development"
- **Description**: "Build character, confidence, and leadership skills through karate training. Develop discipline and respect."
- **Icon**: `'account-supervisor'`

#### 5. Women's Self-Defense
- **ID**: `'5'`
- **Name**: "Women's Self-Defense"
- **Description**: "Practical self-defense techniques for women. Learn to protect yourself with confidence and awareness."
- **Icon**: `'human-female'`

#### 6. Special Workshops
- **ID**: `'6'`
- **Name**: "Special Workshops"
- **Description**: "Regular workshops on specific topics like kata, kumite, and karate philosophy. Open to all students."
- **Icon**: `'book-open-variant'`

---

## Component Details

### Program Card Structure

```tsx
<Card style={styles.card} mode="elevated">
  <Card.Content style={styles.cardContent}>
    <View style={styles.headerRow}>
      <MaterialCommunityIcons
        name={program.icon}
        size={32}
        color="#7B2CBF"
        style={styles.icon}
      />
      <Text variant="titleMedium" style={styles.programName}>
        {program.name}
      </Text>
    </View>
    <Text variant="bodyMedium" style={styles.description}>
      {program.description}
    </Text>
  </Card.Content>
</Card>
```

**Card Layout:**
1. **Header Row** (Horizontal)
   - Icon (32px, left)
   - Program name (Title Medium, Bold, flex: 1)
   - Gap: 12px between icon and text

2. **Description** (Below header)
   - Body Medium text
   - Line height: 20px
   - Color: #6B7280 (gray)

---

## Styling Details

### Screen Container
```typescript
container: {
  flex: 1,
  backgroundColor: '#FFF8E7',  // Cream/beige background
}
```

### Header Styles
```typescript
header: {
  paddingHorizontal: 16,
  paddingBottom: 16,
  paddingTop: insets.top + 8,
}
title: {
  fontWeight: 'bold',
  color: '#1A1A1A',  // Dark gray/black
}
```

### ScrollView
```typescript
scrollView: {
  flex: 1,
}
scrollContent: {
  padding: 16,
  paddingBottom: 32,
}
```

### Card Styles
```typescript
card: {
  marginBottom: 12,
  elevation: 1,
  borderRadius: 12,
  backgroundColor: '#FFFFFF',  // White cards
}
cardContent: {
  paddingVertical: 16,
  paddingHorizontal: 16,
}
```

### Header Row (Icon + Name)
```typescript
headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
}
icon: {
  marginRight: 12,
}
programName: {
  fontWeight: '600',
  color: '#1A1A1A',
  flex: 1,
}
```

### Description
```typescript
description: {
  color: '#6B7280',  // Medium gray
  lineHeight: 20,
}
```

---

## Color Scheme

- **Background**: `#FFF8E7` (Cream/beige - warm, inviting)
- **Card Background**: `#FFFFFF` (White)
- **Primary Text**: `#1A1A1A` (Dark gray/black)
- **Secondary Text**: `#6B7280` (Medium gray)
- **Icon Color**: `#7B2CBF` (Purple - brand color)
- **Loading Indicator**: `#7B2CBF` (Purple)

---

## Typography

- **Title Large**: Bold, #1A1A1A (Page title)
- **Title Medium**: Semi-bold (600), #1A1A1A (Program names)
- **Body Medium**: Regular, #6B7280 (Descriptions)

---

## Spacing & Layout

- **Screen Padding**: 16px horizontal
- **Card Padding**: 16px vertical, 16px horizontal
- **Card Margin**: 12px bottom (between cards)
- **Icon Gap**: 12px (between icon and text)
- **Header Bottom Margin**: 12px (between header row and description)
- **Scroll Bottom Padding**: 32px

---

## Loading State

```tsx
if (loading) {
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color="#7B2CBF" />
      <Text variant="bodyMedium" style={styles.loadingText}>
        Loading programs...
      </Text>
    </View>
  )
}
```

**Loading Design:**
- Centered layout
- Large purple spinner
- "Loading programs..." text below
- Gray text color (#6B7280)

---

## Data Flow

1. **Public Data Hook**: Uses `usePublicData()` to fetch:
   - Logo URL (for header)
   - Branch name (for header)

2. **Hardcoded Programs**: 
   - Programs are defined as a constant array `PROGRAMS`
   - Each program has: id, name, description, icon

3. **Rendering**:
   - Maps through `PROGRAMS` array
   - Creates a card for each program
   - Displays icon, name, and description

---

## Icon Mapping

Each program uses MaterialCommunityIcons:

| Program | Icon Name | Visual |
|---------|-----------|--------|
| Kids Program | `baby-face-outline` | Baby face icon |
| Adult Program | `account-multiple` | Multiple people icon |
| Advanced Training | `sword-cross` | Crossed swords icon |
| Personality Development | `account-supervisor` | Supervisor icon |
| Women's Self-Defense | `human-female` | Female figure icon |
| Special Workshops | `book-open-variant` | Open book icon |

All icons are:
- Size: 32px
- Color: #7B2CBF (Purple)
- Position: Left side of card header

---

## Accessibility

- **Cards**: Elevated mode for better visibility
- **Text**: Proper contrast ratios
- **Icons**: Large enough for touch (32px)
- **Loading State**: Clear feedback

---

## Navigation

- **Route**: `/(public)/programs`
- **Access**: From public navigation menu
- **Header**: Uses `PublicHeader` component with logo and dojo name

---

## Current Limitations

1. **Static Data**: Programs are hardcoded, not from database
2. **No Interaction**: Cards are not clickable (no detail view)
3. **No Filtering**: All programs shown at once
4. **No Images**: Only icons, no program images
5. **No Pricing**: No fee information displayed
6. **No Enrollment**: No way to enroll directly from this page

---

## Potential Enhancements

### 1. **Interactive Cards**
- Make cards clickable
- Navigate to program detail page
- Show more information

### 2. **Program Images**
- Add program-specific images
- Visual representation of training

### 3. **Pricing Information**
- Display program fees
- Show membership options

### 4. **Enrollment CTA**
- "Enroll Now" button on each card
- Direct enrollment flow

### 5. **Filtering/Search**
- Filter by age group
- Search programs
- Category tabs

### 6. **Program Details**
- Duration information
- Schedule details
- Instructor information
- Prerequisites

### 7. **Database Integration**
- Fetch programs from database
- Dynamic program management
- Admin can add/edit programs

---

## Dependencies

- `react-native` - Core components
- `react-native-paper` - UI components (Text, Card, ActivityIndicator)
- `@expo/vector-icons` - Icons (MaterialCommunityIcons)
- `expo-router` - Navigation
- `react-native-safe-area-context` - Safe area handling
- Custom hooks: `usePublicData` - Fetch public data

---

## ProgramsSection Component (Expandable Cards)

### Location
- **File**: `src/components/public/sections/ProgramsSection.tsx`
- **Usage**: Used on public homepage as a section

### Key Differences from Main Page

1. **Expandable Cards**
   - Cards are clickable
   - Description shows/hides on tap
   - Chevron icon indicates expand/collapse state

2. **Interactive Design**
   - `TouchableOpacity` wrapper for each card
   - `expandedId` state tracks which card is open
   - Only one card expanded at a time

3. **Visual Indicators**
   - Chevron down (▼) when collapsed
   - Chevron up (▲) when expanded
   - Smooth expand/collapse animation

### Component Structure

```tsx
<Card>
  <TouchableOpacity onPress={() => toggleExpand(program.id)}>
    <Card.Content>
      <View style={styles.headerRow}>
        <View style={styles.iconTitleRow}>
          <Icon />
          <ProgramName />
        </View>
        <ChevronIcon />  {/* Up or Down */}
      </View>
      {isExpanded && (
        <Description />
      )}
    </Card.Content>
  </TouchableOpacity>
</Card>
```

### Styling Differences

**Container:**
```typescript
container: {
  paddingVertical: 24,
  backgroundColor: '#F5F5F5',  // Light gray (vs cream)
}
```

**Card:**
```typescript
card: {
  marginHorizontal: 16,  // Horizontal margin
  marginBottom: 12,
  // Same as main page
}
```

**Header Row:**
```typescript
headerRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',  // Icon+Name on left, Chevron on right
  alignItems: 'center',
}
iconTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,  // Takes available space
}
```

### Icon Differences

The ProgramsSection uses slightly different icons:

| Program | Main Page Icon | Section Icon |
|---------|---------------|--------------|
| Adult Program | `account-multiple` | `account` |
| Personality Development | `account-supervisor` | `account-heart` |
| Women's Self-Defense | `human-female` | `shield-lock` |
| Special Workshops | `book-open-variant` | `calendar-star` |

### User Interaction

1. **Tap to Expand**: User taps card → Description appears
2. **Tap to Collapse**: User taps again → Description hides
3. **Single Expand**: Only one card expanded at a time
4. **Visual Feedback**: Active opacity 0.7 on press

---

## Summary

The public programs page is a simple, clean display of available training programs. It uses:

1. **Card-based Layout** - Each program in its own card
2. **Icon + Text Design** - Visual icons with program names
3. **Descriptive Text** - Clear program descriptions
4. **Scrollable List** - Vertical scrolling for all programs
5. **Consistent Styling** - White cards on cream background
6. **Purple Accents** - Brand color for icons

The design is straightforward and focuses on clarity and readability, making it easy for users to browse available programs.

