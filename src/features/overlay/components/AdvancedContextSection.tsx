import { FileText, Briefcase, Building, Eye, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useOverlayStore } from "../store/overlayStore";
import styles from "./AdvancedContextSection.module.css";

export default function AdvancedContextSection() {
    const {
        context,
        advancedContextExpanded,
        setContextText,
        setContextActive,
        setAdvancedContextExpanded,
    } = useOverlayStore();

    const handleTextChange = (key: "resume" | "jobDescription" | "company", text: string, limit: number) => {
        if (text.length <= limit) {
            setContextText(key, text);
        }
    };

    const isAnyActive = context.resume.active || context.jobDescription.active || context.company.active;
    const totalChars =
        (context.resume.active ? context.resume.text.length : 0) +
        (context.jobDescription.active ? context.jobDescription.text.length : 0) +
        (context.company.active ? context.company.text.length : 0);

    const getPreviewText = () => {
        let p = "";
        if (context.resume.active && context.resume.text) {
            p += `[RESUME CONTEXT - ACTIVE]\n"${context.resume.text.substring(0, 140)}${context.resume.text.length > 140 ? "..." : ""}"\n\n`;
        }
        if (context.jobDescription.active && context.jobDescription.text) {
            p += `[JOB DESCRIPTION - ACTIVE]\n"${context.jobDescription.text.substring(0, 140)}${context.jobDescription.text.length > 140 ? "..." : ""}"\n\n`;
        }
        if (context.company.active && context.company.text) {
            p += `[COMPANY CONTEXT - ACTIVE]\n"${context.company.text.substring(0, 140)}${context.company.text.length > 140 ? "..." : ""}"\n\n`;
        }
        p += `QUESTION: "[captured transcript]"`;
        return p;
    };

    return (
        <div className={styles.section}>
            <div className={styles.header} onClick={() => setAdvancedContextExpanded(!advancedContextExpanded)}>
                <div className={styles.title}>
                    <Briefcase size={18} color="var(--color-accent)" />
                    <span>3. Advanced Context (Optional)</span>
                </div>
                <div className={styles.toggleLabel}>
                    <span>{advancedContextExpanded ? "Collapse" : "Expand"}</span>
                    {advancedContextExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </div>
            <div className={styles.subtitle}>
                Add resume, job description, or company info to personalize AI responses.
            </div>

            {advancedContextExpanded && (
                <div className={styles.content}>
                    <div className={styles.cardContainer}>
                        <div className={`${styles.card} ${context.resume.active ? styles.activeCard : ""}`}>
                            <div className={styles.cardHeader}>
                                <FileText size={14} color="var(--color-accent)" />
                                <span>Resume</span>
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Paste your resume text here..."
                                value={context.resume.text}
                                onChange={(e) => handleTextChange("resume", e.target.value, context.resume.charLimit)}
                            />
                            <div className={styles.cardFooter}>
                                <span className={styles.charCount}>
                                    {context.resume.text.length} / {context.resume.charLimit}
                                </span>
                                <div className={styles.switchWrap} onClick={() => setContextActive("resume", !context.resume.active)}>
                                    <div className={`${styles.switch} ${context.resume.active ? styles.switchActive : ""}`} />
                                    <span className={styles.switchLabel}>{context.resume.active ? "Active" : "Inactive"}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.card} ${context.jobDescription.active ? styles.activeCard : ""}`}>
                            <div className={styles.cardHeader}>
                                <Briefcase size={14} color="var(--color-accent)" />
                                <span>Job Description</span>
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Paste the job description..."
                                value={context.jobDescription.text}
                                onChange={(e) => handleTextChange("jobDescription", e.target.value, context.jobDescription.charLimit)}
                            />
                            <div className={styles.cardFooter}>
                                <span className={styles.charCount}>
                                    {context.jobDescription.text.length} / {context.jobDescription.charLimit}
                                </span>
                                <div className={styles.switchWrap} onClick={() => setContextActive("jobDescription", !context.jobDescription.active)}>
                                    <div className={`${styles.switch} ${context.jobDescription.active ? styles.switchActive : ""}`} />
                                    <span className={styles.switchLabel}>{context.jobDescription.active ? "Active" : "Inactive"}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.card} ${context.company.active ? styles.activeCard : ""}`}>
                            <div className={styles.cardHeader}>
                                <Building size={14} color="var(--color-accent)" />
                                <span>Company Info</span>
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Paste company details, culture..."
                                value={context.company.text}
                                onChange={(e) => handleTextChange("company", e.target.value, context.company.charLimit)}
                            />
                            <div className={styles.cardFooter}>
                                <span className={styles.charCount}>
                                    {context.company.text.length} / {context.company.charLimit}
                                </span>
                                <div className={styles.switchWrap} onClick={() => setContextActive("company", !context.company.active)}>
                                    <div className={`${styles.switch} ${context.company.active ? styles.switchActive : ""}`} />
                                    <span className={styles.switchLabel}>{context.company.active ? "Active" : "Inactive"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isAnyActive && (
                        <div className={styles.previewContainer}>
                            <div className={styles.previewTitle}>
                                <Eye size={14} color="var(--color-accent)" />
                                <span>Context Injection Preview</span>
                            </div>
                            <div className={styles.previewBox}>{getPreviewText()}</div>
                            <div className={styles.previewFooter}>
                                <span>Total context size: {totalChars} chars</span>
                                {totalChars > 8000 && <span style={{ color: "var(--color-warning)", display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14} /> Large context may slow AI responses</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
