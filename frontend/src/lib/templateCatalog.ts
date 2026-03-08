export type TemplateCategory = 'wedding' | 'birthday' | 'funeral' | 'party';
export type TemplateStyle = 'korean' | 'japanese' | 'western' | 'traditional' | 'modern';

export type TemplateCatalogItem = {
  id: string;
  category: TemplateCategory;
  style: TemplateStyle;
  name: string;
  description: string;
  templateKey: 'wedding_classic' | 'classic';
};

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  {
    id: 'wedding-korean-classic',
    category: 'wedding',
    style: 'korean',
    name: '한국 전통 웨딩',
    description: '전통적인 한국식 결혼식 초대장',
    templateKey: 'wedding_classic',
  },
  {
    id: 'wedding-modern-white',
    category: 'wedding',
    style: 'modern',
    name: '모던 화이트 웨딩',
    description: '깔끔하고 현대적인 웨딩 초대장',
    templateKey: 'wedding_classic',
  },
  {
    id: 'wedding-japanese-minimal',
    category: 'wedding',
    style: 'japanese',
    name: '일본식 웨딩',
    description: '절제된 일본 스타일의 웨딩 초대장',
    templateKey: 'wedding_classic',
  },
  {
    id: 'wedding-simple-minimal',
    category: 'wedding',
    style: 'western',
    name: '심플 웨딩',
    description: '군더더기 없이 단정한 웨딩 초대장',
    templateKey: 'classic',
  },
  {
    id: 'birthday-family-party',
    category: 'birthday',
    style: 'traditional',
    name: '돌잔치',
    description: '가족 중심 분위기의 돌잔치 초대장',
    templateKey: 'classic',
  },
  {
    id: 'funeral-classic',
    category: 'funeral',
    style: 'korean',
    name: '장례식',
    description: '격식을 갖춘 장례식 안내 초대장',
    templateKey: 'classic',
  },
  {
    id: 'party-modern-night',
    category: 'party',
    style: 'modern',
    name: '파티 나이트',
    description: '모임/행사에 어울리는 현대적 파티 초대장',
    templateKey: 'classic',
  },
];

const TEMPLATE_KEY_ALIASES: Record<string, 'wedding_classic' | 'classic'> = {
  FULL: 'wedding_classic',
  SIMPLE: 'classic',
  wedding_classic: 'wedding_classic',
  classic: 'classic',
};

export function resolveTemplateKeyByTemplateId(templateId: string | null): 'wedding_classic' | 'classic' | null {
  if (!templateId) return null;
  const fromCatalog = TEMPLATE_CATALOG.find((item) => item.id === templateId);
  if (fromCatalog) return fromCatalog.templateKey;
  return TEMPLATE_KEY_ALIASES[templateId] ?? null;
}
