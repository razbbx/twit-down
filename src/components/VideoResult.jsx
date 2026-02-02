import PropTypes from 'prop-types';
import { Download, ArrowLeft, Heart, Repeat2, Play, Check } from 'lucide-react';
import './VideoResult.css';

const VideoResult = ({ data, onReset }) => {

    const handleDownload = (variant) => {
        if (!variant?.url) return;
        // Use anchor with noreferrer to prevent 403 from Twitter CDN
        const a = document.createElement('a');
        a.href = variant.url;
        a.target = '_blank';
        a.rel = 'noreferrer noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="video-result animate-slide-up">
            {/* Back Button */}
            <button onClick={onReset} className="back-button">
                <ArrowLeft size={18} />
                <span>New Search</span>
            </button>

            {/* Video Card */}
            <div className="video-card glass">
                {/* Thumbnail */}
                <div className="thumbnail-container">
                    <img
                        src={data.thumbnail}
                        alt="Video thumbnail"
                        className="thumbnail"
                    />
                    <div className="thumbnail-overlay">
                        <div className="play-icon">
                            <Play size={32} fill="white" />
                        </div>
                    </div>
                    {data.type === 'animated_gif' && (
                        <span className="gif-badge">GIF</span>
                    )}
                </div>

                {/* Content */}
                <div className="video-content">
                    {/* Author */}
                    <div className="author-row">
                        <div className="author-info">
                            <span className="author-name">{data.user_name}</span>
                            <span className="author-handle">@{data.user_screen_name}</span>
                        </div>
                        <div className="stats">
                            <div className="stat">
                                <Heart size={14} />
                                <span>{formatNumber(data.likes)}</span>
                            </div>
                            <div className="stat">
                                <Repeat2 size={14} />
                                <span>{formatNumber(data.retweets)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tweet Text */}
                    {data.text && (
                        <p className="tweet-text">{data.text}</p>
                    )}

                    {/* Quality List */}
                    <div className="quality-section">
                        <h4 className="quality-heading">Select Quality</h4>
                        <div className="quality-list">
                            {data.variants.map((variant, index) => (
                                <button
                                    key={index}
                                    className="quality-item"
                                    onClick={() => handleDownload(variant)}
                                >
                                    <div className="quality-info">
                                        <span className="quality-label">{variant.quality}</span>
                                        {variant.width > 0 && (
                                            <span className="quality-resolution">
                                                {variant.width}×{variant.height}
                                            </span>
                                        )}
                                    </div>
                                    <div className="quality-action">
                                        <Download size={16} />
                                        <span>Download</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

VideoResult.propTypes = {
    data: PropTypes.shape({
        text: PropTypes.string,
        user_name: PropTypes.string,
        user_screen_name: PropTypes.string,
        likes: PropTypes.number,
        retweets: PropTypes.number,
        thumbnail: PropTypes.string,
        variants: PropTypes.array.isRequired,
        type: PropTypes.string,
    }).isRequired,
    onReset: PropTypes.func.isRequired,
};

export default VideoResult;
