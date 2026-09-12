import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { EDITOR_STEP_COUNT } from '@/src/hooks/useEditorSteps';
import { t } from '@/src/i18n';

type Props = {
  stepIndex: number;
  title: string;
  onOpenSheet?: () => void;
  onPreview?: () => void;
};

export function EditorStepHeader({ stepIndex, title, onOpenSheet, onPreview }: Props) {
  const progress = ((stepIndex + 1) / EDITOR_STEP_COUNT) * 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.counter}>{stepIndex + 1} / {EDITOR_STEP_COUNT}</Text>
        {onPreview ? (
          <Pressable onPress={onPreview} accessibilityRole="button">
            <Text style={styles.preview}>{t('editor.preview')}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Pressable onPress={onOpenSheet} accessibilityRole="button" style={styles.titleBtn}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginBottom: spacing.xl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { ...typography.caption, color: colors.textSecondary },
  preview: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  titleBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  chevron: { color: colors.textSecondary, fontSize: 16 },
});
