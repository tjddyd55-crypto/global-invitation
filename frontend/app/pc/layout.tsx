import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PcShell from '@/src/ui/pc/PcShell';

export const metadata: Metadata = {
  title: 'Global Invitation — Desktop',
};

export default function PcLayout({ children }: { children: ReactNode }) {
  return <PcShell>{children}</PcShell>;
}
