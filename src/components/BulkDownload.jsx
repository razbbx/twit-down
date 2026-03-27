import { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Upload, FileText, Play, X, CheckCircle2, AlertCircle,
  Loader2, Download, ChevronDown, ChevronUp, Trash2, RefreshCw, Save
} from 'lucide-react';
import { extractTweetId, fetchTweetInfo } from '../utils/api';
import './BulkDownload.css';

const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
  SKIPPED: 'skipped',
};

const BulkDownload = () => {
  const [jobs, setJobs] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [preferredQuality, setPreferredQuality] = useState('Best');
  const [speed, setSpeed] = useState('fast');
  const fileInputRef = useRef(null);
  const abortRef = useRef(false);

  // ── Parse file ──────────────────────────────────────────────────────────────
  const parseFile = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    return lines.map((url, idx) => ({
      id: `job-${Date.now()}-${idx}`,
      url,
      tweetId: extractTweetId(url),
      status: STATUS.PENDING,
      data: null,
      error: null,
    }));
  };

  const loadFile = (file) => {
    if (!file || !file.name.endsWith('.txt')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseFile(e.target.result);
      setJobs(parsed);
      setExpandedId(null);
      abortRef.current = false;
    };
    reader.readAsText(file);
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    loadFile(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleDownload = async (url) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `twitdown_video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch(e) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = `twitdown_video_${Date.now()}.mp4`;
      a.rel = 'noreferrer noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // ── Run queue ────────────────────────────────────────────────────────────────
  const runQueue = async () => {
    abortRef.current = false;
    setIsRunning(true);

    // Reset errored/pending jobs to pending before running
    setJobs((prev) =>
      prev.map((j) =>
        j.status === STATUS.ERROR || j.status === STATUS.PENDING
          ? { ...j, status: STATUS.PENDING, data: null, error: null }
          : j
      )
    );

    // We need the current snapshot
    const snapshot = jobs.map((j) =>
      j.status === STATUS.ERROR || j.status === STATUS.PENDING
        ? { ...j, status: STATUS.PENDING, data: null, error: null }
        : j
    );

    let concurrency = 3;
    let delayMs = 300;
    if (speed === 'safe') { concurrency = 1; delayMs = 600; }
    if (speed === 'turbo') { concurrency = 5; delayMs = 100; }

    const pendingJobs = snapshot.filter(j => j.status !== STATUS.SUCCESS);
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < pendingJobs.length && !abortRef.current) {
        const job = pendingJobs[currentIndex++];

        if (!job.tweetId) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? { ...j, status: STATUS.SKIPPED, error: 'Not a valid Twitter/X URL' }
                : j
            )
          );
          continue;
        }

        // Mark as processing
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: STATUS.PROCESSING } : j))
        );

        try {
          const data = await fetchTweetInfo(job.tweetId);
          if (abortRef.current) break;

          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id ? { ...j, status: STATUS.SUCCESS, data } : j
            )
          );
        } catch (err) {
          if (abortRef.current) break;
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? { ...j, status: STATUS.ERROR, error: err.message || 'Failed to fetch' }
                : j
            )
          );
        }

        if (delayMs > 0 && !abortRef.current) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    };

    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    setIsRunning(false);
  };

  const stopQueue = () => { abortRef.current = true; };

  const removeJob = (id) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const retryJob = async (id) => {
    const job = jobs.find((j) => j.id === id);
    if (!job || !job.tweetId) return;
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: STATUS.PROCESSING, error: null } : j))
    );
    try {
      const data = await fetchTweetInfo(job.tweetId);

      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: STATUS.SUCCESS, data } : j))
      );
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, status: STATUS.ERROR, error: err.message } : j
        )
      );
    }
  };

  const exportLinks = () => {
    const successJobs = jobs.filter(j => j.status === STATUS.SUCCESS && j.data && j.data.variants);
    if (successJobs.length === 0) return;

    const lines = successJobs.map(job => {
      let selected = job.data.variants[0]; // defaults to best
      if (preferredQuality !== 'Best') {
        const match = job.data.variants.find(v => v.quality === preferredQuality);
        if (match) selected = match;
      }
      return selected?.url || '';
    }).filter(Boolean);

    if (lines.length === 0) return;

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `twitdown_links_${preferredQuality}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const doneCount = (stats[STATUS.SUCCESS] || 0) + (stats[STATUS.ERROR] || 0) + (stats[STATUS.SKIPPED] || 0);
  const progress = jobs.length > 0 ? (doneCount / jobs.length) * 100 : 0;

  // ── Status Icon ──────────────────────────────────────────────────────────────
  const StatusIcon = ({ status }) => {
    if (status === STATUS.PROCESSING) return <Loader2 size={16} className="spin-icon" />;
    if (status === STATUS.SUCCESS) return <CheckCircle2 size={16} className="icon-success" />;
    if (status === STATUS.ERROR) return <AlertCircle size={16} className="icon-error" />;
    if (status === STATUS.SKIPPED) return <AlertCircle size={16} className="icon-skipped" />;
    return <div className="icon-pending" />;
  };

  return (
    <div className="bulk-wrap animate-fade-in">
      {/* ── Drop Zone ── */}
      {jobs.length === 0 && (
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-glow" />
          <div className="drop-icon-wrap">
            <FileText size={36} />
          </div>
          <p className="drop-title">Drop your <span>.txt</span> file here</p>
          <p className="drop-sub">or click to browse — one URL per line</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={(e) => loadFile(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Loaded state ── */}
      {jobs.length > 0 && (
        <>
          {/* Header */}
          <div className="bulk-header">
            <div className="bulk-meta">
              <FileText size={16} />
              <span>{jobs.length} URLs loaded</span>
            </div>
            <div className="bulk-actions">
              <select
                className="quality-select"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                title="Parallel Processing Speed"
              >
                <option value="safe">Safe (1x)</option>
                <option value="fast">Fast (3x)</option>
                <option value="turbo">Turbo (5x)</option>
              </select>
              <select
                className="quality-select"
                value={preferredQuality}
                onChange={(e) => setPreferredQuality(e.target.value)}
                title="Preferred export quality"
              >
                <option value="Best">Best Quality</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
              <button
                className="btn-ghost"
                onClick={exportLinks}
                disabled={(stats[STATUS.SUCCESS] || 0) === 0}
                title="Export list for IDM/JDownloader"
              >
                <Save size={15} />
                Export TXT
              </button>
              <button
                className="btn-ghost"
                onClick={() => { setJobs([]); abortRef.current = true; }}
                title="Clear all"
              >
                <Trash2 size={15} />
                Clear
              </button>
              <button
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Load new file"
              >
                <Upload size={15} />
                New File
              </button>
              {isRunning ? (
                <button className="btn-stop" onClick={stopQueue}>
                  <X size={15} />
                  Stop
                </button>
              ) : (
                <button
                  className="btn-run"
                  onClick={runQueue}
                  disabled={jobs.every((j) => j.status === STATUS.SUCCESS) || jobs.length === 0}
                >
                  <Play size={15} />
                  {doneCount > 0 ? 'Resume' : 'Start'}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              style={{ display: 'none' }}
              onChange={(e) => loadFile(e.target.files[0])}
            />
          </div>

          {/* Progress Bar */}
          {doneCount > 0 && (
            <div className="progress-bar-wrap">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-stats">
                <span className="stat-done">{stats[STATUS.SUCCESS] || 0} done</span>
                <span className="stat-err">{stats[STATUS.ERROR] || 0} failed</span>
                <span className="stat-skip">{stats[STATUS.SKIPPED] || 0} skipped</span>
                <span className="stat-pct">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Job List */}
          <div className="job-list">
            {jobs.map((job, idx) => (
              <div key={job.id} className={`job-item job-${job.status}`}>
                {/* Row */}
                <div 
                  className={`job-row ${job.status === STATUS.SUCCESS ? 'clickable' : ''}`}
                  onClick={() => {
                    if (job.status === STATUS.SUCCESS) {
                      setExpandedId(expandedId === job.id ? null : job.id);
                    }
                  }}
                >
                  <span className="job-num">{idx + 1}</span>
                  <StatusIcon status={job.status} />
                  <span className="job-url">{job.url}</span>
                  <div className="job-btns">
                    {job.status === STATUS.ERROR && (
                      <button className="job-btn" onClick={(e) => { e.stopPropagation(); retryJob(job.id); }} title="Retry">
                        <RefreshCw size={14} />
                      </button>
                    )}
                    {job.status === STATUS.SUCCESS && (
                      <button
                        className="job-btn expand-btn"
                        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === job.id ? null : job.id); }}
                        title="Show downloads"
                      >
                        {expandedId === job.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                    <button
                      className="job-btn delete-btn"
                      onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {job.error && (
                  <p className="job-error">{job.error}</p>
                )}

                {/* Expanded variants */}
                {expandedId === job.id && job.data && (
                  <div className="job-variants animate-fade-in">
                    <div className="job-meta">
                      <img
                        src={job.data.thumbnail}
                        alt="thumb"
                        className="job-thumb"
                      />
                      <div>
                        <p className="job-author">{job.data.user_name}</p>
                        <p className="job-handle">@{job.data.user_screen_name}</p>
                      </div>
                    </div>
                    <div className="variant-grid">
                      {job.data.variants.map((v, vi) => (
                        <button
                          key={vi}
                          className="variant-btn"
                          onClick={() => handleDownload(v.url)}
                        >
                          <Download size={13} />
                          <span>{v.quality}</span>
                          {v.width > 0 && (
                            <span className="variant-res">{v.width}×{v.height}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

BulkDownload.propTypes = {};

export default BulkDownload;
