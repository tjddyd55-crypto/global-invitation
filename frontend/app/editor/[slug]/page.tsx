'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInvitation, updateInvitation } from '@/src/lib/api';
import type { Invitation } from '@/src/lib/api';
import { TEMPLATES, getTemplateByKey, type Template } from '@/src/constants/templates';
import { getTemplateDescription, getTemplateName } from '@/src/utils/templateI18n';
import { MUSIC_LIST } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import TemplateGalleryModal from '@/src/components/TemplateGalleryModal';
import { I18N_KEYS, type I18nKey } from '@/src/i18n';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<I18nKey | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [locationText, setLocationText] = useState('');
  const [message, setMessage] = useState('');
  const [templateKey, setTemplateKey] = useState('basic');
  const [musicKey, setMusicKey] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      router.replace('/create');
      return;
    }

    async function loadInvitation() {
      try {
        const data = await getInvitation(slug);
        setInvitation(data);
        setTitle(data.title || '');
        setEventDate(data.eventDate ? new Date(data.eventDate).toISOString().slice(0, 16) : '');
        setLocationText(data.locationText || '');
        setMessage(data.message || '');
        const normalizedTemplateKey = data.templateKey ? getTemplateByKey(data.templateKey)?.key : null;
        setTemplateKey(normalizedTemplateKey || data.templateKey || 'basic');
        setMusicKey(data.musicKey || null);
      } catch (err) {
        const isNotFound = err instanceof Error && err.message === 'Invitation not found';
        setError(isNotFound ? I18N_KEYS.common.notFound : I18N_KEYS.notice.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [slug, router]);

  const handleSave = async () => {
    if (!slug) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateInvitation(slug, {
        title: title || undefined,
        eventDate: eventDate || undefined,
        locationText: locationText || undefined,
        message: message || undefined,
        templateKey: templateKey,
        musicKey: musicKey || null,
      });

      setInvitation(updated);
      console.log('Invitation saved successfully:', updated);
      alert(t('save') + '!');
    } catch (err) {
      setError(I18N_KEYS.notice.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!slug) {
      router.replace('/create');
      return;
    }
    router.push(`/invitation/${slug}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>{t('error')}</h1>
        <p style={{ color: 'red' }}>{t(error)}</p>
        <button
          onClick={() => router.push('/create')}
          style={{
            padding: '0.5rem 1rem',
            marginTop: '1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {t('goToCreate')}
        </button>
      </div>
    );
  }

  const handleTemplateChange = async (template: Template) => {
    if (!slug) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateInvitation(slug, {
        templateKey: template.key,
        musicKey: template.defaultMusicKey,
      });

      setInvitation(updated);
      setTemplateKey(template.key);
      setMusicKey(template.defaultMusicKey);
      console.log('Template changed successfully:', updated);
      alert(t(I18N_KEYS.notice.templateChanged));
    } catch (err) {
      setError(I18N_KEYS.notice.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const currentTemplate = getTemplateByKey(templateKey);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>{t('edit')}</h1>
        <button
          onClick={() => setShowTemplateGallery(true)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {t('changeTemplate')}
        </button>
      </div>
      {currentTemplate && (
        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {t('currentTemplate')} {getTemplateName(currentTemplate, t)}
        </p>
      )}
      <p style={{ color: '#666', marginBottom: '2rem' }}>{t('slug')}: {slug}</p>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee' }}>
          {t(error)}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {t('title')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(I18N_KEYS.fields.titlePlaceholder)}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {t('eventDate')}
        </label>
        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {t('location')}
        </label>
        <input
          type="text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder={t(I18N_KEYS.fields.locationPlaceholder)}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {t('message')}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t(I18N_KEYS.fields.messagePlaceholder)}
          rows={6}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {t('template')}
        </label>
        <select
          value={templateKey}
          onChange={(e) => {
            const newTemplateKey = e.target.value;
            setTemplateKey(newTemplateKey);
            // 템플릿 변경 시 기본 음악으로 설정
            const template = TEMPLATES.find((t) => t.key === newTemplateKey);
            if (template) {
              setMusicKey(template.defaultMusicKey);
            }
          }}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          {TEMPLATES.map((template) => (
            <option key={template.key} value={template.key}>
              {getTemplateName(template, t)} - {getTemplateDescription(template, t)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {t('music')}
        </label>
        <select
          value={musicKey || ''}
          onChange={(e) => setMusicKey(e.target.value || null)}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">{t('noMusic')}</option>
          {MUSIC_LIST.map((music) => (
            <option key={music.musicKey} value={music.musicKey}>
              {music.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: saving ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? t('saving') : t('save')}
        </button>

        <button
          onClick={handlePreview}
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
          {t('preview')}
        </button>
      </div>

      {/* 템플릿 갤러리 모달 */}
      {showTemplateGallery && (
        <TemplateGalleryModal
          onSelect={handleTemplateChange}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </div>
  );
}
