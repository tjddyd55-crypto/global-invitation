export type FuneralInvitation = {
  templateType?: 'FULL';
  conceptType?: 'FUNERAL';
  templateKey: 'funeral_classic' | 'invitation_full';
  deceasedName: string;
  birthDate?: string;
  deathDate: string;
  chiefMourner: string;
  familyMembers?: string[];
  message: string;
  funeralHall: {
    name: string;
    address?: string;
    mapImage?: string;
    mapLat?: number;
    mapLng?: number;
  };
  schedule: {
    wakeStart?: string;
    funeralDate: string;
    burial?: string;
  };
  contact?: {
    name: string;
    phone: string;
  };
  heroImage?: string;
};

export const DEMO_FUNERAL_CLASSIC_SLUG = 'demo-funeral-classic';

export function isFuneralClassicDemoSlug(slug?: string | null): boolean {
  return slug === DEMO_FUNERAL_CLASSIC_SLUG;
}

export function isFuneralClassicTemplate(templateKey?: string | null): boolean {
  return templateKey === 'funeral_classic' || templateKey === 'invitation_full';
}

export function getFuneralClassicDemoData(locale?: string | null): FuneralInvitation {
  const isEn = (locale || '').toLowerCase().startsWith('en');
  if (isEn) {
    return {
      templateType: 'FULL',
      conceptType: 'FUNERAL',
      templateKey: 'invitation_full',
      deceasedName: 'Michael Anderson',
      birthDate: '1952-04-11',
      deathDate: '2035-05-02',
      chiefMourner: 'Sarah Anderson',
      familyMembers: ['Son James · Daniel', 'Daughter Emily · Grace', 'Grandchildren Noah · Olivia'],
      message:
        'With grateful hearts we invite you to a memorial gathering in loving memory.\n' +
        'Your presence and kind thoughts mean more than words.',
      funeralHall: {
        name: 'Serenity Memorial Hall',
        address: '120 Lakeshore Drive, Chicago, IL',
        mapImage: '/images/wedding/classic/map.jpg',
      },
      schedule: {
        wakeStart: '2035-05-02T09:00:00',
        funeralDate: '2035-05-04T09:00:00',
        burial: 'Lakeside Memorial Garden',
      },
      contact: {
        name: 'Family contact',
        phone: '+1 312-555-0148',
      },
      heroImage: undefined,
    };
  }
  return {
    templateType: 'FULL',
    conceptType: 'FUNERAL',
    templateKey: 'invitation_full',
    deceasedName: '홍길동',
    birthDate: '1952-04-11',
    deathDate: '2035-05-02',
    chiefMourner: '김순덕',
    familyMembers: ['아들 홍석주 · 홍석민 · 홍석식', '딸 홍현자 · 홍현미', '손녀 홍승철 · 홍승영', '외손자 홍지현'],
    message:
      '황망한 마음에 일일이 직접 연락드리지 못함을 널리 헤량해 주시기 바랍니다.\n' +
      '고인의 명복을 빌어주시고, 따뜻한 위로 부탁드립니다.',
    funeralHall: {
      name: '서울아산병원장례식장 특실',
      address: '서울특별시 송파구 올림픽로 43길 88 (풍납동)',
      mapImage: '/images/wedding/classic/map.jpg',
    },
    schedule: {
      wakeStart: '2035-05-02T09:00:00',
      funeralDate: '2035-05-04T09:00:00',
      burial: '성지 공원묘원',
    },
    contact: {
      name: '상주 대표',
      phone: '02-3010-2000',
    },
    heroImage: undefined,
  };
}
