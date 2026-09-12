import { ReactNode, useCallback, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { environment } from '@/src/config/environment';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { KeyboardFormContext } from '@/src/components/KeyboardFormContext';
import { colors, sizes, spacing, typography } from '@/src/theme/tokens';
import { t } from '@/src/i18n';

type Props = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
  footer?: ReactNode;
  showDevBadge?: boolean;
  extraBottomPadding?: number;
};

export function KeyboardFormScreen({
  children,
  padded = true,
  style,
  footer,
  showDevBadge = true,
  extraBottomPadding = 0,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const keyboardHeight = useKeyboardHeight();

  const scrollToField = useCallback((field: View) => {
    const scrollNode = scrollContentRef.current;
    if (!scrollNode) return;

    field.measureLayout(
      scrollNode,
      (_x, y, _width, height) => {
        const visiblePadding = 96;
        scrollRef.current?.scrollTo({
          y: Math.max(0, y + height - visiblePadding),
          animated: true,
        });
      },
      () => {
        field.measureInWindow((_x, y, _width, height) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y + height - 160),
            animated: true,
          });
        });
      },
    );
  }, []);

  const footerBottomInset = keyboardHeight > 0 ? keyboardHeight : 0;
  const contentBottom = spacing.xxl + extraBottomPadding + (footer ? 0 : footerBottomInset);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {showDevBadge && environment.isDev ? (
        <View style={styles.devBadge}>
          <View style={styles.devBadgePill}>
            <Text style={styles.devBadgeText}>{t('common.devBadge')}</Text>
          </View>
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
      >
        <KeyboardFormContext.Provider value={{ scrollToField }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            <View ref={scrollContentRef} style={[padded && styles.padded, style]}>
              {children}
            </View>
          </ScrollView>
        </KeyboardFormContext.Provider>
        {footer ? (
          <View style={[styles.footer, footerBottomInset > 0 && { marginBottom: footerBottomInset }]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function dismissKeyboard(): void {
  Keyboard.dismiss();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  padded: { paddingHorizontal: sizes.screenPadding },
  scrollContent: { flexGrow: 1 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  devBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    zIndex: 10,
  },
  devBadgePill: {
    backgroundColor: colors.devBadge,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  devBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
});
