
export const extractTweetId = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (!['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com'].includes(urlObj.hostname)) {
            return null;
        }
        const pathParts = urlObj.pathname.split('/');
        const statusIndex = pathParts.indexOf('status');
        if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
            return pathParts[statusIndex + 1];
        }
        return null;
    } catch (e) {
        return null;
    }
};

const parseVideoVariants = (media) => {
    // fxtwitter usually provides variants directly on the media object or inside 'formats'
    // We look for 'variants' first, then 'formats' (some APIs use different names)
    const rawVariants = media.variants || media.formats || (media.video_info ? media.video_info.variants : []) || [];

    if (!rawVariants.length) return [];

    // Filter for MP4s and sort by bitrate (highest first)
    const variants = rawVariants
        .filter((variant) => variant.content_type === 'video/mp4' || variant.container === 'mp4') // fxtwitter sometimes uses 'container'
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    // Helper to remove 'tag' parameter which causes open issues
    const cleanUrl = (urlStr) => {
        if (!urlStr) return '';
        try {
            const url = new URL(urlStr);
            url.searchParams.delete('tag');
            return url.toString();
        } catch (e) {
            return urlStr;
        }
    };

    return variants.map((variant) => {
        // Determine resolution label
        let qualityLabel = 'SD';
        let w = variant.width || 0;
        let h = variant.height || 0;

        // Try to extract resolution from URL if missing
        if (variant.url && (w === 0 || h === 0)) {
            // Pattern 1: /vid/1280x720/
            let match = variant.url.match(/\/vid\/(\d+)x(\d+)\//);
            // Pattern 2: /vid/avc1/1280x720/
            if (!match) match = variant.url.match(/\/vid\/avc1\/(\d+)x(\d+)\//);
            // Pattern 3: /ext_tw_video/...1280x720...
            if (!match) match = variant.url.match(/(\d{3,4})x(\d{3,4})/);

            if (match) {
                w = parseInt(match[1]);
                h = parseInt(match[2]);
            }
        }

        // Determine quality based on height OR width (for landscape videos)
        const maxDim = Math.max(w, h);
        const minDim = Math.min(w, h);

        // Use the smaller dimension (height for landscape) for quality label
        if (minDim >= 1080 || maxDim >= 1920) qualityLabel = '1080p';
        else if (minDim >= 720 || maxDim >= 1280) qualityLabel = '720p';
        else if (minDim >= 480 || maxDim >= 854) qualityLabel = '480p';
        else if (minDim >= 360 || maxDim >= 640) qualityLabel = '360p';
        else if (variant.bitrate > 0) qualityLabel = `${Math.round(variant.bitrate / 1000)}k`;

        return {
            quality: qualityLabel,
            url: cleanUrl(variant.url),
            bitrate: variant.bitrate || 0,
            width: w,
            height: h,
            content_type: variant.content_type || 'video/mp4'
        };
    });
};

export const fetchTweetInfo = async (tweetId) => {
    // Switch to fxtwitter (FixTweet) as it reliably returns video variants
    // api.fxtwitter.com/status/:id
    const API_URL = `https://api.fxtwitter.com/status/${tweetId}`;

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();

        if (!data.tweet) {
            throw new Error("Tweet not found");
        }

        const tweet = data.tweet;

        // Normalize data structure for fxtwitter
        // tweet.media.all contains the list
        const mediaList = tweet.media ? (tweet.media.all || []) : [];
        // Find first video
        const media = mediaList.find(m => m.type === 'video' || m.type === 'animated_gif');

        if (!media) {
            throw new Error("No video found in this tweet");
        }

        const variants = parseVideoVariants(media);

        // Fallback if no variants parsed but we have a main URL
        if (variants.length === 0 && media.url) {
            let fallbackUrl = media.url;
            // Clean fallback url too
            try {
                const u = new URL(fallbackUrl);
                u.searchParams.delete('tag');
                fallbackUrl = u.toString();
            } catch (e) { }

            variants.push({
                quality: 'Default',
                url: fallbackUrl,
                bitrate: 0,
                width: media.width || 0,
                height: media.height || 0,
                content_type: 'video/mp4'
            });
        }

        return {
            text: tweet.text,
            user_name: tweet.author.name,
            user_screen_name: tweet.author.screen_name,
            date: tweet.created_at,
            likes: tweet.likes,
            retweets: tweet.retweets,
            thumbnail: media.thumbnail_url || media.url,
            variants: variants,
            type: media.type
        };

    } catch (error) {
        console.error("Failed to fetch tweet info:", error);
        throw error;
    }
};
