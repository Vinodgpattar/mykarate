# Public Gallery Page Design & Implementation Details

## Overview
The public gallery page displays a grid of images and YouTube videos from the dojo's public gallery. It supports both uploaded images and YouTube video links, with in-app viewing capabilities for both media types.

## File Structure

### Main Screen
- **File**: `src/app/(public)/gallery.tsx`
- **Route**: `/(public)/gallery`
- **Purpose**: Display gallery items (images and YouTube videos) in a grid layout

### Components Used
1. **PublicHeader** - `src/components/public/shared/PublicHeader.tsx`
2. **YouTubePlayer** - `src/components/public/YouTubePlayer.tsx`
3. **ImageViewing** - `react-native-image-viewing` (third-party library)
4. **MaterialCommunityIcons** - Icon library

---

## Screen Layout & Structure

### 1. Header Section
```tsx
<View style={styles.header}>
  <Text variant="headlineSmall" style={styles.title}>
    Gallery
  </Text>
</View>
```

**Design Details:**
- **Title**: "Gallery" (Headline Small, Bold, #111827)
- **Alignment**: Centered
- **Padding**: Top (safe area + 8px), Horizontal 16px, Bottom 16px
- **Background**: #FFF8E7 (cream/beige background)

### 2. Gallery Grid
**Layout**: 2-column grid with responsive spacing

**Grid Specifications:**
- **Columns**: 2 columns on all screen sizes
- **Item Width**: `(SCREEN_WIDTH - padding - spacing) / 2`
- **Item Spacing**: 12px gap between items
- **Aspect Ratio**: 4:3 (width:height)
- **Border Radius**: 20px (mobile) or 24px (tablet)

### 3. Empty State
**Displayed when**: No gallery items available

**Components:**
- Large icon (64px, gray)
- Title: "No Gallery Items Available"
- Subtitle: "Check back later for gallery updates"

---

## Media Types Supported

### 1. Images (`media_type: 'image'`)
- **Source**: Uploaded to Supabase storage
- **Display**: Direct image display in grid
- **Interaction**: Tap to open full-screen image viewer
- **Features**:
  - Loading indicator while loading
  - Error placeholder if load fails
  - Title display below image (optional)

### 2. YouTube Videos (`media_type: 'youtube'`)
- **Source**: YouTube URL stored in database
- **Display**: YouTube thumbnail with play overlay
- **Interaction**: Tap to open in-app YouTube player
- **Features**:
  - Automatic thumbnail extraction from YouTube
  - Play icon overlay (white circle, 48px)
  - Dark overlay (30% opacity) for contrast
  - Title display below thumbnail (optional)

---

## Component Details

### Gallery Item Structure

#### Image Item
```tsx
<TouchableOpacity onPress={() => handleImagePress(item)}>
  <View style={styles.imageContainer}>
    {loading && <LoadingOverlay />}
    {error ? <ErrorPlaceholder /> : <Image source={{ uri: item.file_url }} />}
  </View>
  {item.title && <Text>{item.title}</Text>}
</TouchableOpacity>
```

#### YouTube Item
```tsx
<TouchableOpacity onPress={() => handleYouTubePress(item)}>
  <View style={styles.imageContainer}>
    <Image source={{ uri: thumbnailUrl }} />
    <View style={styles.youtubeOverlay}>
      <PlayIcon />
    </View>
  </View>
  {item.title && <Text>{item.title}</Text>}
</TouchableOpacity>
```

---

## Data Flow

### 1. Data Fetching
- Uses `usePublicData()` hook
- Fetches `galleryItems` from database
- Filters for active items only: `is_active === true`
- Filters for supported media types: `'image'` or `'youtube'`

### 2. Data Processing
```typescript
// Filter active items
const galleryItems = data?.galleryItems.filter(
  item => (item.media_type === 'image' || item.media_type === 'youtube') && item.is_active
)

// Separate images for viewer
const imageItems = galleryItems.filter(item => item.media_type === 'image')

// Prepare images for ImageViewing component
const galleryImages = imageItems.map(item => ({ uri: item.file_url }))
```

### 3. YouTube Video ID Extraction
```typescript
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  // Returns video ID or null
}
```

**Supported URL Formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

### 4. YouTube Thumbnail Generation
```typescript
const thumbnailUrl = videoId 
  ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  : null
```

---

## User Interactions

### 1. Image Tap
**Action**: Opens full-screen image viewer

**Flow:**
1. User taps image
2. Find image index in `imageItems` array
3. Set `galleryViewerIndex` to found index
4. Open `ImageViewing` modal
5. User can swipe between images
6. Close button dismisses viewer

### 2. YouTube Video Tap
**Action**: Opens in-app YouTube player

**Flow:**
1. User taps YouTube thumbnail
2. Extract video ID from URL
3. Set `selectedYouTubeVideo` state
4. Open `YouTubePlayer` modal
5. Video loads and user can play
6. Close button dismisses player

---

## Image Viewer Component

### Library
- **Package**: `react-native-image-viewing`
- **Features**:
  - Full-screen image display
  - Swipe navigation between images
  - Pinch-to-zoom
  - Smooth animations

### Implementation
```tsx
<ImageViewing
  images={galleryImages}
  imageIndex={galleryViewerIndex}
  visible={galleryViewerVisible}
  onRequestClose={() => setGalleryViewerVisible(false)}
  presentationStyle="overFullScreen"
/>
```

**Props:**
- `images`: Array of `{ uri: string }` objects
- `imageIndex`: Current image index
- `visible`: Modal visibility state
- `onRequestClose`: Close handler
- `presentationStyle`: "overFullScreen" for full-screen modal

---

## YouTube Player Component

### Library
- **Package**: `react-native-youtube-iframe`
- **Dependencies**: `react-native-webview`

### Features
- In-app video playback (no external app)
- Full-screen support
- Play/pause controls
- Loading states
- Error handling
- Video title display

### Component Structure
```tsx
<YouTubePlayer
  visible={youtubePlayerVisible}
  videoId={selectedYouTubeVideo.videoId}
  videoTitle={selectedYouTubeVideo.title}
  onClose={() => {
    setYoutubePlayerVisible(false)
    setSelectedYouTubeVideo(null)
  }}
/>
```

### Player Configuration
```typescript
// Player height calculation
const playerHeight = Math.min(SCREEN_WIDTH * 0.5625, SCREEN_HEIGHT * 0.8)
// 16:9 aspect ratio, max 80% of screen height

// WebView props
webViewProps={{
  allowsInlineMediaPlayback: true,
  allowsFullscreenVideo: true, // CRITICAL for playback
  mediaPlaybackRequiresUserAction: false,
  javaScriptEnabled: true,
  domStorageEnabled: true,
  startInLoadingState: true,
}}

// Player params
initialPlayerParams={{
  modestbranding: 1,
  rel: 0,
  showinfo: 0,
  playsinline: 1,
  controls: 1,
}}
```

### Player States
- **Loading**: Shows spinner while video loads
- **Ready**: Video loaded, ready to play
- **Playing**: Video is playing
- **Paused**: Video is paused
- **Error**: Shows error message with retry button

### iOS Considerations
- **No Autoplay**: iOS blocks autoplay without user gesture
- **User Action Required**: User must tap play button
- **Full Screen**: Requires `allowsFullscreenVideo: true`

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
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 16,
  paddingBottom: 16,
  paddingTop: insets.top + 8,
}
title: {
  fontWeight: '700',
  color: '#111827',
  textAlign: 'center',
}
```

### Grid Layout
```typescript
grid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: ITEM_SPACING,  // 12px
}
```

### Gallery Item
```typescript
galleryItem: {
  borderRadius: IS_MOBILE ? 20 : 24,
  overflow: 'hidden',
  backgroundColor: 'transparent',
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
}
```

### Image Container
```typescript
imageContainer: {
  width: ITEM_WIDTH,
  aspectRatio: 4/3,
  position: 'relative',
  backgroundColor: '#F3F4F6',
  overflow: 'hidden',
  borderRadius: IS_MOBILE ? 20 : 24,
}
```

### YouTube Overlay
```typescript
youtubeOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',  // 30% dark overlay
}
```

### Loading Overlay
```typescript
loadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  zIndex: 1,
}
```

### Error Placeholder
```typescript
errorPlaceholder: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F3F4F6',
  borderRadius: IS_MOBILE ? 20 : 24,
}
```

### Item Title
```typescript
itemTitle: {
  marginTop: 8,
  paddingHorizontal: 8,
  color: '#6B7280',
  textAlign: 'center',
  fontSize: 13,  // Body Small
}
```

---

## Color Scheme

- **Background**: `#FFF8E7` (Cream/beige)
- **Card Background**: `#F3F4F6` (Light gray for placeholders)
- **Primary Text**: `#111827` (Dark gray/black)
- **Secondary Text**: `#6B7280` (Medium gray)
- **Loading Indicator**: `#7B2CBF` (Purple)
- **YouTube Overlay**: `rgba(0, 0, 0, 0.3)` (30% black)
- **Shadow**: `rgba(0, 0, 0, 0.15)` (15% black)

