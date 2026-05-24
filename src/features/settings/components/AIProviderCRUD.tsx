import { useState } from 'react';
import { useSettingsStore, AIProvider } from '../store/useSettingsStore';
import styles from './AIProviderCRUD.module.css';

export default function AIProviderCRUD() {
    const { providers, addProvider, deleteProvider, updateProvider } = useSettingsStore();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<AIProvider>>({});

    const handleAdd = () => {
        const newId = `custom-${Date.now()}`;
        addProvider({
            id: newId,
            name: 'New Provider',
            url: 'https://',
            jsInjectionScript: ''
        });
        setIsEditing(newId);
        setEditForm({ name: 'New Provider', url: 'https://', jsInjectionScript: '' });
    };

    const handleSave = (id: string) => {
        updateProvider(id, editForm);
        setIsEditing(null);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>AI Providers</h3>

            <div className={styles.list}>
                {providers.map(p => (
                    <div key={p.id} className={styles.providerCard}>
                        {isEditing === p.id ? (
                            <div className={styles.editForm}>
                                <input
                                    className={styles.editInput}
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    placeholder="Name"
                                />
                                <input
                                    className={styles.editInput}
                                    value={editForm.url || ''}
                                    onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                    placeholder="URL"
                                />
                                <textarea
                                    className={styles.editTextarea}
                                    value={editForm.jsInjectionScript || ''}
                                    onChange={e => setEditForm({ ...editForm, jsInjectionScript: e.target.value })}
                                    placeholder="JS Injection Script (__PROMPT__ is replaced with actual text)"
                                />
                                <div className={styles.editActions}>
                                    <button type="button" className={styles.saveBtn} onClick={() => handleSave(p.id)}>Save</button>
                                    <button type="button" className={styles.cancelBtn} onClick={() => setIsEditing(null)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.providerRow}>
                                <div className={styles.providerMeta}>
                                    <div className={styles.providerName}>{p.name}</div>
                                    <div className={styles.providerUrl}>{p.url}</div>
                                </div>
                                <div className={styles.providerActions}>
                                    <button
                                        type="button"
                                        className={styles.editBtn}
                                        onClick={() => { setIsEditing(p.id); setEditForm(p); }}
                                    >
                                        Edit
                                    </button>
                                    {providers.length > 1 && (
                                        <button
                                            type="button"
                                            className={styles.deleteBtn}
                                            onClick={() => deleteProvider(p.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                type="button"
                className={styles.addBtn}
                onClick={handleAdd}
            >
                + Add Custom AI Provider
            </button>
        </div>
    );
}
