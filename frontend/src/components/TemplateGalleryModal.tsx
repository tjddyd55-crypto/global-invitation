'use client';

import { useState, useMemo } from 'react';
import { TEMPLATES, type Template } from '@/src/constants/templates';
import TemplatePreviewModal from './TemplatePreviewModal';
import { useI18n } from '@/src/contexts/I18nContext';
import { getTemplateName, getTemplateDescription, getTagName } from '@/src/utils/templateI18n';

type SortOption = 'recommended' | 'newest' | 'price_low';

interface TemplateGalleryModalProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export default function TemplateGalleryModal({ onSelect, onClose }: TemplateGalleryModalProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // 모든 태그 수집
  const allTags = useMemo(() => {
    const countryTags: string[] = [];
    const moodTags: string[] = [];
    const eventTags: string[] = [];

    TEMPLATES.forEach((template) => {
      template.tags.country?.forEach((tag) => {
        if (!countryTags.includes(tag)) countryTags.push(tag);
      });
      template.tags.mood?.forEach((tag) => {
        if (!moodTags.includes(tag)) moodTags.push(tag);
      });
      template.tags.event?.forEach((tag) => {
        if (!eventTags.includes(tag)) eventTags.push(tag);
      });
    });

    return { country: countryTags, mood: moodTags, event: eventTags };
  }, []);

  // 필터링 및 정렬된 템플릿 목록
  const filteredTemplates = useMemo(() => {
    let filtered = TEMPLATES.filter((template) => {
      // 검색 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const templateName = getTemplateName(template, t).toLowerCase();
        const templateDescription = getTemplateDescription(template, t).toLowerCase();
        const matchesTags = [
          ...(template.tags.country || []),
          ...(template.tags.mood || []),
          ...(template.tags.event || []),
        ].some((tag) => getTagName(tag, t).toLowerCase().includes(query));

        if (!templateName.includes(query) && !templateDescription.includes(query) && !matchesTags) {
          return false;
        }
      }

      // 태그 필터
      if (selectedTags.length > 0) {
        const templateAllTags = [
          ...(template.tags.country || []),
          ...(template.tags.mood || []),
          ...(template.tags.event || []),
        ];
        const hasAnyTag = selectedTags.some((tag) => templateAllTags.includes(tag));
        if (!hasAnyTag) return false;
      }

      return true;
    });

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      if (sortOption === 'recommended') {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return 0;
      } else if (sortOption === 'newest') {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      } else if (sortOption === 'price_low') {
        return a.price - b.price;
      }
      return 0;
    });

      return filtered;
    }, [searchQuery, selectedTags, sortOption, t]);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleSelectTemplate = (template: Template) => {
    onSelect(template);
    onClose();
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
        overflow: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          margin: 'auto',
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
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{t('templateGallery')}</h2>
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

        {/* 내용 */}
        <div style={{ padding: '1rem' }}>
          {/* 검색 입력창 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* 필터 태그 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t('filterCountry')}</strong>
              {allTags.country.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  style={{
                    margin: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.9rem',
                    backgroundColor: selectedTags.includes(tag) ? '#007bff' : '#f0f0f0',
                    color: selectedTags.includes(tag) ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '16px',
                    cursor: 'pointer',
                  }}
                >
                  {getTagName(tag, t)}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>{t('filterMood')}</strong>
              {allTags.mood.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  style={{
                    margin: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.9rem',
                    backgroundColor: selectedTags.includes(tag) ? '#007bff' : '#f0f0f0',
                    color: selectedTags.includes(tag) ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '16px',
                    cursor: 'pointer',
                  }}
                >
                  {getTagName(tag, t)}
                </button>
              ))}
            </div>
            <div>
              <strong>{t('filterEvent')}</strong>
              {allTags.event.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  style={{
                    margin: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.9rem',
                    backgroundColor: selectedTags.includes(tag) ? '#007bff' : '#f0f0f0',
                    color: selectedTags.includes(tag) ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '16px',
                    cursor: 'pointer',
                  }}
                >
                  {getTagName(tag, t)}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 옵션 */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <strong>{t('sortLabel')}</strong>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              style={{
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="recommended">{t('sortRecommended')}</option>
              <option value="newest">{t('sortNewest')}</option>
              <option value="price_low">{t('sortPriceLow')}</option>
            </select>
          </div>

          {/* 템플릿 그리드 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredTemplates.map((template) => (
              <div
                key={template.key}
                onClick={() => handleTemplateClick(template)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  backgroundColor: '#fff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 썸네일 */}
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                  }}
                >
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={getTemplateName(template, t)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#999' }}>📋</span>
                  )}
                </div>

                {/* 템플릿 정보 */}
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{getTemplateName(template, t)}</h3>
                    {template.isNew && (
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#28a745', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {t('new')}
                      </span>
                    )}
                    {template.isRecommended && (
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#ffc107', color: '#333', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {t('recommended')}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>{getTemplateDescription(template, t)}</p>

                  {/* 태그 */}
                  <div style={{ marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {[...(template.tags.country || []), ...(template.tags.mood || []), ...(template.tags.event || [])]
                      .slice(0, 3)
                      .map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#f0f0f0',
                            color: '#666',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '12px',
                          }}
                        >
                          {getTagName(tag, t)}
                        </span>
                      ))}
                  </div>

                  {/* 가격 배지 */}
                  <div style={{ marginTop: '0.5rem' }}>
                    {template.price === 0 ? (
                      <span style={{ fontSize: '0.9rem', color: '#28a745', fontWeight: 'bold' }}>{t('free')}</span>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>+${template.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              {t('noResults')}
            </div>
          )}
        </div>
      </div>

      {/* Quick Preview 모달 */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onSelect={() => handleSelectTemplate(selectedTemplate)}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
