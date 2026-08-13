'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import {
  getVisualTemplateDefinition,
  listActiveVisualTemplates,
} from '@/src/templates/visualTemplate/visualTemplateRegistry';
import { resolveVisualTemplateId } from '@/src/templates/visualTemplate/resolveVisualTemplateId';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import styles from './EditorTemplateSwitcher.module.css';

type Props = {
  conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION';
  visualTemplateId?: string;
  onChange: (nextId: VisualTemplateId) => void;
};

function isSwitchableConcept(
  conceptType: Props['conceptType']
): conceptType is 'WEDDING' | 'GENERAL' | 'ORGANIZATION' {
  return conceptType === 'WEDDING' || conceptType === 'GENERAL' || conceptType === 'ORGANIZATION';
}

export default function EditorTemplateSwitcher({ conceptType, visualTemplateId, onChange }: Props) {
  const { t } = useInvitationT();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<VisualTemplateId | null>(null);

  const options = useMemo(() => {
    if (!isSwitchableConcept(conceptType)) return [];
    return listActiveVisualTemplates(conceptType);
  }, [conceptType]);

  if (!isSwitchableConcept(conceptType)) {
    return null;
  }

  const resolved =
    resolveVisualTemplateId({ conceptType, visualTemplateId }, conceptType) ??
    (conceptType === 'WEDDING'
      ? 'WEDDING_01_CLASSIC'
      : conceptType === 'ORGANIZATION'
        ? 'ORGANIZATION_01_OFFICIAL'
        : 'GENERAL_01_CLASSIC');
  const current = getVisualTemplateDefinition(resolved);

  return (
    <div className={styles.wrap} data-testid="editor-template-switcher">
      <div className={styles.current}>
        <ImageWithFallback
          src={current.thumbnailAsset}
          alt=""
          className={styles.thumb}
          fallback={<span className={styles.thumbFallback}>{current.name.slice(0, 1)}</span>}
        />
        <div className={styles.meta}>
          <span className={styles.label}>{t('editor.template.label')}</span>
          <strong>{current.name}</strong>
        </div>
        <button type="button" className={styles.changeBtn} onClick={() => setOpen(true)}>
          {t('editor.template.change')}
        </button>
      </div>

      {open ? (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="tpl-change-title">
          <div className={styles.panel}>
            <h2 id="tpl-change-title">{t('editor.template.choose')}</h2>
            <ul className={styles.list}>
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={opt.id === resolved ? styles.optionActive : styles.option}
                    onClick={() => setConfirmId(opt.id)}
                  >
                    <ImageWithFallback
                      src={opt.thumbnailAsset}
                      alt=""
                      className={styles.optionThumb}
                      fallback={<span className={styles.thumbFallback}>{opt.name.slice(0, 1)}</span>}
                    />
                    <span>
                      <strong>{opt.name}</strong>
                      <em>{opt.description}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
              {t('editor.template.close')}
            </button>
          </div>
        </div>
      ) : null}

      {confirmId ? (
        <div className={styles.modal} role="alertdialog" aria-modal="true">
          <div className={styles.panel}>
            <h2>{t('editor.template.confirmTitle')}</h2>
            <p>{t('editor.template.confirmDesc')}</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancel} onClick={() => setConfirmId(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={styles.confirm}
                onClick={() => {
                  onChange(confirmId);
                  setConfirmId(null);
                  setOpen(false);
                }}
              >
                {t('editor.template.change')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
