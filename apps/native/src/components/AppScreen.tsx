import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardFormScreen } from '@/src/components/KeyboardFormScreen';
import { colors, sizes } from '@/src/theme/tokens';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  footer?: ReactNode;
};

export function AppScreen({ children, scroll = true, padded = true, style, footer }: Props) {
  if (scroll) {
    return (
      <KeyboardFormScreen padded={padded} style={style} footer={footer}>
        {children}
      </KeyboardFormScreen>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.flex, padded && styles.padded, style]}>{children}</View>
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  padded: { paddingHorizontal: sizes.screenPadding },
});
