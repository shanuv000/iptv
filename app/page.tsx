'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import VideoPlayer from './components/VideoPlayer';
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

  // Get channel initial for placeholder
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

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
        {/* Player Section */}
        <section className="player-section">
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

          {/* Channel Count */}
          <div className="channel-count">
            {filteredChannels.length} channel{filteredChannels.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Channel List */}
          <div className="channel-list">
            {isLoading ? (
              <div className="loading">
                <div className="spinner" />
              </div>
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
              filteredChannels.map(channel => (
                <div
                  key={channel.id}
                  className={`channel-card ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                  onClick={() => handleChannelSelect(channel)}
                >
                  {channel.logo ? (
                    <Image
                      src={channel.logo}
                      alt={channel.name}
                      width={48}
                      height={48}
                      className="channel-logo"
                      unoptimized
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
                    onClick={(e) => toggleFavorite(channel.id, e)}
                    aria-label={favorites.has(channel.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.has(channel.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
