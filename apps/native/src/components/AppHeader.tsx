import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/src/theme/tokens';

type Props = {
  title?: string;
  showBack?: boolean;
  rightLabel?: string;
  onRightPress?: () => void;
};

export function AppHeader({ title, showBack, rightLabel, onRightPress }: Props) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.flex} />}
      {rightLabel ? (
        <Pressable accessibilityRole="button" onPress={onRightPress} style={styles.right}>
          <Text style={styles.rightText}>{rightLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 44 },
  backText: { fontSize: 22, color: colors.text },
  title: { ...typography.heading, color: colors.text, flex: 1, textAlign: 'center' },
  flex: { flex: 1 },
  right: { paddingHorizontal: spacing.sm, minHeight: 44, justifyContent: 'center' },
  rightText: { ...typography.bodyMedium, color: colors.primary },
});
