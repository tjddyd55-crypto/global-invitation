'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApiJson, getAdminSession, type AdminSession } from '@/src/lib/adminApi';
import DefinitionTemplateRenderer from '@/src/templates/definition/DefinitionTemplateRenderer';
import type { TemplateDefinition } from '@/src/templates/definition/types';
import styles from '@/src/components/admin/AdminShell.module.css';

const FIXTURE_DATA: Record<string, unknown> = {
  conceptType: 'WEDDING',
  language: 'ko-KR',
  title: '우리의 결혼식',
  groomName: '민수',
  brideName: '지혜',
  weddingDate: '2026-10-17',
  weddingDateTime: '2026-10-17T14:00:00+09:00',
  locationText: '서울 가든 홀',
  address: '서울특별시 강남구 테헤란로 1',
  content: '서로에게 약속하는 날, 소중한 분들을 모십니다.',
  heroImage: '',
  galleryImages: [],
};

type AnalyzeResult = {
  source: { fileKey: string; nodeId: string; frameName: string; url: string };
  detectedSections: string[];
  detectedFields: string[];
  detectedComponents: string[];
  warnings: Array<{ level: string; code: string; message: string }>;
  errors: Array<{ level: string; code: string; message: string }>;
  definitionPreview: TemplateDefinition | null;
  sourceHash: string;
  canSaveDraft: boolean;
};

export default function AdminVisualTemplateImportPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [templateKey, setTemplateKey] = useState('WEDDING_07_ROMANTIC_GARDEN');
  const [concept, setConcept] = useState('WEDDING');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
  }, []);

  async function analyze(useFixture: boolean) {
    setStatusMsg(null);
    try {
      const result = await adminApiJson<AnalyzeResult>('/api/admin/visual-templates/figma/analyze', {
        method: 'POST',
        body: JSON.stringify(
          useFixture
            ? { useFixture: true }
            : { figmaUrl, templateKey, concept }
        ),
      });
      setAnalysis(result);
      setStatusMsg(result.canSaveDraft ? 'Analyze OK — preview below' : 'Analyze has errors');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Analyze failed');
    }
  }

  async function saveDraft() {
    if (!analysis?.definitionPreview) return;
    try {
      const saved = await adminApiJson<{ catalogEntryId: string; versionId: string; version: number }>(
        '/api/admin/visual-templates/figma/import',
        {
          method: 'POST',
          body: JSON.stringify({
            templateKey,
            concept,
            displayNameKo: '로맨틱 가든',
            displayNameEn: 'Romantic Garden',
            definition: analysis.definitionPreview,
            source: analysis.source,
            sourceHash: analysis.sourceHash,
            warnings: analysis.warnings,
          }),
        }
      );
      setStatusMsg(`Draft saved v${saved.version}`);
      router.push(`/admin/visual-templates/${encodeURIComponent(templateKey)}`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <Link href="/admin/visual-templates">← Visual Templates</Link>
          <h1 className={styles.pageTitle}>Figma Import</h1>
          <p className={styles.pageDescription}>
            Frame URL 분석 → Definition Preview → Save DRAFT · role={session?.role || '…'}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/admin/visual-templates/new">
          Design request
        </Link>
      </div>

      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      <section className={styles.section}>
        <label>
          Template key
          <input className={styles.input} value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} />
        </label>
        <label>
          Concept
          <select className={styles.input} value={concept} onChange={(e) => setConcept(e.target.value)}>
            {['WEDDING', 'GENERAL', 'ORGANIZATION', 'FUNERAL'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Figma Frame URL
          <input
            className={styles.input}
            placeholder="https://www.figma.com/design/...?node-id=123-456"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
          />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={styles.primaryButton} onClick={() => void analyze(false)}>
            Figma 분석
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => void analyze(true)}>
            Wedding POC Fixture 분석
          </button>
        </div>
      </section>

      {analysis && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>Analysis</h2>
          <p className={styles.pageDescription}>
            {analysis.source.frameName} · {analysis.source.fileKey}/{analysis.source.nodeId}
          </p>
          <p>Sections: {analysis.detectedSections.join(', ') || '—'}</p>
          <p>Fields: {analysis.detectedFields.join(', ') || '—'}</p>
          <p>Components: {analysis.detectedComponents.join(', ') || '—'}</p>
          {analysis.errors.length > 0 && (
            <ul className={styles.error}>
              {analysis.errors.map((e) => (
                <li key={e.code + e.message}>
                  ERROR {e.code}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {analysis.warnings.length > 0 && (
            <ul>
              {analysis.warnings.map((w) => (
                <li key={w.code + w.message}>
                  ⚠ {w.code}: {w.message}
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className={styles.secondaryButton} onClick={() => setViewport('mobile')}>
              390
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => setViewport('desktop')}>
              1280
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!analysis.canSaveDraft}
              onClick={() => void saveDraft()}
            >
              Save Draft
            </button>
          </div>
          {analysis.definitionPreview ? (
            <div
              style={{
                marginTop: 16,
                border: '1px solid #e5e7eb',
                width: viewport === 'mobile' ? 390 : 960,
                maxWidth: '100%',
              }}
            >
              <DefinitionTemplateRenderer
                definition={analysis.definitionPreview}
                data={FIXTURE_DATA}
                previewMode
                viewport={viewport}
              />
            </div>
          ) : null}
        </section>
      )}
    </>
  );
}