---

## Typography

- **Title**: Headline Small, Bold (700), #111827
- **Item Title**: Body Small, #6B7280
- **Empty State Title**: Title Medium, #1A1A1A
- **Empty State Text**: Body Medium, #6B7280

---

## Spacing & Layout

### Grid Spacing
- **Item Gap**: 12px
- **Screen Padding**: 16px (mobile) or 24px (tablet)
- **Bottom Padding**: 32px

### Item Dimensions
- **Width**: `(SCREEN_WIDTH - padding - spacing) / 2`
- **Aspect Ratio**: 4:3
- **Border Radius**: 20px (mobile) or 24px (tablet)

### Header Spacing
- **Top Padding**: Safe area + 8px
- **Horizontal Padding**: 16px
- **Bottom Padding**: 16px

---

## Loading States

### Image Loading
```typescript
const [imageLoading, setImageLoading] = useState<Set<string>>(new Set())
const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
```

**Flow:**
1. `onLoadStart`: Add item ID to `imageLoading`
2. `onLoadEnd`: Remove item ID from `imageLoading`
3. `onError`: Add item ID to `imageErrors`, remove from `imageLoading`

**Visual Feedback:**
- Loading: Purple spinner overlay
- Error: Gray placeholder with "image-off" icon

### YouTube Loading
- Handled by `YouTubePlayer` component
- Shows loading spinner in modal
- Displays error message if load fails

