import { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const colors = {
  primary: '#dc2626',
  primaryDark: '#b91c1c',
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  success: '#059669',
  danger: '#dc2626',
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const Inner = scroll ? ScrollView : View
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <Inner style={s.screen} contentContainerStyle={scroll ? s.screenContent : undefined}>
        {children}
      </Inner>
    </SafeAreaView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={s.heading}>{children}</Text>
}

export function Subtle({ children }: { children: ReactNode }) {
  return <Text style={s.subtle}>{children}</Text>
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
}) {
  const isOutline = variant === 'outline'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        isOutline ? s.btnOutline : s.btnPrimary,
        (disabled || loading) && s.btnDisabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[s.btnText, isOutline && { color: colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  )
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...props}
      />
    </View>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <Text style={s.error}>{children}</Text>
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
  screenContent: { padding: 20, gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  heading: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtle: { fontSize: 15, color: colors.muted },
  btn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
  },
  error: { color: colors.danger, fontSize: 14 },
})
