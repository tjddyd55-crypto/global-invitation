'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import {
  getVisualTemplateDefinition,
  listActiveVisualTemplates,
} from '@/src/templates/visualTemplate/visualTemplateRegistry';
import { resolveVisualTemplateId } from '@/src/templates/visualTemplate/resolveVisualTemplateId';
import type { VisualTemplateId } from '@/src/templates/visualTemplate/ids';
import styles from './EditorTemplateSwitcher.module.css';

type Props = {
  conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL';
  visualTemplateId?: string;
  onChange: (nextId: VisualTemplateId) => void;
};

export default function EditorTemplateSwitcher({ conceptType, visualTemplateId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<VisualTemplateId | null>(null);

  const options = useMemo(() => {
    if (conceptType !== 'WEDDING' && conceptType !== 'GENERAL') return [];
    return listActiveVisualTemplates(conceptType);
  }, [conceptType]);

  if (conceptType !== 'WEDDING' && conceptType !== 'GENERAL') {
    return null;
  }

  const resolved =
    resolveVisualTemplateId({ conceptType, visualTemplateId }, conceptType) ??
    (conceptType === 'WEDDING' ? 'WEDDING_01_CLASSIC' : 'GENERAL_01_CLASSIC');
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
          <span className={styles.label}>템플릿</span>
          <strong>{current.name}</strong>
        </div>
        <button type="button" className={styles.changeBtn} onClick={() => setOpen(true)}>
          템플릿 변경
        </button>
      </div>

      {open ? (
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="tpl-change-title">
          <div className={styles.panel}>
            <h2 id="tpl-change-title">템플릿 선택</h2>
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
              닫기
            </button>
          </div>
        </div>
      ) : null}

      {confirmId ? (
        <div className={styles.modal} role="alertdialog" aria-modal="true">
          <div className={styles.panel}>
            <h2>템플릿을 변경할까요?</h2>
            <p>입력한 내용은 유지되고 화면 디자인만 변경됩니다.</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancel} onClick={() => setConfirmId(null)}>
                취소
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
                템플릿 변경
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
