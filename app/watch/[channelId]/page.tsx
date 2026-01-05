import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import WatchClient from './WatchClient';

interface Props {
    params: Promise<{ channelId: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { channelId } = await params;
    const channelName = channelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
        title: `${channelName} | IPTV India`,
        description: `Watch ${channelName} live streaming on IPTV India`,
        openGraph: {
            title: `Watch ${channelName} Live`,
            description: `Stream ${channelName} live on IPTV India`,
            type: 'video.other',
        },
    };
}

export default async function WatchPage({ params }: Props) {
    const { channelId } = await params;

    if (!channelId) {
        redirect('/');
    }

    return <WatchClient channelId={channelId} />;
}
