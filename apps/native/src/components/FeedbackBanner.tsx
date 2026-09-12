import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

type Variant = 'info' | 'success' | 'error' | 'warning';

type Props = {
  message: string;
  variant?: Variant;
};

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  info: { bg: '#EEF2FF', text: colors.primary },
  success: { bg: '#DCFCE7', text: colors.success },
  error: { bg: '#FEE2E2', text: colors.error },
  warning: { bg: '#FEF3C7', text: colors.warning },
};

export function FeedbackBanner({ message, variant = 'info' }: Props) {
  const palette = variantStyles[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  text: { ...typography.body, },
});
