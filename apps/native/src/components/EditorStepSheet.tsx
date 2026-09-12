import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { EditorStep } from '@/src/hooks/useEditorSteps';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

type Props = {
  visible: boolean;
  steps: EditorStep[];
  currentIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
};

export function EditorStepSheet({ visible, steps, currentIndex, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('editor.stepSheetTitle')}</Text>
        <ScrollView>
          {steps.map((step) => {
            const isCurrent = step.index === currentIndex;
            const isDone = step.index < currentIndex;
            return (
              <Pressable
                key={step.key}
                style={styles.row}
                onPress={() => {
                  onSelect(step.index);
                  onClose();
                }}
              >
                <Text style={[styles.stepNum, isCurrent && styles.stepNumCurrent]}>
                  {step.index + 1}
                </Text>
                <Text style={[styles.stepTitle, isCurrent && styles.stepTitleCurrent]}>
                  {step.title}
                </Text>
                {isDone ? <Text style={styles.done}>✓</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  title: { ...typography.heading, color: colors.text, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepNum: { ...typography.caption, color: colors.textSecondary, width: 24 },
  stepNumCurrent: { color: colors.primary, fontWeight: '700' },
  stepTitle: { ...typography.body, color: colors.text, flex: 1 },
  stepTitleCurrent: { fontWeight: '600', color: colors.primary },
  done: { color: colors.success, fontWeight: '700' },
});
