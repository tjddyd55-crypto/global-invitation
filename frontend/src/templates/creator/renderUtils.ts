import type { CSSProperties } from 'react';
import type { CreatorStudioConfig } from '@/src/creator/studioConfig';

export function buildCreatorFrameStyle(studioConfig: CreatorStudioConfig | null): CSSProperties {
  const theme = studioConfig?.theme;
  const spacingMap = {
    compact: { padding: 12, lineHeight: 1.45 },
    normal: { padding: 18, lineHeight: 1.6 },
    wide: { padding: 26, lineHeight: 1.75 },
  } as const;
  const spacing = theme ? spacingMap[theme.spacingScale] : spacingMap.normal;

  return {
    background: theme?.backgroundColor,
    color: theme?.textColor,
    fontFamily: theme?.fontFamily,
    lineHeight: spacing.lineHeight,
    padding: spacing.padding,
    ['--creator-primary-color' as string]: theme?.primaryColor,
  };
}

export function getSectionEnabled(
  studioConfig: CreatorStudioConfig | null,
  sectionKey: string,
  defaultValue = true
): boolean {
  const value = studioConfig?.sections?.[sectionKey]?.enabled;
  return typeof value === 'boolean' ? value : defaultValue;
}
