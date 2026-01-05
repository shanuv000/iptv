'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import type { Channel } from '../api/channels/route';

interface VirtualChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    favorites: Set<string>;
    onChannelSelect: (channel: Channel) => void;
    onToggleFavorite: (channelId: string, e: React.MouseEvent) => void;
    scrollToSelected?: boolean;
}

/**
 * Virtualized Channel List
 * Only renders visible channels for performance with 598+ channels
 * Preserves scroll position when channel changes
 */
export function VirtualChannelList({
    channels,
    selectedChannel,
    favorites,
    onChannelSelect,
    onToggleFavorite,
    scrollToSelected = false,
}: VirtualChannelListProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [hasScrolledToSelected, setHasScrolledToSelected] = useState(false);

    const virtualizer = useVirtualizer({
        count: channels.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72, // Approximate height of channel card
        overscan: 5, // Render 5 extra items above/below viewport
    });

    // When channel list changes (e.g., category filter), scroll to selected channel if needed
    useEffect(() => {
        if (scrollToSelected && selectedChannel && !hasScrolledToSelected) {
            const index = channels.findIndex(c => c.id === selectedChannel.id);
            if (index >= 0) {
                // Use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                    virtualizer.scrollToIndex(index, { align: 'center' });
                });
                setHasScrolledToSelected(true);
            }
        }
    }, [scrollToSelected, selectedChannel, channels, virtualizer, hasScrolledToSelected]);

    // Reset scroll tracking when channels list changes (filter/search)
    useEffect(() => {
        setHasScrolledToSelected(false);
    }, [channels.length]);

    const getInitial = useCallback((name: string) => {
        return name.charAt(0).toUpperCase();
    }, []);

    // Handle channel select without resetting scroll
    const handleSelect = useCallback((channel: Channel) => {
        onChannelSelect(channel);
    }, [onChannelSelect]);

    return (
        <div
            ref={parentRef}
            className="channel-list"
            style={{ height: '100%', overflow: 'auto' }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const channel = channels[virtualItem.index];
                    const isSelected = selectedChannel?.id === channel.id;

                    return (
                        <div
                            key={channel.id}
                            data-index={virtualItem.index}
                            className={`channel-card ${isSelected ? 'active' : ''}`}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            onClick={() => handleSelect(channel)}
                        >
                            {channel.logo ? (
                                <Image
                                    src={channel.logo}
                                    alt={channel.name}
                                    width={48}
                                    height={48}
                                    className="channel-logo"
                                    unoptimized
                                    loading="lazy"
                                />
                            ) : (
                                <div className="channel-logo-placeholder">
                                    {getInitial(channel.name)}
                                </div>
                            )}
                            <div className="channel-details">
                                <div className="channel-name">{channel.name}</div>
                                <div className="channel-category">
                                    {channel.category}
                                    {channel.quality && ` • ${channel.quality}`}
                                </div>
                            </div>
                            <button
                                className={`favorite-btn ${favorites.has(channel.id) ? 'active' : ''}`}
                                onClick={(e) => onToggleFavorite(channel.id, e)}
                                aria-label={favorites.has(channel.id) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.has(channel.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
