import { useState } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import VideoResult from './components/VideoResult';
import BulkDownload from './components/BulkDownload';
import { fetchTweetInfo } from './utils/api';
import { Zap, Link2, Files } from 'lucide-react';

const TAB_SINGLE = 'single';
const TAB_BULK   = 'bulk';

function App() {
  const [tab, setTab]           = useState(TAB_SINGLE);
  const [loading, setLoading]   = useState(false);
  const [tweetData, setTweetData] = useState(null);
  const [error, setError]       = useState('');

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

  const switchTab = (t) => {
    setTab(t);
    handleReset();
  };

  const isMinimized = tweetData !== null;

  return (
    <div className="app-container">
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className={`header ${isMinimized ? 'minimized' : ''}`}>
          <div className="badge">
            <Zap size={12} />
            <span>Ultra Fast</span>
          </div>

          <h1 className="title">
            <span className="title-main">Twit</span>
            <span className="title-accent">Down</span>
          </h1>

          {!isMinimized && !loading && (
            <p className="subtitle animate-fade-in">
              Download <strong>HD videos</strong> from Twitter/X instantly.
              Single link or bulk — your call.
            </p>
          )}
        </header>

        {/* Tabs */}
        {!isMinimized && (
          <div className="tabs animate-fade-in">
            <button
              className={`tab-btn ${tab === TAB_SINGLE ? 'active' : ''}`}
              onClick={() => switchTab(TAB_SINGLE)}
            >
              <Link2 size={15} />
              Single Link
            </button>
            <button
              className={`tab-btn ${tab === TAB_BULK ? 'active' : ''}`}
              onClick={() => switchTab(TAB_BULK)}
            >
              <Files size={15} />
              Bulk (.txt)
            </button>
          </div>
        )}

        {/* ── Single Tab ── */}
        {tab === TAB_SINGLE && (
          <>
            {!tweetData && (
              <SearchBar onSearch={handleSearch} isLoading={loading} />
            )}

            {loading && !tweetData && (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Fetching Video</p>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            {tweetData && (
              <VideoResult data={tweetData} onReset={handleReset} />
            )}
          </>
        )}

        {/* ── Bulk Tab ── */}
        {tab === TAB_BULK && <BulkDownload />}
      </div>

      {/* Footer */}
      <footer className="footer">
        © {new Date().getFullYear()} TwitDown
      </footer>
    </div>
  );
}

export default App;
