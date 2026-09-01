'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminPageHeader from '@/src/features/admin/AdminPageHeader';
import { formatConceptLabel } from '@/src/features/admin/adminDisplay';
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
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
  }, []);

  async function analyze(useFixture: boolean) {
    setStatusMsg(null);
    try {
      const result = await adminApiJson<AnalyzeResult>('/api/admin/visual-templates/figma/analyze', {
        method: 'POST',
        body: JSON.stringify(useFixture ? { useFixture: true } : { figmaUrl, templateKey, concept }),
      });
      setAnalysis(result);
      setStatusMsg(result.canSaveDraft ? '분석 완료 — 아래 미리보기를 확인하세요.' : '분석 중 오류가 있습니다.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : '분석 실패');
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
      setStatusMsg(`초안 저장 완료 (v${saved.version})`);
      router.push(`/admin/visual-templates/${encodeURIComponent(templateKey)}`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : '초안 저장 실패');
    }
  }

  return (
    <>
      <AdminPageHeader
        breadcrumb={[
          { label: '관리자', href: '/admin/dashboard' },
          { label: '비주얼 템플릿', href: '/admin/visual-templates' },
          { label: 'Figma 가져오기' },
        ]}
        title="Figma 템플릿 가져오기"
        description="Figma에서 완성한 템플릿의 최상위 Frame 링크를 붙여넣으면 디자인 구조를 분석해 비주얼 템플릿 초안을 생성합니다."
        actions={
          <Link className={styles.secondaryButton} href="/admin/visual-templates/new">
            새 템플릿 만들기
          </Link>
        }
      />

      <div className={styles.workflowSteps}>
        <span className={styles.workflowStep}>1. 디자인 설정</span>
        <span className={styles.workflowStep}>2. Figma 제작</span>
        <span className={`${styles.workflowStep} ${styles.workflowStepActive}`}>3. Figma 가져오기</span>
      </div>

      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      <section className={styles.section}>
        <button type="button" className={styles.accordionSummary} onClick={() => setShowSteps((v) => !v)}>
          {showSteps ? '작업 순서 숨기기' : '작업 순서 보기'}
        </button>
        {showSteps ? (
          <ol className={styles.helperText}>
            <li>새 템플릿 만들기에서 제작 지시문 생성</li>
            <li>Cursor/Figma MCP로 디자인 제작</li>
            <li>Figma 최상위 Frame 선택</li>
            <li>Copy link to selection</li>
            <li>이 화면에 URL 붙여넣기</li>
            <li>디자인 분석</li>
            <li>미리보기 후 초안 저장</li>
          </ol>
        ) : null}

        <label>
          내부 템플릿 ID
          <input className={styles.input} value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} />
        </label>
        <label>
          템플릿 종류
          <select className={styles.input} value={concept} onChange={(e) => setConcept(e.target.value)}>
            {['WEDDING', 'GENERAL', 'ORGANIZATION', 'FUNERAL'].map((c) => (
              <option key={c} value={c}>
                {formatConceptLabel(c)} ({c})
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
        <p className={styles.helperText}>
          Figma에서 최상위 템플릿 Frame을 선택한 뒤 &apos;Copy link to selection&apos;으로 복사한 URL을
          입력하세요.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={styles.primaryButton} onClick={() => void analyze(false)}>
            디자인 분석
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => void analyze(true)}>
            개발용 Wedding POC Fixture 분석
          </button>
          <Link className={styles.secondaryButton} href="/admin/system?tab=figma">
            Figma 연동 설정
          </Link>
        </div>
        <p className={styles.helperText}>권한: {session?.role || '…'}</p>
      </section>

      {analysis && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>분석 결과</h2>
          <p className={styles.pageDescription}>
            {analysis.source.frameName} · {analysis.source.fileKey}/{analysis.source.nodeId}
          </p>
          <p>감지된 섹션: {analysis.detectedSections.join(', ') || '—'}</p>
          <p>감지된 데이터 필드: {analysis.detectedFields.join(', ') || '—'}</p>
          <p>감지된 기능 영역: {analysis.detectedComponents.join(', ') || '—'}</p>
          {analysis.errors.length > 0 && (
            <ul className={styles.error}>
              {analysis.errors.map((e) => (
                <li key={e.code + e.message}>
                  오류 {e.code}: {e.message}
                </li>
              ))}
            </ul>
          )}
          {analysis.warnings.length > 0 && (
            <ul>
              {analysis.warnings.map((w) => (
                <li key={w.code + w.message}>
                  확인 필요 {w.code}: {w.message}
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" className={styles.secondaryButton} onClick={() => setViewport('mobile')}>
              모바일 (390)
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => setViewport('desktop')}>
              데스크톱 (1280)
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!analysis.canSaveDraft}
              onClick={() => void saveDraft()}
            >
              초안 저장
            </button>
          </div>
          {analysis.definitionPreview ? (
            <>
              <h3 className={styles.pageTitle} style={{ marginTop: 16 }}>
                템플릿 미리보기
              </h3>
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
            </>
          ) : null}
        </section>
      )}
    </>
  );
}
