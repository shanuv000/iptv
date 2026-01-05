'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoPlayer from './components/VideoPlayer';
import { VirtualChannelList } from './components/VirtualChannelList';
import { ChannelListSkeleton, CategoryTabsSkeleton } from './components/Skeleton';
import { useSwipeGestures } from './components/SwipeGestures';
import type { Channel } from './api/channels/route';

interface ChannelsResponse {
  channels: Channel[];
  categories: string[];
  totalCount: number;
}

export default function Home() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('iptv-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/channels');
        if (!response.ok) throw new Error('Failed to fetch channels');

        const data: ChannelsResponse = await response.json();
        setChannels(data.channels);
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        setError('Failed to load channels. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesCategory = selectedCategory === 'All' || channel.category === selectedCategory;
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [channels, selectedCategory, searchQuery]);

  // Handle channel selection with URL navigation
  const handleChannelSelect = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    // Navigate to shareable URL
    const slug = channel.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
    router.push(`/watch/${slug}`, { scroll: false });
  }, [router]);

  // Swipe to change channel
  const handleSwipeChannel = useCallback((direction: 'next' | 'prev') => {
    if (!selectedChannel || filteredChannels.length === 0) return;

    const currentIndex = filteredChannels.findIndex(c => c.id === selectedChannel.id);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredChannels.length;
    } else {
      newIndex = currentIndex === 0 ? filteredChannels.length - 1 : currentIndex - 1;
    }

    handleChannelSelect(filteredChannels[newIndex]);
  }, [selectedChannel, filteredChannels, handleChannelSelect]);

  // Swipe gesture handlers
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: () => handleSwipeChannel('next'),
    onSwipeRight: () => handleSwipeChannel('prev'),
  });

  // Show swipe hint on first play
  useEffect(() => {
    if (selectedChannel && !localStorage.getItem('swipe-hint-shown')) {
      setShowSwipeHint(true);
      localStorage.setItem('swipe-hint-shown', 'true');
      setTimeout(() => setShowSwipeHint(false), 3000);
    }
  }, [selectedChannel]);

  // Toggle favorite
  const toggleFavorite = useCallback((channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(channelId)) {
        newFavorites.delete(channelId);
      } else {
        newFavorites.add(channelId);
      }
      localStorage.setItem('iptv-favorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>
            <span>IPTV India</span>
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First Layout */}
      <main className="main-content mobile-first">
        {/* Player Section with Swipe Gestures */}
        <section className="player-section" {...swipeHandlers}>
          {selectedChannel ? (
            <>
              <VideoPlayer
                url={selectedChannel.url}
                channelName={selectedChannel.name}
              />
              <div className="channel-info">
                <h2>{selectedChannel.name}</h2>
                <span className="category">{selectedChannel.category}</span>
                {selectedChannel.quality && (
                  <span className="quality-tag">
                    {selectedChannel.quality}
                  </span>
                )}
              </div>
              {/* Swipe hint for first-time users */}
              {showSwipeHint && (
                <div className="swipe-indicator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Swipe to change channel
                </div>
              )}
            </>
          ) : (
            <div className="video-container">
              <div className="video-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
                <span>Select a channel to start watching</span>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Category Tabs */}
          {isLoading ? (
            <CategoryTabsSkeleton count={6} />
          ) : (
            <div className="category-tabs">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Channel Count */}
          <div className="channel-count">
            {isLoading ? 'Loading...' : `${filteredChannels.length} channel${filteredChannels.length !== 1 ? 's' : ''}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Channel List - Virtualized for performance */}
          {isLoading ? (
            <ChannelListSkeleton count={8} />
          ) : error ? (
            <div className="error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="no-results">
              <p>No channels found</p>
            </div>
          ) : (
            <VirtualChannelList
              channels={filteredChannels}
              selectedChannel={selectedChannel}
              favorites={favorites}
              onChannelSelect={handleChannelSelect}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
