// components/ui.tsx
// Lightweight shared primitives so screens don't repeat styling. Kept in one
// file since none of these are complex enough to need their own module.
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '../constants/theme';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, icon }: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [isDisabled && { opacity: 0.5 }, pressed && !isDisabled && { opacity: 0.85 }, style]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {icon}
              <Text style={styles.btnText}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'outline' && styles.btnOutline,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'danger' ? colors.white : colors.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text
            style={[
              styles.btnText,
              (variant === 'outline' || variant === 'ghost') && { color: colors.primary },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({ label, error, icon, isPassword, style, secureTextEntry, ...props }: InputProps) {
  const [hidden, setHidden] = useState(!!isPassword);
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        {icon && <Ionicons name={icon} size={18} color={colors.textLight} style={styles.inputIcon} />}
        <TextInput
          style={[
            styles.input,
            icon ? { paddingLeft: 40 } : null,
            isPassword ? { paddingRight: 40 } : null,
            error ? { borderColor: colors.danger } : null,
            style,
          ]}
          placeholderTextColor={colors.textLight}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setHidden((h) => !h)} style={styles.inputToggle} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textLight} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({ text, tone = 'default' }: { text: string; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    default: { bg: '#f3f4f6', fg: '#374151' },
    success: { bg: colors.successLight, fg: colors.success },
    warning: { bg: colors.warningLight, fg: colors.warning },
    danger: { bg: colors.dangerLight, fg: colors.danger },
    info: { bg: colors.secondaryLight, fg: colors.secondary },
  };
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AuthHero — compact gradient header used on register/forgot-password
// screens, with a back button (full-screen version lives in login.tsx)
// ---------------------------------------------------------------------------
export function AuthHero({ title, subtitle, onBack }: { title: string; subtitle: string; onBack?: () => void }) {
  return (
    <LinearGradient colors={[colors.heroStart, colors.heroMid, colors.heroEnd]} style={authHeroStyles.hero}>
      {onBack && (
        <Pressable onPress={onBack} style={authHeroStyles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </Pressable>
      )}
      <Image source={require('../assets/icon.png')} style={authHeroStyles.mark} />
      <Text style={authHeroStyles.title}>{title}</Text>
      <Text style={authHeroStyles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

const authHeroStyles = StyleSheet.create({
  hero: { paddingTop: 64, paddingBottom: 32, paddingHorizontal: spacing.xl },
  backBtn: { position: 'absolute', top: 60, left: spacing.lg, zIndex: 10, padding: 4 },
  mark: { width: 44, height: 44, borderRadius: 12, marginBottom: spacing.sm },
  title: { ...type.h1, color: colors.white },
  subtitle: { ...type.body, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
});


export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Loading / Empty states
// ---------------------------------------------------------------------------
export function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({ title, subtitle, icon = 'file-tray-outline' }: { title: string; subtitle?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.centered}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={32} color={colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  btnGhost: { backgroundColor: 'transparent' },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  inputToggle: { position: 'absolute', right: 14, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 260 },
});
