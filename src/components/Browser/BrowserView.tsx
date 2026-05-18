import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ArrowRight,
  RotateCw,
  Sparkles,
  X,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  AIShortcut,
  loadShortcuts,
  addShortcut,
  updateShortcut,
  deleteShortcut,
} from '../../browser/AIProviderRegistry';
import './BrowserView.css';

const CONTROLS_HEIGHT = 110;

interface BrowserViewProps {
  onClose: () => void;
}

interface EditState {
  mode: 'add' | 'edit';
  id?: string;
  displayName: string;
  url: string;
  color: string;
}

export default function BrowserView({ onClose }: BrowserViewProps) {
  const [shortcuts, setShortcuts] = useState<AIShortcut[]>(loadShortcuts);
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'open'>('idle');
  const [showManager, setShowManager] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const isNavigating = useRef(false);
  const isClosed = useRef(false);

  const navigate = useCallback(async (url: string) => {
    let finalUrl = url.trim();
    if (!finalUrl || isNavigating.current) return;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    isNavigating.current = true;
    setCurrentUrl(finalUrl);
    setUrlInput(finalUrl);
    setStatus('loading');

    try {
      await invoke('open_browser', { url: finalUrl, controlsHeight: CONTROLS_HEIGHT });
      setStatus('open');
    } catch (e) {
      console.error('[BrowserView] open_browser failed:', e);
      setStatus('idle');
    } finally {
      isNavigating.current = false;
    }
  }, []);

  const handleClose = useCallback(async () => {
    if (isClosed.current) return;
    isClosed.current = true;
    try { await invoke('close_browser'); } catch {}
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        urlRef.current?.focus();
        urlRef.current?.select();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        if (currentUrl) navigate(currentUrl);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentUrl, navigate]);

  useEffect(() => {
    return () => {
      if (!isClosed.current) {
        invoke('close_browser').catch(() => {});
      }
    };
  }, []);

  const openAdd = () => setEditState({ mode: 'add', displayName: '', url: '', color: '#888888' });
  const openEdit = (s: AIShortcut) =>
    setEditState({ mode: 'edit', id: s.id, displayName: s.displayName, url: s.url, color: s.color });

  const saveEdit = () => {
    if (!editState) return;
    let updated: AIShortcut[];
    if (editState.mode === 'add') {
      updated = addShortcut({ displayName: editState.displayName, url: editState.url, color: editState.color });
    } else {
      updated = updateShortcut(editState.id!, { displayName: editState.displayName, url: editState.url, color: editState.color });
    }
    setShortcuts(updated);
    setEditState(null);
  };

  const removeShortcut = (id: string) => setShortcuts(deleteShortcut(id));

  return (
    <div className="browser-view">
      <div className="browser-controls" style={{ height: CONTROLS_HEIGHT }}>
        <div className="browser-top-bar">
          <form
            onSubmit={e => { e.preventDefault(); navigate(urlInput); }}
            className="url-form"
          >
            <input
              ref={urlRef}
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Enter URL or search…"
              className="url-input"
            />
            <button type="submit" className="icon-btn" title="Go">
              <ArrowRight size={15} />
            </button>
            <button type="button" className="icon-btn" onClick={() => currentUrl && navigate(currentUrl)} title="Reload (⌘R)">
              <RotateCw size={15} />
            </button>
            <button type="button" className="icon-btn manage-btn" onClick={() => setShowManager(v => !v)} title="Manage shortcuts">
              <Sparkles size={15} />
            </button>
            <button type="button" className="icon-btn close-btn" onClick={handleClose} title="Close browser">
              <X size={15} />
            </button>
          </form>
        </div>

        <div className="shortcut-pills">
          {shortcuts.map(s => (
            <button
              key={s.id}
              className={`shortcut-pill ${currentUrl.startsWith(s.url) ? 'active' : ''}`}
              style={{ '--pill-color': s.color } as React.CSSProperties}
              onClick={() => navigate(s.url)}
              title={s.url}
            >
              {s.displayName}
            </button>
          ))}
        </div>
      </div>

      {status !== 'open' && (
        <div className="browser-empty">
          {status === 'loading' ? (
            <><div className="spinner" /><span>Loading…</span></>
          ) : (
            <span className="empty-hint">Pick a shortcut or enter a URL above</span>
          )}
        </div>
      )}

      {showManager && (
        <div className="manager-panel">
          <div className="manager-header">
            <span>Manage Shortcuts</span>
            <button className="icon-btn" onClick={() => setShowManager(false)}>
              <X size={14} />
            </button>
          </div>

          <div className="manager-list">
            {shortcuts.map(s => (
              <div key={s.id} className="manager-item">
                <span className="pill-dot" style={{ background: s.color }} />
                <span className="item-name">{s.displayName}</span>
                <span className="item-url">{s.url}</span>
                <button className="action-btn" onClick={() => openEdit(s)}>
                  <Pencil size={11} />
                  <span>Edit</span>
                </button>
                <button className="action-btn danger" onClick={() => removeShortcut(s.id)}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <button className="add-btn" onClick={openAdd}>
            <Plus size={13} /> Add Shortcut
          </button>
        </div>
      )}

      {editState && (
        <div className="modal-overlay" onClick={() => setEditState(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editState.mode === 'add' ? 'Add Shortcut' : 'Edit Shortcut'}</div>
            <label>Name
              <input
                value={editState.displayName}
                onChange={e => setEditState(p => p ? { ...p, displayName: e.target.value } : p)}
                placeholder="e.g. ChatGPT"
              />
            </label>
            <label>URL
              <input
                value={editState.url}
                onChange={e => setEditState(p => p ? { ...p, url: e.target.value } : p)}
                placeholder="https://..."
              />
            </label>
            <label>Color
              <input
                type="color"
                value={editState.color}
                onChange={e => setEditState(p => p ? { ...p, color: e.target.value } : p)}
              />
            </label>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setEditState(null)}>Cancel</button>
              <button className="modal-save" onClick={saveEdit} disabled={!editState.displayName || !editState.url}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
