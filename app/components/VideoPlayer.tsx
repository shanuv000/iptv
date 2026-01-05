'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    url: string;
    channelName: string;
    onError?: (error: string) => void;
}

/**
 * Production-ready HLS.js configuration for IPTV Live Streaming
 * Based on deep research of best practices for live TV channels
 * 
 * Key optimizations:
 * 1. Live sync settings for IPTV streams
 * 2. Balanced buffers for stability without excessive memory
 * 3. Conservative ABR to prevent constant quality switching
 * 4. Limited retries to fail fast on dead streams
 * 5. Web workers for performance
 */
const getHlsConfig = (): Partial<Hls['config']> => ({
    // ============================================
    // CORE SETTINGS
    // ============================================

    // Enable web workers for TS demuxing (better performance)
    enableWorker: true,

    // Start with auto-selected quality (-1 = automatic)
    startLevel: -1,

    // ============================================
    // LIVE STREAM SYNCHRONIZATION (Critical for IPTV)
    // ============================================

    // Stay 3 segments behind live edge (balance latency vs stability)
    liveSyncDurationCount: 3,

    // Maximum latency before seeking forward (10 segments)
    liveMaxLatencyDurationCount: 10,

    // For VOD-style IPTV streams, keep lowLatencyMode off
    lowLatencyMode: false,

    // ============================================
    // BUFFER MANAGEMENT
    // ============================================

    // Target buffer ahead of playhead (seconds)
    maxBufferLength: 30,

    // Absolute maximum buffer length
    maxMaxBufferLength: 60,

    // Max buffer size in bytes (60MB)
    maxBufferSize: 60 * 1000 * 1000,

    // Back buffer - keep 30s of played content for rewind
    backBufferLength: 30,

    // Tolerate small gaps in buffer (0.5 seconds)
    maxBufferHole: 0.5,

    // ============================================
    // FRAGMENT/MANIFEST LOADING (Reduced retries)
    // ============================================

    // Fragment loading - fail fast on dead streams
    fragLoadingMaxRetry: 2,
    fragLoadingRetryDelay: 1000,
    fragLoadingMaxRetryTimeout: 64000,

    // Manifest loading
    manifestLoadingMaxRetry: 2,
    manifestLoadingRetryDelay: 1000,
    manifestLoadingMaxRetryTimeout: 64000,

    // Level loading
    levelLoadingMaxRetry: 2,
    levelLoadingRetryDelay: 1000,
    levelLoadingMaxRetryTimeout: 64000,

    // ============================================
    // TIMEOUTS
    // ============================================

    fragLoadingTimeOut: 20000,     // 20s fragment timeout
    manifestLoadingTimeOut: 10000, // 10s manifest timeout
    levelLoadingTimeOut: 10000,    // 10s level timeout

    // ============================================
    // ADAPTIVE BITRATE (ABR) - Conservative for stability
    // ============================================

    // ABR smoothing factors (higher = more stable, slower reaction)
    abrEwmaFastLive: 3.0,
    abrEwmaSlowLive: 9.0,
    abrEwmaFastVoD: 3.0,
    abrEwmaSlowVoD: 9.0,

    // Bandwidth estimation
    abrBandWidthFactor: 0.95,      // Use 95% of measured bandwidth
    abrBandWidthUpFactor: 0.7,     // 70% threshold for quality upgrade

    // Cap quality to player size (saves bandwidth on small screens)
    capLevelToPlayerSize: true,

    // ============================================
    // STALL RECOVERY
    // ============================================

    // Nudge settings for stall recovery
    nudgeOffset: 0.1,              // Nudge 100ms forward on stall
    nudgeMaxRetry: 3,              // Try 3 nudges before giving up

    // High buffer watchdog (trigger recovery if stuck)
    highBufferWatchdogPeriod: 2,   // Check every 2 seconds
});

export default function VideoPlayer({ url, channelName, onError }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuality, setCurrentQuality] = useState<string>('Auto');

    // Handle quality level info
    const updateQuality = useCallback((hls: Hls) => {
        const currentLevel = hls.currentLevel;
        if (currentLevel >= 0 && hls.levels[currentLevel]) {
            const height = hls.levels[currentLevel].height;
            setCurrentQuality(height ? `${height}p` : 'Auto');
        } else {
            setCurrentQuality('Auto');
        }
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !url) return;

        // Reset state for new channel
        setIsLoading(true);
        setError(null);
        setCurrentQuality('Auto');
        retryCountRef.current = 0;

        // Cleanup previous instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // Check if HLS.js is supported
        if (Hls.isSupported()) {
            const hls = new Hls(getHlsConfig());
            hlsRef.current = hls;

            // Load and attach
            hls.loadSource(url);
            hls.attachMedia(video);

            // Stream ready - manifest parsed
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                video.play().catch(() => {
                    // Autoplay blocked - user needs to click
                });
            });

            // Track quality changes
            hls.on(Hls.Events.LEVEL_SWITCHED, () => {
                updateQuality(hls);
            });

            // Error handling with LIMITED recovery
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    retryCountRef.current++;
                    console.warn(`HLS Fatal Error [${retryCountRef.current}/${maxRetries}]:`, data.type, data.details);

                    // Stop after max retries
                    if (retryCountRef.current > maxRetries) {
                        const errorMsg = 'Stream unavailable. Try another channel.';
                        setError(errorMsg);
                        setIsLoading(false);
                        onError?.(errorMsg);
                        hls.destroy();
                        return;
                    }

                    // Recovery based on error type
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // Network issue - try reloading
                            hls.startLoad();
                            break;

                        case Hls.ErrorTypes.MEDIA_ERROR:
                            // Decode error - try recovering
                            hls.recoverMediaError();
                            break;

                        default:
                            // Other fatal errors - give up
                            const errorMsg = 'Stream unavailable. Try another channel.';
                            setError(errorMsg);
                            setIsLoading(false);
                            onError?.(errorMsg);
                            hls.destroy();
                            break;
                    }
                }
                // Non-fatal errors are handled automatically by HLS.js
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari/iOS - native HLS support
            video.src = url;

            const handleLoaded = () => {
                setIsLoading(false);
                video.play().catch(() => { });
            };

            const handleError = () => {
                setError('Stream unavailable. Try another channel.');
                setIsLoading(false);
                onError?.('Stream unavailable');
            };

            video.addEventListener('loadedmetadata', handleLoaded);
            video.addEventListener('canplay', handleLoaded);
            video.addEventListener('error', handleError);

            return () => {
                video.removeEventListener('loadedmetadata', handleLoaded);
                video.removeEventListener('canplay', handleLoaded);
                video.removeEventListener('error', handleError);
            };
        } else {
            setError('Your browser does not support HLS streaming.');
            setIsLoading(false);
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [url, onError, updateQuality]);

    return (
        <div className="video-container">
            {isLoading && !error && (
                <div className="video-placeholder">
                    <div className="spinner" />
                    <span>Loading {channelName}...</span>
                </div>
            )}
            {error && (
                <div className="video-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
            <video
                ref={videoRef}
                className="video-player"
                controls
                playsInline
                preload="auto"
                style={{ display: isLoading || error ? 'none' : 'block' }}
            />
            {/* Quality badge */}
            {!isLoading && !error && currentQuality !== 'Auto' && (
                <div className="quality-badge">
                    {currentQuality}
                </div>
            )}
        </div>
    );
}
