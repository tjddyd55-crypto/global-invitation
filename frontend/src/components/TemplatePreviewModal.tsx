'use client';

import { SAMPLE_INVITATION_DATA } from '@/src/constants/templates';
import type { Template } from '@/src/constants/templates';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { getTemplateName } from '@/src/utils/templateI18n';
import { formatDateTime } from '@/src/lib/i18n/format';

interface TemplatePreviewModalProps {
  template: Template;
  onSelect: () => void;
  onClose: () => void;
}

export default function TemplatePreviewModal({ template, onSelect, onClose }: TemplatePreviewModalProps) {
  const { t, language } = useI18n();

  // 샘플 데이터 — 기본 음악 자동 삽입·자동재생 없음
  const previewData = {
    ...SAMPLE_INVITATION_DATA,
    title: t(I18N_KEYS.sample.title),
    locationText: t(I18N_KEYS.sample.location),
    message: t(I18N_KEYS.sample.message),
    musicKey: null as string | null,
  };

  void template.defaultMusicKey;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return Number.isNaN(date.getTime()) ? dateString : formatDateTime(language, date);
    } catch {
      return dateString;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: '#fff',
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{getTemplateName(template, t)}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            ×
          </button>
        </div>

        {/* 미리보기 내용 */}
        <div style={{ padding: '2rem' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '2rem', backgroundColor: '#fff' }}>
            {previewData.title && (
              <h1
                style={{
                  marginBottom: '2rem',
                  fontSize: '2.5rem',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                {previewData.title}
              </h1>
            )}

            {previewData.message && (
              <div
                style={{
                  marginBottom: '2rem',
                  fontSize: '1.2rem',
                  lineHeight: '2',
                  color: '#444',
                  textAlign: 'center',
                }}
              >
                {previewData.message.split('\n').map((line, index) => (
                  <p key={index} style={{ marginBottom: '1rem' }}>
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            )}

            {(previewData.eventDate || previewData.locationText) && (
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                }}
              >
                {previewData.eventDate && (
                  <div style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                      {t(I18N_KEYS.fields.eventDate)}
                    </strong>
                    <span style={{ color: '#333' }}>{formatDate(previewData.eventDate)}</span>
                  </div>
                )}

                {previewData.locationText && (
                  <div style={{ fontSize: '1.1rem' }}>
                    <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                      {t(I18N_KEYS.fields.location)}
                    </strong>
                    <span style={{ color: '#333' }}>{previewData.locationText}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 모달 하단 버튼 */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            position: 'sticky',
            bottom: 0,
            backgroundColor: '#fff',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {t(I18N_KEYS.common.close)}
          </button>
          <button
            onClick={onSelect}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {t(I18N_KEYS.gallery.selectTemplate)}
          </button>
        </div>
      </div>
    </div>
  );
}
