import type { ReactNode } from 'react';
import PcShell from '@/src/ui/pc/PcShell';

export default function PcAppLayout({ children }: { children: ReactNode }) {
  return <PcShell>{children}</PcShell>;
}
