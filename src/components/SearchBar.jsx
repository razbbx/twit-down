import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, Loader2, ClipboardPaste } from 'lucide-react';
import { extractTweetId } from '../utils/api';
import './SearchBar.css';

const SearchBar = ({ onSearch, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      setError('Please enter a valid Twitter/X video URL');
      return;
    }

    onSearch(tweetId);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError('');
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form animate-fade-in">
      <div className={`search-container ${isFocused ? 'focused' : ''} ${error ? 'has-error' : ''}`}>
        <div className="search-glow"></div>
        <div className="search-inner">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste Twitter/X video link..."
            className="search-input"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="button"
            className="paste-button"
            onClick={handlePaste}
            disabled={isLoading}
            title="Paste from clipboard"
          >
            <ClipboardPaste size={18} />
          </button>
          <button
            type="submit"
            className="search-button"
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Search size={20} />
            )}
          </button>
        </div>
      </div>
      {error && <p className="search-error animate-shake">{error}</p>}
    </form>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default SearchBar;

