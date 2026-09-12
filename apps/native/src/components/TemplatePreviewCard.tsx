import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { VisualTemplate } from '@/src/api/templates';
import { colors, radius, sizes, spacing, typography } from '@/src/theme/tokens';

type Props = {
  template: VisualTemplate;
  selected?: boolean;
  onPress?: () => void;
};

export function TemplatePreviewCard({ template, selected, onPress }: Props) {
  const imageUri = template.previewUrl || template.thumbnailUrl;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.item, selected && styles.itemSelected]}
    >
      <View style={styles.previewWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder]} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{template.title}</Text>
      {template.description ? (
        <Text style={styles.desc} numberOfLines={2}>{template.description}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: '100%',
    marginBottom: sizes.templateItemGap,
  },
  itemSelected: {
    opacity: 1,
  },
  previewWrap: {
    width: sizes.templatePreviewWidth,
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  preview: {
    width: sizes.templatePreviewWidth,
    height: Math.round(sizes.templatePreviewWidth * 1.45),
  },
  previewPlaceholder: {
    backgroundColor: colors.border,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  desc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
