import { redirect } from 'next/navigation';

/** 레거시 /create → 컨셉 선택(인증 게이트는 templates 쪽에서 처리). */
export default function CreatePage() {
  redirect('/templates');
}
