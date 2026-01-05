'use client';

/**
 * Skeleton Loading Component
 * Displays animated placeholder while content loads
 */

interface SkeletonProps {
    className?: string;
    count?: number;
}

// Single skeleton line
export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`skeleton ${className}`}
            aria-hidden="true"
        />
    );
}

// Channel card skeleton
export function ChannelCardSkeleton() {
    return (
        <div className="channel-card-skeleton">
            <Skeleton className="skeleton-logo" />
            <div className="skeleton-content">
                <Skeleton className="skeleton-title" />
                <Skeleton className="skeleton-subtitle" />
            </div>
            <Skeleton className="skeleton-icon" />
        </div>
    );
}

// Multiple channel skeletons
export function ChannelListSkeleton({ count = 8 }: SkeletonProps) {
    return (
        <div className="channel-list-skeleton">
            {Array.from({ length: count }).map((_, i) => (
                <ChannelCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Category tabs skeleton
export function CategoryTabsSkeleton({ count = 6 }: SkeletonProps) {
    return (
        <div className="category-tabs-skeleton">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="skeleton-tab" />
            ))}
        </div>
    );
}

// Video player skeleton
export function VideoPlayerSkeleton() {
    return (
        <div className="video-player-skeleton">
            <div className="skeleton-video" />
            <div className="skeleton-controls">
                <Skeleton className="skeleton-play-btn" />
                <Skeleton className="skeleton-progress" />
                <Skeleton className="skeleton-time" />
            </div>
        </div>
    );
}
