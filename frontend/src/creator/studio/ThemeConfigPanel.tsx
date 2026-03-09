'use client';
/* eslint-disable i18next/no-literal-string */

import type { CreatorThemeConfig } from '@/src/creator/studioConfig';
import { CREATOR_FONT_FAMILIES, CREATOR_SPACING_SCALES } from '@/src/creator/studioConfig';
import styles from './TemplateCreatorStudio.module.css';

type ThemeConfigPanelProps = {
  value: CreatorThemeConfig;
  onChange: (next: CreatorThemeConfig) => void;
};

export default function ThemeConfigPanel({ value, onChange }: ThemeConfigPanelProps) {
  const update = (next: Partial<CreatorThemeConfig>) => onChange({ ...value, ...next });

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>Theme Configuration</h2>
      <div className={styles.stack}>
        <div className={styles.inlineGrid}>
          <label className={styles.field}>
            <span>Primary color</span>
            <input
              value={value.primaryColor}
              onChange={(e) => update({ primaryColor: e.target.value })}
              placeholder="#e8a3b3"
            />
          </label>
          <label className={styles.field}>
            <span>Background color</span>
            <input
              value={value.backgroundColor}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              placeholder="#ffffff"
            />
          </label>
        </div>
        <div className={styles.inlineGrid}>
          <label className={styles.field}>
            <span>Text color</span>
            <input
              value={value.textColor}
              onChange={(e) => update({ textColor: e.target.value })}
              placeholder="#333333"
            />
          </label>
          <label className={styles.field}>
            <span>Font family</span>
            <select value={value.fontFamily} onChange={(e) => update({ fontFamily: e.target.value as CreatorThemeConfig['fontFamily'] })}>
              {CREATOR_FONT_FAMILIES.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.field}>
          <span>Spacing scale</span>
          <select
            value={value.spacingScale}
            onChange={(e) => update({ spacingScale: e.target.value as CreatorThemeConfig['spacingScale'] })}
          >
            {CREATOR_SPACING_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {scale}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.inlineGrid}>
          <label className={styles.field}>
            <span>Preset tone</span>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() =>
                onChange({
                  ...value,
                  primaryColor: '#e8a3b3',
                  backgroundColor: '#ffffff',
                  textColor: '#333333',
                })
              }
            >
              Reset theme colors
            </button>
          </label>
        </div>
      </div>
    </section>
  );
}
