'use client';
/* eslint-disable i18next/no-literal-string */

import type {
  CreatorActiveCategory,
  CreatorSectionConfig,
  CreatorSectionMap,
} from '@/src/creator/studioConfig';
import { CREATOR_CATEGORY_SECTIONS } from '@/src/creator/studioConfig';
import { useI18n } from '@/src/contexts/I18nContext';
import { getStudioSectionLabel } from './sectionLabels';
import styles from './TemplateCreatorStudio.module.css';

type SectionConfigPanelProps = {
  category: CreatorActiveCategory;
  sections: CreatorSectionMap;
  sectionOrder: string[];
  onSectionsChange: (next: CreatorSectionMap) => void;
  onSectionOrderChange: (next: string[]) => void;
};

function parseOrder(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function SectionConfigPanel({
  category,
  sections,
  sectionOrder,
  onSectionsChange,
  onSectionOrderChange,
}: SectionConfigPanelProps) {
  const { language } = useI18n();
  const sectionKeys = CREATOR_CATEGORY_SECTIONS[category];

  const updateSection = (sectionKey: string, payload: Partial<Record<string, unknown>>) => {
    onSectionsChange({
      ...sections,
      [sectionKey]: {
        ...(sections[sectionKey] || {}),
        ...payload,
      },
    });
  };

  const resetOrder = () => {
    const ordered = [...sectionKeys];
    onSectionOrderChange(ordered);
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Section Configuration</h2>
      <div className={styles.buttonRow} style={{ marginBottom: 8 }}>
        <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={resetOrder}>
          Reset order
        </button>
      </div>
      <div className={styles.stack}>
        {sectionKeys.map((sectionKey) => {
          const section = sections[sectionKey] || ({} as CreatorSectionConfig);
          const currentOrder = sectionOrder.indexOf(sectionKey) + 1;
          return (
            <article key={sectionKey} id={`studio-section-${sectionKey}`} className={styles.sectionItem}>
              <div className={styles.sectionHeaderRow}>
                <strong>{getStudioSectionLabel(sectionKey, language)}</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={section.enabled !== false}
                    onChange={(e) => updateSection(sectionKey, { enabled: e.target.checked })}
                  />{' '}
                  enabled
                </label>
              </div>
              <div className={styles.inlineGrid}>
                <label className={styles.field}>
                  <span>Order</span>
                  <input
                    type="number"
                    min={1}
                    max={sectionKeys.length}
                    value={currentOrder}
                    onChange={(e) => {
                      const nextOrder = Math.max(1, Math.min(sectionKeys.length, parseOrder(e.target.value, currentOrder)));
                      const sorted = [...sectionOrder].filter((key) => key !== sectionKey);
                      sorted.splice(nextOrder - 1, 0, sectionKey);
                      onSectionOrderChange(sorted);
                    }}
                  />
                </label>
                <label className={styles.field}>
                  <span>Text align</span>
                  <select
                    value={section.textAlign || 'center'}
                    onChange={(e) =>
                      updateSection(sectionKey, {
                        textAlign: e.target.value as CreatorSectionConfig['textAlign'],
                      })
                    }
                  >
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </label>
              </div>
              <div className={styles.inlineGrid}>
                <label className={styles.field}>
                  <span>Layout</span>
                  <select
                    value={section.layout || 'standard'}
                    onChange={(e) => updateSection(sectionKey, { layout: e.target.value })}
                  >
                    {sectionKey === 'gallery' ? (
                      <>
                        <option value="grid">grid</option>
                        <option value="masonry">masonry</option>
                        <option value="carousel">carousel</option>
                      </>
                    ) : (
                      <>
                        <option value="center">center</option>
                        <option value="left">left</option>
                        <option value="right">right</option>
                        <option value="full">full</option>
                        <option value="split">split</option>
                      </>
                    )}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Card style</span>
                  <select
                    value={section.cardStyle || 'soft'}
                    onChange={(e) =>
                      updateSection(sectionKey, {
                        cardStyle: e.target.value as CreatorSectionConfig['cardStyle'],
                      })
                    }
                  >
                    <option value="none">none</option>
                    <option value="soft">soft</option>
                    <option value="outline">outline</option>
                    <option value="elevated">elevated</option>
                  </select>
                </label>
              </div>
              <div className={styles.inlineGrid}>
                <label className={styles.field}>
                  <span>Background style</span>
                  <select
                    value={section.backgroundStyle || 'color'}
                    onChange={(e) =>
                      updateSection(sectionKey, {
                        backgroundStyle: e.target.value as CreatorSectionConfig['backgroundStyle'],
                      })
                    }
                  >
                    <option value="image">image</option>
                    <option value="color">color</option>
                    <option value="gradient">gradient</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Spacing</span>
                  <select
                    value={section.spacing || 'normal'}
                    onChange={(e) =>
                      updateSection(sectionKey, {
                        spacing: e.target.value as CreatorSectionConfig['spacing'],
                      })
                    }
                  >
                    <option value="compact">compact</option>
                    <option value="normal">normal</option>
                    <option value="wide">wide</option>
                  </select>
                </label>
              </div>
              {sectionKey === 'gallery' && (
                <div className={styles.inlineGrid}>
                  <label className={styles.field}>
                    <span>Columns</span>
                    <select
                      value={String((section as { columns?: number }).columns ?? 3)}
                      onChange={(e) => updateSection(sectionKey, { columns: Number(e.target.value) as 2 | 3 | 4 })}
                    >
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Image style</span>
                    <select
                      value={(section as { imageStyle?: string }).imageStyle || 'rounded'}
                      onChange={(e) => updateSection(sectionKey, { imageStyle: e.target.value })}
                    >
                      <option value="square">square</option>
                      <option value="rounded">rounded</option>
                      <option value="circle">circle</option>
                    </select>
                  </label>
                </div>
              )}
              {sectionKey === 'location' && (
                <div className={styles.inlineGrid}>
                  <label className={styles.field}>
                    <span>Map style</span>
                    <select
                      value={(section as { mapStyle?: string }).mapStyle || 'card'}
                      onChange={(e) => updateSection(sectionKey, { mapStyle: e.target.value })}
                    >
                      <option value="card">card</option>
                      <option value="full">full</option>
                      <option value="compact">compact</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Transport/Parking</span>
                    <div className={styles.buttonRow}>
                      <label>
                        <input
                          type="checkbox"
                          checked={(section as { showTransport?: boolean }).showTransport !== false}
                          onChange={(e) => updateSection(sectionKey, { showTransport: e.target.checked })}
                        />{' '}
                        transport
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={(section as { showParking?: boolean }).showParking !== false}
                          onChange={(e) => updateSection(sectionKey, { showParking: e.target.checked })}
                        />{' '}
                        parking
                      </label>
                    </div>
                  </label>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className={styles.helperText} style={{ marginTop: 10 }}>
        sectionOrder: {sectionOrder.map((sectionKey) => getStudioSectionLabel(sectionKey, language)).join(' → ')}
      </p>
    </section>
  );
}
