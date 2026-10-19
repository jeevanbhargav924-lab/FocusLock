import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Video, { VideoRef, ResizeMode } from 'react-native-video';
import { MotivationalVideoItem, getRandomMotivationalVideo } from '../utils/motivationalVideos';
import { fonts } from '../theme';

interface MotivationalVideoPlayerProps {
  videoItem?: MotivationalVideoItem;
  onVideoEnd?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const MotivationalVideoPlayer: React.FC<MotivationalVideoPlayerProps> = ({
  videoItem: propVideoItem,
  onVideoEnd,
  style,
}) => {
  const [videoItem] = useState<MotivationalVideoItem>(() => propVideoItem || getRandomMotivationalVideo());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const videoRef = useRef<VideoRef>(null);

  // Stop video playback and release when unmounting
  useEffect(() => {
    return () => {
      setIsPaused(true);
    };
  }, []);

  const handleEnd = useCallback(() => {
    setIsEnded(true);
    setIsPaused(true);
    if (onVideoEnd) {
      onVideoEnd();
    }
  }, [onVideoEnd]);

  const handleReplay = useCallback(() => {
    setIsEnded(false);
    setIsPaused(false);
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback((err: any) => {
    console.warn('Motivational video playback error, displaying fallback:', err);
    setIsLoading(false);
    setHasError(true);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.videoWrapper}>
        {!hasError ? (
          <>
            <Video
              ref={videoRef}
              source={videoItem.source}
              style={styles.video}
              paused={isPaused}
              repeat={false}
              muted={isMuted}
              volume={1.0}
              resizeMode={ResizeMode.COVER}
              onLoad={handleLoad}
              onEnd={handleEnd}
              onError={handleError}
              ignoreSilentSwitch="ignore"
              mixWithOthers="duck"
              playInBackground={false}
              playWhenInactive={false}
            />

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#818CF8" />
              </View>
            )}

            {/* Top header overlay: Badge and Mute button */}
            <View style={styles.topBar}>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>🎯 FOCUS MOTIVATION</Text>
              </View>
              <TouchableOpacity
                onPress={toggleMute}
                activeOpacity={0.7}
                style={styles.iconButton}
                accessibilityLabel={isMuted ? 'Unmute motivational video' : 'Mute motivational video'}>
                <Text style={styles.iconButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>
            </View>

            {/* Replay Overlay when video completes */}
            {isEnded && (
              <View style={styles.endedOverlay}>
                <TouchableOpacity
                  onPress={handleReplay}
                  activeOpacity={0.85}
                  style={styles.replayButton}>
                  <Text style={styles.replayIcon}>🔄</Text>
                  <Text style={styles.replayText}>Replay Motivation</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* Graceful error fallback */
          <View style={styles.errorFallbackContainer}>
            <Text style={styles.errorIcon}>✨</Text>
            <Text style={styles.errorTitle}>STAY FOCUSED</Text>
            <Text style={styles.errorQuote}>"{videoItem.englishText}"</Text>
          </View>
        )}
      </View>

      {/* Motivational quote banner below video */}
      <View style={styles.subtitleCard}>
        <Text style={styles.motivationalText}>"{videoItem.englishText}"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  videoWrapper: {
    width: '100%',
    height: 180,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  badgePill: {
    backgroundColor: 'rgba(7, 10, 16, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 10, 16, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconButtonText: {
    fontSize: 14,
  },
  endedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 10, 16, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#818CF8',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  replayIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  replayText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },
  errorFallbackContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    color: '#F59E0B',
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  errorQuote: {
    color: '#CBD5E1',
    fontSize: 13,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitleCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  motivationalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
