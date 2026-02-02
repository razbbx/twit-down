import { useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import VideoResult from './components/VideoResult';
import { fetchTweetInfo } from './utils/api';
import { Zap } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [tweetData, setTweetData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (tweetId) => {
    setLoading(true);
    setError('');
    setTweetData(null);

    try {
      const data = await fetchTweetInfo(tweetId);
      setTweetData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not fetch video. Please check the link.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTweetData(null);
    setError('');
  };

  return (
    <div className="app-container">
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className={`header ${tweetData ? 'minimized' : ''}`}>
          <div className="badge">
            <Zap size={12} />
            <span>Ultra Fast</span>
          </div>

          <h1 className="title">
            <span className="title-main">Twit</span>
            <span className="title-accent">Down</span>
          </h1>

          {!tweetData && !loading && (
            <p className="subtitle animate-fade-in">
              Download <strong>HD videos</strong> from Twitter/X instantly.
              Just paste the link and go.
            </p>
          )}
        </header>

        {/* Search Bar - only show when no result */}
        {!tweetData && (
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        )}

        {/* Loading State */}
        {loading && !tweetData && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Fetching Video</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="error-message">{error}</p>
        )}

        {/* Video Result */}
        {tweetData && (
          <VideoResult data={tweetData} onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        © {new Date().getFullYear()} TwitDown
      </footer>
    </div>
  );
}

export default App;
