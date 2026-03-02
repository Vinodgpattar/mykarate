import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { Text, IconButton } from 'react-native-paper'
import YoutubePlayer from 'react-native-youtube-iframe'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface YouTubePlayerProps {
  visible: boolean
  videoId: string
  videoTitle?: string
  onClose: () => void
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

export function YouTubePlayer({ visible, videoId, videoTitle, onClose }: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPlaying(false) // Start paused - user must press play (iOS blocks autoplay)
      setLoading(true)
      setError(null)
      setIsReady(false)
    } else {
      setPlaying(false)
      setIsReady(false)
    }
  }, [visible, videoId])

  // Calculate player height (16:9 aspect ratio, safely capped at 80% of screen height)
  const playerHeight = Math.min(SCREEN_WIDTH * 0.5625, SCREEN_HEIGHT * 0.8)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {videoTitle && (
              <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                {videoTitle}
              </Text>
            )}
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            iconColor="#FFFFFF"
            style={styles.closeButton}
          />
        </View>

        {/* Video Player */}
        <View style={styles.playerContainer}>
          {loading && !error && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7B2CBF" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null)
                  setLoading(true)
                  setPlaying(true)
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {!error && (
            <View style={[styles.playerWrapper, { height: playerHeight }]}>
              <YoutubePlayer
                height={playerHeight}
                videoId={videoId}
                play={playing}
                onChangeState={(state) => {
                  console.log('YouTube player state:', state)
                  if (state === 'ended') {
                    setPlaying(false)
                  } else if (state === 'playing') {
                    setLoading(false)
                    console.log('Video is now playing')
                  } else if (state === 'paused') {
                    setLoading(false)
                  } else if (state === 'buffering') {
                    // Keep loading indicator during buffering
                  } else if (state === 'unstarted') {
                    console.log('Video is unstarted')
                  }
                }}
                onReady={() => {
                  console.log('YouTube player ready')
                  setLoading(false)
                  setIsReady(true)
                }}
                onError={(error) => {
                  console.error('YouTube player error:', error)
                  setError('Failed to load video. Please check your internet connection.')
                  setLoading(false)
                  setPlaying(false)
                }}
                webViewStyle={styles.webView}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  allowsFullscreenVideo: true, // CRITICAL: Required for playback to work
                  mediaPlaybackRequiresUserAction: false,
                  javaScriptEnabled: true,
                  domStorageEnabled: true,
                  startInLoadingState: true,
                }}
                initialPlayerParams={{
                  // Removed autoplay: 1 - iOS blocks autoplay without user gesture
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  playsinline: 1,
                  controls: 1,
                }}
              />
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => {
              setPlaying(!playing)
            }}
            activeOpacity={0.7}
            disabled={!!error}
          >
            <MaterialCommunityIcons
              name={playing ? 'pause' : 'play'}
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.playButtonText}>
              {playing ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  headerContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    margin: 0,
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playerWrapper: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#000000',
  },
  webView: {
    alignSelf: 'stretch',
    backgroundColor: '#000000',
  },
  controls: {
    padding: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

