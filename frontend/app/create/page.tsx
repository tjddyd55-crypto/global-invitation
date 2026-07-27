import { redirect } from 'next/navigation';

/** 레거시 /create → 공식 컨셉 선택. */
export default function CreatePage() {
  redirect('/create/concept');
}
