export type MessageSimpleSchedule = {
  date?: string;
  time?: string;
  place?: string;
};

export type MessageSimpleActions = {
  copyLink: boolean;
  kakaoShare: boolean;
  calendarSave: boolean;
};

export type MessageCardSimple = {
  templateKey: 'message_simple';
  heroImage: string;
  title?: string;
  subtitle?: string;
  message: string;
  schedule?: MessageSimpleSchedule;
  actions: MessageSimpleActions;
};
