'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import { Component, type ReactNode } from 'react';
import type { CreatorActiveCategory, CreatorStudioConfig } from '@/src/creator/studioConfig';
import TemplatePreviewWrapper from '@/src/templates/TemplatePreviewWrapper';
import styles from './TemplateCreatorStudio.module.css';

type LivePreviewPanelProps = {
  category: CreatorActiveCategory;
  templateKeyCandidate: string;
  studioConfig: CreatorStudioConfig;
};

class PreviewErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Creator preview crashed. Showing placeholder.', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function PreviewFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        color: '#6b7280',
      }}
    >
      Preview rendering failed. Check your StudioConfig.
    </div>
  );
}

export default function LivePreviewPanel({
  category,
  templateKeyCandidate,
  studioConfig,
}: LivePreviewPanelProps) {
  const [frameMode, setFrameMode] = useState<'desktop' | 'mobile'>('mobile');
  const [fullscreen, setFullscreen] = useState(false);

  const previewKey = useMemo(
    () =>
      `creator_${category}_${
        templateKeyCandidate.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'preview'
      }`,
    [category, templateKeyCandidate]
  );

  const frameClass = frameMode === 'mobile' ? styles.previewMobile : styles.previewDesktop;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Live Preview</h2>
      <div className={styles.buttonRow} style={{ marginBottom: 10 }}>
        <button
          type="button"
          className={`${styles.button} ${frameMode === 'mobile' ? '' : styles.buttonSecondary}`}
          onClick={() => setFrameMode('mobile')}
        >
          Mobile
        </button>
        <button
          type="button"
          className={`${styles.button} ${frameMode === 'desktop' ? '' : styles.buttonSecondary}`}
          onClick={() => setFrameMode('desktop')}
        >
          Desktop
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setFullscreen(true)}>
          Fullscreen
        </button>
      </div>

      <div className={`${styles.previewWrap} ${frameClass}`}>
        <PreviewErrorBoundary fallback={<PreviewFallback />}>
          <TemplatePreviewWrapper templateKey={previewKey} studioConfig={studioConfig} />
        </PreviewErrorBoundary>
      </div>

      {fullscreen && (
        <div className={styles.fullscreenOverlay}>
          <div className={styles.fullscreenHeader}>
            <strong>Creator Studio Preview</strong>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => setFullscreen(false)}
            >
              Close
            </button>
          </div>
          <div className={styles.fullscreenBody}>
            <div className={`${styles.previewWrap} ${styles.previewDesktop}`} style={{ height: '100%' }}>
              <PreviewErrorBoundary fallback={<PreviewFallback />}>
                <TemplatePreviewWrapper templateKey={previewKey} studioConfig={studioConfig} />
              </PreviewErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
