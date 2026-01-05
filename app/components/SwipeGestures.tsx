'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface UseSwipeGesturesProps {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
}

interface SwipeState {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

/**
 * Hook for detecting swipe gestures
 * Use on the video container for channel switching
 */
export function useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
}: UseSwipeGesturesProps) {
    const [swipeState, setSwipeState] = useState<SwipeState | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        setSwipeState({
            startX: touch.clientX,
            startY: touch.clientY,
            endX: touch.clientX,
            endY: touch.clientY,
        });
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!swipeState) return;
        const touch = e.touches[0];
        setSwipeState(prev => prev ? {
            ...prev,
            endX: touch.clientX,
            endY: touch.clientY,
        } : null);
    }, [swipeState]);

    const handleTouchEnd = useCallback(() => {
        if (!swipeState) return;

        const deltaX = swipeState.endX - swipeState.startX;
        const deltaY = swipeState.endY - swipeState.startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Only trigger if movement exceeds threshold
        if (absX > threshold || absY > threshold) {
            if (absX > absY) {
                // Horizontal swipe
                if (deltaX > 0) {
                    onSwipeRight?.();
                } else {
                    onSwipeLeft?.();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    onSwipeDown?.();
                } else {
                    onSwipeUp?.();
                }
            }
        }

        setSwipeState(null);
    }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };
}

/**
 * Component wrapper for swipe gestures
 */
interface SwipeContainerProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    className?: string;
}

export function SwipeContainer({
    children,
    onSwipeLeft,
    onSwipeRight,
    className = '',
}: SwipeContainerProps) {
    const handlers = useSwipeGestures({
        onSwipeLeft,
        onSwipeRight,
    });

    return (
        <div className={className} {...handlers}>
            {children}
        </div>
    );
}
