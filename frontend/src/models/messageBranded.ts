export type BrandedMessageCard = {
  templateKey: 'message_branded';
  brand: {
    key: 'jci';
    name: 'JCI Korea-Seoul';
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  heroImage: string;
  title: string;
  message: string;
  schedule: {
    date: string;
    time: string;
    place: string;
  };
  map: {
    lat: number;
    lng: number;
    label: string;
  };
};
