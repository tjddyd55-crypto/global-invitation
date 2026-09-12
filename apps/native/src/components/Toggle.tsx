import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  description?: string;
};

export function Toggle({ label, value, onValueChange, description }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.row}
    >
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  textWrap: { flex: 1, gap: spacing.xs },
  label: { ...typography.bodyMedium, color: colors.text },
  desc: { ...typography.caption, color: colors.textSecondary },
  track: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: colors.primary },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  thumbOn: { alignSelf: 'flex-end' },
});
