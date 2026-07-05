import { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Globe } from 'lucide-react';
import { useSettingsStore, AIProvider } from '../store/useSettingsStore';
import styles from './AIProviderCRUD.module.css';

const EMPTY_FORM: Partial<AIProvider> = {
    name: '',
    url: 'https://',
    jsInjectionScript: '',
};

export default function AIProviderCRUD() {
    const { providers, addProvider, deleteProvider, updateProvider } = useSettingsStore();
    const customProviders = providers.filter((p) => !p.isBuiltIn);

    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState<Partial<AIProvider>>(EMPTY_FORM);
    const [addError, setAddError] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<AIProvider>>({});

    const [testState, setTestState] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'fail'>>({});

    const testUrl = (id: string, url: string) => {
        setTestState((s) => ({ ...s, [id]: 'testing' }));
        setTimeout(() => {
            const ok = url.startsWith('http://') || url.startsWith('https://');
            setTestState((s) => ({ ...s, [id]: ok ? 'ok' : 'fail' }));
            setTimeout(() => setTestState((s) => ({ ...s, [id]: 'idle' })), 2500);
        }, 1000);
    };

    const handleAdd = () => {
        if (!addForm.name?.trim()) { setAddError('Name is required'); return; }
        if (!addForm.url?.trim() || addForm.url === 'https://') { setAddError('A valid URL is required'); return; }
        addProvider({
            id: `custom-${Date.now()}`,
            name: addForm.name.trim(),
            url: addForm.url.trim(),
            jsInjectionScript: addForm.jsInjectionScript || '',
            isBuiltIn: false,
        });
        setAddForm(EMPTY_FORM);
        setIsAdding(false);
        setAddError('');
    };

    const handleSaveEdit = (id: string) => {
        updateProvider(id, editForm);
        setEditingId(null);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Custom AI Providers</h3>
            <p className={styles.desc}>
                Add any AI site Whisper should open. Speech will be injected into the text input using the CSS selector you specify.
            </p>

            {customProviders.length === 0 && !isAdding && (
                <div className={styles.empty}>
                    <Globe size={32} color="var(--color-text-muted)" />
                    <span>No custom providers yet. Add one below.</span>
                </div>
            )}

            <div className={styles.list}>
                {customProviders.map((p) => (
                    <div key={p.id} className={styles.providerCard}>
                        {editingId === p.id ? (
                            <div className={styles.editForm}>
                                <input
                                    className={styles.editInput}
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="Provider Name"
                                />
                                <input
                                    className={styles.editInput}
                                    value={editForm.url || ''}
                                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                                    placeholder="https://..."
                                />
                                <textarea
                                    className={styles.editTextarea}
                                    value={editForm.jsInjectionScript || ''}
                                    onChange={(e) => setEditForm({ ...editForm, jsInjectionScript: e.target.value })}
                                    placeholder="JS Injection Script — __PROMPT__ is replaced with the spoken text"
                                    rows={3}
                                />
                                <div className={styles.editActions}>
                                    <button type="button" className={styles.saveBtn} onClick={() => handleSaveEdit(p.id)}>
                                        Save
                                    </button>
                                    <button type="button" className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.providerRow}>
                                <div className={styles.providerMeta}>
                                    <div className={styles.providerName}>{p.name}</div>
                                    <div className={styles.providerUrl}>{p.url}</div>
                                </div>
                                <div className={styles.providerActions}>
                                    {testState[p.id] === 'testing' && <span className={styles.testHint}>Testing…</span>}
                                    {testState[p.id] === 'ok' && <CheckCircle size={14} color="var(--color-success)" />}
                                    {testState[p.id] === 'fail' && <XCircle size={14} color="var(--color-danger)" />}
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        title="Test URL"
                                        onClick={() => testUrl(p.id, p.url)}
                                    >
                                        <Globe size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        title="Edit"
                                        onClick={() => { setEditingId(p.id); setEditForm(p); }}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                        title="Delete"
                                        onClick={() => deleteProvider(p.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isAdding ? (
                <div className={styles.addForm}>
                    <div className={styles.addFormTitle}>New Custom AI Provider</div>
                    {addError && <div className={styles.addError}>{addError}</div>}
                    <input
                        className={styles.editInput}
                        value={addForm.name || ''}
                        onChange={(e) => { setAddForm({ ...addForm, name: e.target.value }); setAddError(''); }}
                        placeholder="Provider name (e.g. My Company AI)"
                        autoFocus
                    />
                    <input
                        className={styles.editInput}
                        value={addForm.url || ''}
                        onChange={(e) => { setAddForm({ ...addForm, url: e.target.value }); setAddError(''); }}
                        placeholder="https://ai.mycompany.com"
                    />
                    <textarea
                        className={styles.editTextarea}
                        value={addForm.jsInjectionScript || ''}
                        onChange={(e) => setAddForm({ ...addForm, jsInjectionScript: e.target.value })}
                        placeholder="Optional — JS injection script. __PROMPT__ is replaced with the spoken text."
                        rows={3}
                    />
                    <div className={styles.editActions}>
                        <button type="button" className={styles.saveBtn} onClick={handleAdd}>
                            <Plus size={13} /> Save Provider
                        </button>
                        <button type="button" className={styles.cancelBtn} onClick={() => { setIsAdding(false); setAddError(''); setAddForm(EMPTY_FORM); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" className={styles.addBtn} onClick={() => setIsAdding(true)}>
                    <Plus size={14} /> Add Custom AI Provider
                </button>
            )}
        </div>
    );
}
