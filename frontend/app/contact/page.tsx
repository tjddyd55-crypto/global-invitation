import type { Metadata } from 'next';
import ContactPage from '@/src/features/contact/ui/ContactPage';

export const metadata: Metadata = {
  title: '문의하기 | Invite',
  description: '서비스 이용·결제·오류 관련 문의를 이메일로 보내 주세요.',
};

export default function ContactRoutePage() {
  return <ContactPage />;
}
