import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, User, GitBranch } from 'lucide-react';
import './ReviewForm.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005';
const PR_URL_REGEX = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+/;
// Matches any GitHub URL that contains owner/repo — may have extra path/query after
const REPO_URL_REGEX = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:[/?#].*)?$/;

export default function ReviewForm({ prUrl, setPrUrl, setLoading, setResult, setError, onExpandChange }) {
  const [inputFocused, setInputFocused] = useState(false);
  const [prs, setPrs] = useState([]);
  const [fetchingPrs, setFetchingPrs] = useState(false);

  useEffect(() => {
    if (onExpandChange) onExpandChange(prs.length > 0);
  }, [prs.length, onExpandChange]);

  const trimmed = prUrl.trim();
  const isPrUrl = PR_URL_REGEX.test(trimmed);
  // Only show repo-search mode when it's a GitHub URL but NOT a PR URL
  const isRepoUrl = !isPrUrl && REPO_URL_REGEX.test(trimmed);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!trimmed) {
      toast.error('Please paste a GitHub PR or repo URL.');
      return;
    }

    // If it's a repo URL, fetch PRs instead of trying to review
    if (isRepoUrl) {
      handleFetchPRs();
      return;
    }

    if (!PR_URL_REGEX.test(trimmed)) {
      toast.error('Paste a GitHub PR link (e.g. .../pull/123) or a repo link to browse PRs.');
      return;
    }

    setLoading(true);
    setPrs([]);

    try {
      const { data } = await axios.post(`${API_BASE}/api/review`, {
        prUrl: trimmed,
      });
      setResult(data);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        'Something went wrong';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPRs = async (overrideUrl) => {
    setFetchingPrs(true);
    setPrs([]);
    const targetUrl = overrideUrl || trimmed;
    try {
      // Normalize: extract just https://github.com/owner/repo, strip .git suffix and extra path/query
      const repoMatch = targetUrl.match(REPO_URL_REGEX);
      const cleanRepoUrl = repoMatch
        ? `https://github.com/${repoMatch[1]}/${repoMatch[2].replace(/\.git$/, '')}`
        : targetUrl;
      const { data } = await axios.get(
        `${API_BASE}/api/repo-prs?repoUrl=${encodeURIComponent(cleanRepoUrl)}`
      );
      if (data.prs.length === 0) {
        toast('No open pull requests found in this repo.', { icon: 'ℹ️' });
      } else {
        setPrs(data.prs);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch pull requests');
    } finally {
      setFetchingPrs(false);
    }
  };

  const handleSelectPR = (pr) => {
    setPrUrl(pr.url);
    setPrs([]);
  };

  const handleInputChange = (e) => {
    setPrUrl(e.target.value);
    if (prs.length > 0 && !fetchingPrs) setPrs([]);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text').trim();
    const isPastedPrUrl = PR_URL_REGEX.test(pastedText);
    const isPastedRepoUrl = !isPastedPrUrl && REPO_URL_REGEX.test(pastedText);
    
    // Automatically fetch PRs if user pasted a repository URL
    if (isPastedRepoUrl) {
      handleFetchPRs(pastedText);
    }
  };

  return (
    <div className="review-form-wrapper">
      <form className="review-form" onSubmit={handleSubmit}>
        <motion.div
          className={`review-form-input-wrap ${inputFocused ? 'focused' : ''}`}
          animate={inputFocused ? { scale: 1.02, y: -2 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <input
            id="pr-url-input"
            type="text"
            className="input review-form-input"
            placeholder="Paste a PR link or full GitHub repo link..."
            value={prUrl}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            spellCheck="false"
            autoFocus
          />
          <AnimatePresence mode="wait">
            {isRepoUrl && (
              <motion.button
                key="fetch-btn"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="button"
                className="btn btn-primary review-form-btn"
                onClick={() => handleFetchPRs()}
                disabled={fetchingPrs}
                title="Find open pull requests"
              >
                {fetchingPrs ? (
                  <span className="review-form-spinner" />
                ) : (
                  <Search size={18} />
                )}
              </motion.button>
            )}
            {isPrUrl && (
              <motion.button
                key="submit-btn"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                id="analyze-btn"
                type="submit"
                className="btn btn-primary review-form-btn"
              >
                <ArrowRight size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {(isRepoUrl || isPrUrl) && (
          <motion.p
            className="review-form-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {isRepoUrl
              ? 'Repo detected — click search to browse open PRs'
              : 'PR URL ready — click arrow to start review'}
          </motion.p>
        )}
      </form>

      {/* PR list dropdown */}
      <AnimatePresence>
        {prs.length > 0 && (
          <motion.div
            className="pr-list"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ opacity: { duration: 0.2 }, height: { duration: 0.4, type: 'spring', bounce: 0 }, y: { duration: 0.4, type: 'spring', bounce: 0 } }}
            style={{ transformOrigin: 'top center' }}
          >
            <div className="pr-list-sections">
              {prs.filter(pr => pr.quality === 'Good PR').length > 0 && (
                <div className="pr-list-section">
                  <p className="pr-list-header good-header">
                    <span className="pr-header-icon-wrap">👍</span>
                    READY FOR REVIEW
                  </p>
                  <ul className="pr-list-items">
                    {prs.filter(pr => pr.quality === 'Good PR').map((pr) => (
                      <li key={pr.number}>
                        <button
                          type="button"
                          className="pr-list-item"
                          onClick={() => handleSelectPR(pr)}
                        >
                          <span className="pr-list-item-number">#{pr.number}</span>
                          <span className="pr-list-item-title">{pr.title}</span>
                          <span className="pr-list-item-meta">
                            <User size={11} />
                            {pr.author}
                            <GitBranch size={11} />
                            {pr.head} → {pr.base}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prs.filter(pr => pr.quality !== 'Good PR').length > 0 && (
                <div className="pr-list-section">
                  <p className="pr-list-header bad-header">
                    <span className="pr-header-icon-wrap">⚠️</span>
                    DRAFT / WIP / NO DESCRIPTION
                  </p>
                  <ul className="pr-list-items">
                    {prs.filter(pr => pr.quality !== 'Good PR').map((pr) => (
                      <li key={pr.number}>
                        <button
                          type="button"
                          className="pr-list-item"
                          onClick={() => handleSelectPR(pr)}
                        >
                          <span className="pr-list-item-number bad-number">#{pr.number}</span>
                          <span className="pr-list-item-title">{pr.title}</span>
                          <span className="pr-list-item-meta">
                            <User size={11} />
                            {pr.author}
                            <GitBranch size={11} />
                            {pr.head} → {pr.base}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
