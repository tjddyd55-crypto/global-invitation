'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AdminPageHeader from '@/src/features/admin/AdminPageHeader';
import { formatConceptLabel, formatGiSection } from '@/src/features/admin/adminDisplay';
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
    setStatusMsg('지시문 생성 완료');
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setStatusMsg('지시문이 복사되었습니다.');
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
      <AdminPageHeader
        breadcrumb={[
          { label: '관리자', href: '/admin/dashboard' },
          { label: '비주얼 템플릿', href: '/admin/visual-templates' },
          { label: '새 템플릿 만들기' },
        ]}
        title="새 비주얼 템플릿 만들기"
        description="템플릿 기본 정보와 디자인 방향을 입력하면 Cursor/Figma MCP에서 사용할 제작 지시문을 생성합니다."
        actions={
          <Link className={styles.secondaryButton} href="/admin/visual-templates/import">
            Figma 가져오기
          </Link>
        }
      />

      <div className={styles.workflowSteps}>
        <span className={`${styles.workflowStep} ${styles.workflowStepActive}`}>1. 디자인 설정</span>
        <span className={styles.workflowStep}>2. Figma 제작</span>
        <span className={styles.workflowStep}>3. Figma 가져오기</span>
      </div>

      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>기본 정보</h2>
        <label>
          템플릿 종류
          <select className={styles.input} value={concept} onChange={(e) => setConcept(e.target.value)}>
            {['WEDDING', 'FUNERAL', 'GENERAL', 'ORGANIZATION'].map((c) => (
              <option key={c} value={c}>
                {formatConceptLabel(c)} ({c})
              </option>
            ))}
          </select>
        </label>
        <label>
          템플릿 이름
          <input className={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          내부 템플릿 ID
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className={styles.input}
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value.toUpperCase())}
            />
            <button type="button" className={styles.secondaryButton} onClick={() => void suggestKey()}>
              ID 추천
            </button>
          </div>
        </label>
        <label>
          메인 컬러 / 보조 컬러
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={styles.input} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            <input
              className={styles.input}
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
            />
          </div>
        </label>
        <label>
          디자인 상세 설명
          <textarea
            className={styles.input}
            rows={4}
            value={visualDirection}
            onChange={(e) => setVisualDirection(e.target.value)}
            placeholder="예) 아이보리 배경의 봄 정원 분위기. Hero에는 세로 사진을 크게 배치하고, serif 계열 타이틀과 은은한 꽃 장식을 사용합니다. 전체적으로 고급스럽고 차분하게 구성합니다."
          />
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.pageTitle}>섹션 선택 ({enabledCount}개)</h2>
        <p className={styles.helperText}>
          사용할 영역을 선택하고 원하는 순서로 배치하세요. 이 순서가 Figma 디자인 지시문에 반영됩니다.
          ↑↓ 버튼으로 순서를 변경하세요.
        </p>
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
              <strong style={{ width: 180 }}>
                {formatGiSection(row.id)} <span className={styles.helperText}>({row.id})</span>
              </strong>
              <input
                className={styles.input}
                placeholder="메모"
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
            <h3 className={styles.pageTitle} style={{ marginTop: 16 }}>
              Figma 제작 지시문
            </h3>
            <p className={styles.helperText}>
              아래 지시문을 Cursor에 붙여넣고 Figma MCP로 디자인을 생성하세요. 디자인이 완료되면
              최상위 Frame의 링크를 복사해 Figma 가져오기 화면에 붙여넣습니다.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={() => void copyPrompt()}>
                지시문 복사
              </button>
              <a
                className={styles.secondaryButton}
                href="https://www.figma.com"
                target="_blank"
                rel="noreferrer"
              >
                Figma 열기
              </a>
              <Link className={styles.secondaryButton} href="/admin/visual-templates/import">
                Figma 가져오기로 이동
              </Link>
            </div>
            <pre
              className={styles.pageDescription}
              style={{ whiteSpace: 'pre-wrap', maxHeight: 480, overflow: 'auto' }}
            >
              {prompt}
            </pre>
          </>
        ) : null}
      </section>
    </>
  );
}
