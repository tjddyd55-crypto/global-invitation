export type MessageCardActions = {
  calendar: boolean;
  copyLink: boolean;
  kakaoShare: boolean;
};

export type MessageCardTheme = 'light' | 'dark';

export type MessageCardData = {
  id?: string;
  slug: string;
  coverImage: string;
  title: string;
  subtitle?: string;
  description?: string;
  eventDate?: string;
  location?: string;
  actions: MessageCardActions;
  theme?: MessageCardTheme;
};
