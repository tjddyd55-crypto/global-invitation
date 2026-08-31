'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { adminApiJson } from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

type SectionRow = { id: string; enabled: boolean; notes?: string };

const DEFAULT_SECTIONS: SectionRow[] = [
  'HERO',
  'HOST_INFO',
  'EVENT_INFO',
  'MESSAGE',
  'GALLERY',
  'LOCATION',
  'ACCOUNT',
  'RSVP',
  'FOOTER',
].map((id) => ({ id, enabled: true }));

export default function AdminVisualTemplateNewPage() {
  const [concept, setConcept] = useState('WEDDING');
  const [displayName, setDisplayName] = useState('Romantic Garden');
  const [templateKey, setTemplateKey] = useState('WEDDING_07_ROMANTIC_GARDEN');
  const [visualDirection, setVisualDirection] = useState(
    'Soft romantic garden wedding. Warm ivory and sage. Mobile-first letter layout.'
  );
  const [primaryColor, setPrimaryColor] = useState('#5c6b4a');
  const [secondaryColor, setSecondaryColor] = useState('#f3efe6');
  const [sections, setSections] = useState<SectionRow[]>(DEFAULT_SECTIONS);
  const [prompt, setPrompt] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const enabledCount = useMemo(() => sections.filter((s) => s.enabled).length, [sections]);

  async function suggestKey() {
    const res = await adminApiJson<{ templateKey: string }>('/api/admin/visual-templates/suggest-key', {
      method: 'POST',
      body: JSON.stringify({ concept, displayName }),
    });
    setTemplateKey(res.templateKey);
  }

  async function generatePrompt() {
    const res = await adminApiJson<{ prompt: string }>('/api/admin/visual-templates/design-prompt', {
      method: 'POST',
      body: JSON.stringify({
        concept,
        templateKey,
        displayName,
        defaultLocale: 'ko-KR',
        styleTags: ['Romantic', 'Garden'],
        primaryColor,
        secondaryColor,
        mobileFirst: true,
        visualDirection,
        sections,
      }),
    });
    setPrompt(res.prompt);
    setStatusMsg('Prompt generated — copy into Cursor Figma MCP');
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setStatusMsg('Copied');
  }

  function moveSection(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setSections(next);
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <Link href="/admin/visual-templates">← Visual Templates</Link>
          <h1 className={styles.pageTitle}>새 템플릿 디자인 요청</h1>
          <p className={styles.pageDescription}>
            Cursor/Figma MCP용 Prompt 생성 → Figma GI_* 디자인 → Import 페이지에서 Frame URL 분석
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/admin/visual-templates/import">
          Figma Import →
        </Link>
      </div>

      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      <section className={styles.section}>
        <label>
          Concept
          <select className={styles.input} value={concept} onChange={(e) => setConcept(e.target.value)}>
            {['WEDDING', 'FUNERAL', 'GENERAL', 'ORGANIZATION'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Display name
          <input className={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          Template key (immutable)
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={styles.input} value={templateKey} onChange={(e) => setTemplateKey(e.target.value.toUpperCase())} />
            <button type="button" className={styles.secondaryButton} onClick={() => void suggestKey()}>
              Suggest
            </button>
          </div>
        </label>
        <label>
          Primary / Secondary
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={styles.input} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            <input className={styles.input} value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
          </div>
        </label>
        <label>
          Visual direction
          <textarea
            className={styles.input}
            rows={4}
            value={visualDirection}
            onChange={(e) => setVisualDirection(e.target.value)}
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>Sections ({enabledCount})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sections.map((row, index) => (
            <li key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => {
                  const next = [...sections];
                  next[index] = { ...row, enabled: e.target.checked };
                  setSections(next);
                }}
              />
              <strong style={{ width: 120 }}>{row.id}</strong>
              <input
                className={styles.input}
                placeholder="notes"
                value={row.notes || ''}
                onChange={(e) => {
                  const next = [...sections];
                  next[index] = { ...row, notes: e.target.value };
                  setSections(next);
                }}
              />
              <button type="button" className={styles.secondaryButton} onClick={() => moveSection(index, -1)}>
                ↑
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => moveSection(index, 1)}>
                ↓
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <button type="button" className={styles.primaryButton} onClick={() => void generatePrompt()}>
          Figma 제작 지시문 생성
        </button>
        {prompt ? (
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => void copyPrompt()}>
              Copy
            </button>
            <pre className={styles.pageDescription} style={{ whiteSpace: 'pre-wrap', maxHeight: 480, overflow: 'auto' }}>
              {prompt}
            </pre>
          </>
        ) : null}
      </section>
    </>
  );
}
