import React, { useState } from 'react';
import './SearchInput.css';

/**
 * SearchInput component for the Quillium UI
 * @param {Object} props - Component props
 * @param {string} props.placeholder - Input placeholder
 * @param {Function} props.onSearch - Search handler
 * @param {boolean} props.loading - Whether the search is loading
 * @returns {JSX.Element} - SearchInput component
 */
const SearchInput = ({
  placeholder = 'Ask a question...',
  onSearch,
  loading = false,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query);
    }
  };

  return (
    <form className="quillium-search-input" onSubmit={handleSubmit}>
      <input
        type="text"
        className="quillium-search-input__field"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={loading}
      />
      <button 
        type="submit" 
        className="quillium-search-input__button"
        disabled={loading || !query.trim()}
      >
        {loading ? (
          <span className="quillium-search-input__spinner"></span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        )}
      </button>
    </form>
  );
};

export default SearchInput;
