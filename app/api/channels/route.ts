import { NextResponse } from 'next/server';
import { parseM3U } from '@iptv/playlist';

export interface Channel {
    id: string;
    name: string;
    logo: string;
    category: string;
    url: string;
    quality?: string;
}

interface ParsedChannel {
    tvgId?: string;
    name?: string;
    tvgName?: string;
    tvgLogo?: string;
    groupTitle?: string;
    url?: string;
    extras?: Record<string, string>;
}

const M3U_URL = 'https://iptv-org.github.io/iptv/countries/in.m3u';

export async function GET() {
    try {
        // Fetch the M3U playlist
        const response = await fetch(M3U_URL, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist: ${response.status}`);
        }

        const m3uContent = await response.text();

        // Parse the playlist
        const playlist = parseM3U(m3uContent);

        // Transform to our channel format
        const channels: Channel[] = [];
        const categorySet = new Set<string>();

        for (const item of playlist.channels as ParsedChannel[]) {
            const category = item.groupTitle || 'Uncategorized';
            categorySet.add(category);

            // Extract quality from name (e.g., "Aaj Tak (1080p)" -> "1080p")
            const qualityMatch = item.name?.match(/\((\d+p?)\)/);
            const quality = qualityMatch ? qualityMatch[1] : undefined;

            // Clean name by removing quality indicator
            const cleanName = item.name?.replace(/\s*\(\d+p?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim() || 'Unknown';

            channels.push({
                id: item.tvgId || `channel-${channels.length}`,
                name: cleanName,
                logo: item.tvgLogo || '',
                category,
                url: item.url || '',
                quality,
            });
        }

        // Sort categories alphabetically, but put common ones first
        const priorityCategories = ['All', 'News', 'Entertainment', 'Sports', 'Movies', 'Music', 'Kids'];
        const categories = ['All', ...Array.from(categorySet).sort((a, b) => {
            const aIndex = priorityCategories.indexOf(a);
            const bIndex = priorityCategories.indexOf(b);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        })];

        return NextResponse.json({
            channels,
            categories,
            totalCount: channels.length,
        });
    } catch (error) {
        console.error('Error fetching channels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}