---

## Error Handling

### Image Errors
- **Detection**: `onError` callback on Image component
- **Display**: Gray placeholder with icon
- **Recovery**: None (user can retry by scrolling)

### YouTube Errors
- **Detection**: `onError` callback in YouTubePlayer
- **Display**: Error message with retry button
- **Recovery**: Retry button reloads video

### Network Errors
- Handled gracefully with placeholders
- No app crashes
- User-friendly error messages

---

## Responsive Design

### Screen Size Detection
```typescript
const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768
```

### Adaptive Features
- **Border Radius**: 20px (mobile) vs 24px (tablet)
- **Padding**: 16px (mobile) vs 24px (tablet)
- **Grid**: Always 2 columns (responsive width)

---

## Performance Optimizations

### 1. Memoization
```typescript
const galleryItems = useMemo(() => {
  // Filter logic
}, [data?.galleryItems])

const imageItems = useMemo(() => {
  // Filter images
}, [galleryItems])

const galleryImages = useMemo(() => {
  // Map to ImageViewing format
}, [imageItems])
```

### 2. Lazy Loading
- Images load on-demand
- Thumbnails load first for YouTube videos
- Full video loads only when user taps

### 3. State Management
- Uses `Set` for efficient loading/error tracking
- Minimal re-renders with memoization
- Efficient array operations

---

## Accessibility

### Image Items
- `TouchableOpacity` with `activeOpacity={0.8}`
- Title text for screen readers
- Proper contrast ratios

### YouTube Items
- Clear play icon overlay
- Title text for context
- Touch target size: Full item (meets 44x44px minimum)

### Empty State
- Clear icon and text
- Informative message

---

## Dependencies

### Core
- `react-native` - Core components
- `react-native-paper` - UI components (Text)
- `@expo/vector-icons` - Icons (MaterialCommunityIcons)
- `expo-router` - Navigation
- `react-native-safe-area-context` - Safe area handling

### Third-Party
- `react-native-image-viewing` - Full-screen image viewer
- `react-native-youtube-iframe` - YouTube video player
- `react-native-webview` - Required for YouTube player

### Custom Hooks
- `usePublicData` - Fetch public gallery data

---

## Data Structure

### PublicGalleryItem Interface
```typescript
interface PublicGalleryItem {
  id: string
  media_type: 'image' | 'video' | 'youtube'
  title: string | null
  file_url: string  // Image URL or YouTube URL
  thumbnail_url: string | null
  order_index: number
  is_featured: boolean
  is_active: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}
```

### Gallery Images Format (for ImageViewing)
```typescript
interface GalleryImage {
  uri: string
}
```

### YouTube Video State
```typescript
interface YouTubeVideo {
  videoId: string
  title?: string
}
```

---

## YouTube Player Modal Design

### Layout
- **Background**: Black (#000000)
- **Full Screen**: `presentationStyle="fullScreen"`
- **Header**: Video title + close button
- **Player**: Centered, 16:9 aspect ratio
- **Controls**: Play/pause button at bottom

### Header
- White text on black background
- Video title (2 lines max)
- Close button (white icon)

### Player Container
- Centered vertically and horizontally
- Max height: 80% of screen
- Width: Full width with padding

### Controls
- Purple play/pause button
- White text and icon
- Rounded corners

---

## Image Viewer Modal Design

### Layout
- **Full Screen**: Overlays entire screen
- **Background**: Black
- **Navigation**: Swipe left/right
- **Zoom**: Pinch to zoom
- **Close**: Tap outside or swipe down

### Features
- Smooth animations
- Gesture-based navigation
- High-quality image display

---

## Empty State Design

### Layout
- Centered vertically and horizontally
- Large icon (64px)
- Title and subtitle text
- Generous padding (80px vertical)

### Visual
- Gray icon (#9CA3AF)
- Dark title (#1A1A1A)
- Gray subtitle (#6B7280)
- Clean, minimal design

---

## Summary

The public gallery page is a comprehensive media display system that supports:

1. **Dual Media Types**: Images and YouTube videos
2. **Grid Layout**: 2-column responsive grid
3. **Full-Screen Viewing**: Both images and videos
4. **In-App Playback**: YouTube videos play inside app
5. **Error Handling**: Graceful error states
6. **Loading States**: Clear loading indicators
7. **Responsive Design**: Adapts to screen sizes
8. **Performance**: Optimized with memoization
9. **Accessibility**: Proper touch targets and contrast
10. **User Experience**: Smooth interactions and animations

The implementation provides a professional, modern gallery experience that showcases the dojo's training facilities, events, and moments effectively.



