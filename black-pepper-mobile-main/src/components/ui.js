// src/components/ui.js  — Reusable Professional Components
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, SHADOW } from './theme';

// ── FormField ────────────────────────────────────────────────────────────────
export function FormField({ label, error, helper, required, children }) {
  return (
    <View style={f.wrap}>
      {label && (
        <View style={f.labelRow}>
          <Text style={f.label}>{label}</Text>
          {required && <Text style={f.req}> *</Text>}
        </View>
      )}
      <View style={[f.inputBox, error && f.inputBoxErr]}>{children}</View>
      {error && (
        <View style={f.msgRow}>
          <Ionicons name="alert-circle" size={13} color={C.error} />
          <Text style={f.errMsg}>{error}</Text>
        </View>
      )}
      {!error && helper && <Text style={f.helper}>{helper}</Text>}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: C.label },
  req: { fontSize: 13, fontWeight: '700', color: C.error },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputBoxErr: { borderColor: C.error + '88', backgroundColor: '#fff5f5' },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  errMsg: { fontSize: 12, color: C.error, flex: 1 },
  helper: { fontSize: 11, color: C.text3, marginTop: 5 },
});

// ── StyledInput ───────────────────────────────────────────────────────────────
export function StyledInput({ iconName, error, rightElement, style, ...props }) {
  return (
    <>
      {iconName && (
        <View style={inp.iconWrap}>
          <Ionicons name={iconName} size={18} color={error ? C.error : C.hint} />
        </View>
      )}
      <TextInput style={[inp.input, style]} placeholderTextColor={C.hint} {...props} />
      {rightElement}
    </>
  );
}
const inp = StyleSheet.create({
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 0 },
  iconWrap: { marginRight: 10 },
});

// ── PrimaryButton ──────────────────────────────────────────────────────────
export function PrimaryButton({ title, onPress, loading, disabled, icon, style }) {
  return (
    <TouchableOpacity
      style={[b.btn, (disabled || loading) && b.btnOff, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={C.white} size="small" />
      ) : (
        <View style={b.inner}>
          {icon && <Ionicons name={icon} size={18} color={C.white} />}
          <Text style={b.txt}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── OutlineButton ──────────────────────────────────────────────────────────
export function OutlineButton({ title, onPress, disabled, icon, style }) {
  return (
    <TouchableOpacity
      style={[b.out, disabled && b.btnOff, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={b.inner}>
        {icon && <Ionicons name={icon} size={18} color={C.primary} />}
        <Text style={b.outTxt}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const b = StyleSheet.create({
  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  out: {
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: { opacity: 0.55 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txt: { color: C.white, fontSize: 15, fontWeight: '800' },
  outTxt: { color: C.primary, fontSize: 15, fontWeight: '700' },
});

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[cd.card, style]}>{children}</View>;
}
const cd = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.sm,
  },
});

// ── SectionHeader ─────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  return (
    <View style={sh.wrap}>
      <Text style={sh.title}>{title}</Text>
      {subtitle && <Text style={sh.sub}>{subtitle}</Text>}
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: { marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 3 },
  sub: { fontSize: 12, color: C.text3, lineHeight: 17 },
});

// ── StatusBadge ───────────────────────────────────────────────────────────
export function StatusBadge({ label, color, bg }) {
  return (
    <View style={[sb.wrap, { backgroundColor: bg || color + '18', borderColor: color + '33' }]}>
      <View style={[sb.dot, { backgroundColor: color }]} />
      <Text style={[sb.txt, { color }]}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  txt: { fontSize: 11, fontWeight: '700' },
});

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle }) {
  return (
    <View style={es.wrap}>
      <Text style={es.emoji}>{emoji}</Text>
      <Text style={es.title}>{title}</Text>
      {subtitle && <Text style={es.sub}>{subtitle}</Text>}
    </View>
  );
}
const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emoji: { fontSize: 56, marginBottom: 16, opacity: 0.5 },
  title: { fontSize: 18, fontWeight: '700', color: C.text2, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});

// ── ErrorBanner ───────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
  return (
    <View style={eb.wrap}>
      <Ionicons name="warning-outline" size={20} color={C.error} />
      <Text style={eb.msg}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={eb.btn}>
          <Text style={eb.btnTxt}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const eb = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.error + '33',
    margin: 16,
  },
  msg: { flex: 1, fontSize: 13, color: C.error, lineHeight: 18 },
  btn: { backgroundColor: C.error, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnTxt: { color: C.white, fontSize: 12, fontWeight: '700' },
});
