import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { EditorStep } from '@/src/hooks/useEditorSteps';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

type Props = {
  steps: EditorStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

export function EditorStepNavigator({ steps, currentIndex, onSelect }: Props) {
  const listRef = useRef<FlatList<EditorStep>>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const initialScrollDone = useRef(false);

  const sideInset = viewportWidth > 0 ? Math.max(viewportWidth / 2 - 56, spacing.lg) : spacing.lg;

  const centerCurrentStep = (animated: boolean) => {
    listRef.current?.scrollToIndex({
      index: currentIndex,
      animated,
      viewPosition: 0.5,
    });
  };

  useEffect(() => {
    if (!ready) return;
    centerCurrentStep(initialScrollDone.current);
    initialScrollDone.current = true;
  }, [currentIndex, ready]);

  const onViewportLayout = (event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
    setReady(true);
  };

  return (
    <View style={styles.wrap} onLayout={onViewportLayout}>
      <FlatList
        ref={listRef}
        horizontal
        data={steps}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sideInset }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => centerCurrentStep(true), 50);
          void info;
        }}
        renderItem={({ item }) => {
          const selected = item.index === currentIndex;
          const completed = item.index < currentIndex;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.index + 1}단계 ${item.title}`}
              onPress={() => onSelect(item.index)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipNum, selected && styles.chipTextSelected]}>
                {item.index + 1}
              </Text>
              <Text style={[styles.chipTitle, selected && styles.chipTextSelected]} numberOfLines={1}>
                {item.title}
              </Text>
              {completed ? <Text style={styles.doneMark}>✓</Text> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 220,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipNum: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTitle: {
    ...typography.caption,
    color: colors.text,
    flexShrink: 1,
  },
  chipTextSelected: {
    color: colors.surface,
  },
  doneMark: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
});
