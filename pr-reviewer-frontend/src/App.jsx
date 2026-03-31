import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import ReviewForm from './components/ReviewForm';
import ReviewResult from './components/ReviewResult';
import LoadingState from './components/LoadingState';
import { exportReviewAsPDF } from './utils/exportPDF';
import toast from 'react-hot-toast';
import './App.css';

const FEATURES = [
  { name: 'Bug Detection', desc: 'Finds potential errors and logical flaws' },
  { name: 'Security Scan', desc: 'Identifies vulnerabilities and leaked secrets' },
  { name: 'AI Summary', desc: 'Generates a human-friendly overview of changes' },
  { name: 'Complexity Score', desc: 'Measures code maintainability' },
  { name: 'Test Gap Analysis', desc: 'Finds untested code paths' },
  { name: 'Impact Analysis', desc: 'Maps which modules, functions, and files are affected by the change — so nothing slips through review.' },
];

function App() {
  const [prUrl, setPrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);

  const chunkArray = (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // ReviewForm is now on the Right side.
  // When it expands, Right side features move to Left side.
  // Masonry auto-arranges all items — no manual column assignment needed
  const leftFeatures  = isListExpanded
    ? [FEATURES[0], FEATURES[1], FEATURES[2], FEATURES[3], FEATURES[4]]
    : [FEATURES[2], FEATURES[3]];
  const rightFeatures = isListExpanded
    ? []
    : [FEATURES[0], FEATURES[1], FEATURES[4]];

  const renderFeatures = (features, baseDelay) => {
    const rows = chunkArray(features, 2);
    return rows.map((row, rowIndex) => {
      if (row.length === 2) {
        return (
          <div className="masonry-subgrid" key={`row-${row[0].name}`}>
            {row.map((f, i) => (
              <motion.div
                layout
                layoutId={`feat-${f.name}`}
                key={f.name}
                className="bento-item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  layout: { type: 'spring', bounce: 0.2, duration: 0.6 },
                  opacity: { delay: baseDelay + rowIndex * 0.1 + i * 0.05, duration: 0.4 }
                }}
              >
                <div className="bento-item-title">{f.name}</div>
                <div className="bento-item-desc">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        );
      } else {
        const f = row[0];
        return (
          <motion.div
            layout
            layoutId={`feat-${f.name}`}
            key={f.name}
            className="bento-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              layout: { type: 'spring', bounce: 0.2, duration: 0.6 },
              opacity: { delay: baseDelay + rowIndex * 0.1, duration: 0.4 }
            }}
          >
            <div className="bento-item-title">{f.name}</div>
            <div className="bento-item-desc">{f.desc}</div>
          </motion.div>
        );
      }
    });
  };

  const handleReset = () => {
    setPrUrl('');
    setResult(null);
  };

  const handleExport = async () => {
    if (!result) return;
    setExporting(true);
    const toastId = toast.loading('Generating PDF...');
    try {
      await exportReviewAsPDF(result);
      toast.success('PDF Exported', { id: toastId });
    } catch {
      toast.error('Failed to export PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const showResults = result && !loading;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface-color)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            borderRadius: '8px',
            border: '2px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          },
        }}
      />

      <AnimatePresence mode="wait">
        {showResults ? (
          /* ── Results mode ── */
          <motion.div
            key="results"
            className="app-results-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="app-navbar">
              <div className="app-navbar-inner container">
                <button className="btn btn-secondary" onClick={handleReset}>
                  <ArrowLeft size={14} />
                  New Review
                </button>
                <span className="app-navbar-brand">PR Reviewer</span>
                <span className="app-navbar-spacer" />
                <button
                  className="btn btn-secondary"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download size={14} />
                  {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
            </nav>

            <main className="app-results-main container">
              <ReviewResult result={result} onReset={handleReset} />
            </main>
          </motion.div>
        ) : loading ? (
          /* ── Loading mode ── */
          <motion.div
            key="loading"
            className="app-loading-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingState />
          </motion.div>
        ) : (
          /* ── Landing mode ── */
          <motion.div
            key="landing"
            className="app-landing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
              <main className="app-hero-main">
                <div className="masonry-grid">

                  {/* Hero card */}
                  <motion.div
                    layout
                    className="bento-item masonry-item"
                    style={{ textAlign: 'center', padding: '56px 32px' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                  >
                    <h1 style={{ marginBottom: 8 }}>PR Reviewer</h1>
                    <p className="app-tagline">AI-powered code review ✧</p>
                  </motion.div>

                  {/* Search form */}
                  <motion.div layout className="bento-item masonry-item">
                    <ReviewForm
                      prUrl={prUrl}
                      setPrUrl={setPrUrl}
                      setLoading={setLoading}
                      setResult={setResult}
                      setError={toast.error}
                      onExpandChange={setIsListExpanded}
                    />
                  </motion.div>

                  {/* Right-side features (Bug Detection, Security Scan, Test Gap) */}
                  {renderFeatures(rightFeatures, 0.3)}

                  {/* Left-side features (AI Summary, Complexity Score) */}
                  {renderFeatures(leftFeatures, 0.2)}

                  {/* Impact Analysis — always visible rich card */}
                  <motion.div
                    layout
                    className="bento-item bento-impact masonry-item"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <div className="bento-item-title">Impact Analysis</div>
                    <p className="bento-item-desc">Understand the full blast radius of every PR before it merges.</p>
                    <ul className="impact-list">
                      <li>Maps affected modules, functions &amp; files</li>
                      <li>Flags downstream dependencies at risk</li>
                      <li>Highlights breaking changes across layers</li>
                    </ul>
                  </motion.div>

                  {/* Built for — always visible */}
                  <motion.div
                    layout
                    className="bento-item bento-use-case masonry-item"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <div className="use-case-label">Built for</div>
                    <p className="use-case-subtitle">Whether you're shipping solo or coordinating a team — AI review fits right into your workflow.</p>
                    <div className="use-case-chips">
                      <span className="use-case-chip">Solo devs</span>
                      <span className="use-case-chip">Teams</span>
                      <span className="use-case-chip">Open Source</span>
                      <span className="use-case-chip">Fast-moving PRs</span>
                    </div>
                  </motion.div>

                </div>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
