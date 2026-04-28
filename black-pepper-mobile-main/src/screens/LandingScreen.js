// src/screens/LandingScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../redux/slices/userSlice';
import { C, SHADOW } from '../components/theme';

// window width not required here; remove to satisfy lint

const MODULES = [
  {
    emoji: '🌱',
    title: 'Soil Monitor',
    sub: 'Live NPK · pH · Temperature via ThingSpeak IoT',
    screen: 'SoilAnalysis',
    color: C.blue,
    bg: '#E3F2FD',
  },
  {
    emoji: '🔬',
    title: 'Disease Detection',
    sub: 'Leaf blight & slow wilt · EfficientNetB0 AI',
    screen: 'DiseaseIdentification',
    color: '#D32F2F',
    bg: '#FFEBEE',
  },
  {
    emoji: '🫑',
    title: 'Variety Identifier',
    sub: 'Butawerala · Dingirala · Kohukuburerala',
    screen: 'VarietyHub',
    color: C.teal,
    bg: '#E0F7FA',
  },
  {
    emoji: '🌿',
    title: 'Fertilizer Advisor',
    sub: 'AI-ranked NPK recommendations for your soil',
    screen: 'Fertilizer',
    color: C.warning,
    bg: '#FFF8E1',
  },
  {
    emoji: '🗺️',
    title: 'Farm Dashboard',
    sub: 'GPS satellite map · Field overview',
    screen: 'Dashboard',
    color: C.rose,
    bg: '#FCE4EC',
  },
  {
    emoji: '🌤️',
    title: 'Weather Station',
    sub: 'Live weather · Farming advisories',
    screen: 'Weather',
    color: C.indigo,
    bg: '#E8EAF6',
  },
];

const STATS = [
  { val: '95%+', lbl: 'Accuracy', icon: 'trophy-outline' },
  { val: '3K+', lbl: 'Images', icon: 'images-outline' },
  { val: '4', lbl: 'ML Models', icon: 'hardware-chip-outline' },
  { val: 'Live', lbl: 'IoT Data', icon: 'wifi-outline' },
];

export default function LandingScreen({ navigation }) {
  const currentUser = useSelector(selectCurrentUser);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(30)).current;
  const cardAnims = useRef(MODULES.map(() => new Animated.Value(40))).current;

  // cardAnims/fade/rise are Animated.Value refs and intentionally stable

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start(() =>
      Animated.stagger(
        55,
        cardAnims.map((a) =>
          Animated.spring(a, { toValue: 0, tension: 95, friction: 13, useNativeDriver: true }),
        ),
      ).start(),
    );
  }, [cardAnims, fade, rise]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.gradStart} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ── HERO ── */}
        <LinearGradient colors={[C.gradStart, C.gradMid, C.gradEnd]} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
              {/* Top bar */}
              <View style={s.topBar}>
                <View style={s.logoRow}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                    style={s.logoIcon}
                  >
                    <Text style={{ fontSize: 24 }}>🌿</Text>
                  </LinearGradient>
                  <View>
                    <Text style={s.logoName}>Black Pepper AI</Text>
                    <Text style={s.logoSub}>Smart Guardian System · SLIIT</Text>
                  </View>
                </View>
                {currentUser ? (
                  <View style={s.userBadge}>
                    <Ionicons name="person-circle-outline" size={16} color={C.white} />
                    <Text style={s.userBadgeTxt} numberOfLines={1}>
                      {currentUser.name}
                    </Text>
                  </View>
                ) : (
                  <View style={s.authBtns}>
                    <TouchableOpacity
                      style={s.btnOutlineW}
                      onPress={() => navigation.navigate('SignIn')}
                    >
                      <Text style={s.btnOutlineWTxt}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.btnSolidW}
                      onPress={() => navigation.navigate('SignUp')}
                    >
                      <Text style={s.btnSolidWTxt}>Register</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Hero body */}
              <View style={s.heroBody}>
                <View style={s.heroBadge}>
                  <View style={s.heroBadgeDot} />
                  <Text style={s.heroBadgeTxt}>AI-POWERED AGRICULTURE</Text>
                </View>
                <Text style={s.heroTitle}>Intelligent{'\n'}Farming Starts Here</Text>
                <Text style={s.heroDesc}>
                  Computer vision · IoT sensors · Ensemble ML{'\n'}
                  Real-time analytics for Sri Lankan black pepper cultivation
                </Text>

                {/* Stats row */}
                <View style={s.statsRow}>
                  {STATS.map(({ val, lbl, icon }) => (
                    <View key={lbl} style={s.statBox}>
                      <Ionicons
                        name={icon}
                        size={16}
                        color="rgba(255,255,255,0.85)"
                        style={{ marginBottom: 4 }}
                      />
                      <Text style={s.statVal}>{val}</Text>
                      <Text style={s.statLbl}>{lbl}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                {!currentUser && (
                  <View style={s.ctaRow}>
                    <TouchableOpacity
                      style={s.ctaPrimary}
                      onPress={() => navigation.navigate('SignUp')}
                      activeOpacity={0.88}
                    >
                      <Text style={s.ctaPrimaryTxt}>Get Started Free</Text>
                      <Ionicons name="arrow-forward" size={16} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.ctaSecondary}
                      onPress={() => navigation.replace('Home')}
                      activeOpacity={0.88}
                    >
                      <Text style={s.ctaSecondaryTxt}>Browse as Guest</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {currentUser && (
                  <TouchableOpacity
                    style={s.ctaPrimary}
                    onPress={() => navigation.replace('Home')}
                    activeOpacity={0.88}
                  >
                    <Text style={s.ctaPrimaryTxt}>Open Dashboard</Text>
                    <Ionicons name="arrow-forward" size={16} color={C.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── MODULES ── */}
        <View style={s.modulesSection}>
          <View style={s.sectionHead}>
            <View style={s.sectionCapRow}>
              <View style={s.sectionCapLine} />
              <Text style={s.sectionCap}>RESEARCH MODULES</Text>
              <View style={s.sectionCapLine} />
            </View>
            <Text style={s.sectionTitle}>6 AI-Powered Features</Text>
            <Text style={s.sectionSub}>
              Tap any module to explore. Each feature is powered by trained ML models.
            </Text>
          </View>

          <View style={s.moduleGrid}>
            {MODULES.map((m, i) => (
              <Animated.View
                key={m.screen}
                style={{ transform: [{ translateY: cardAnims[i] }], opacity: fade, width: '48%' }}
              >
                <TouchableOpacity
                  style={[s.moduleCard, { borderTopColor: m.color }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(m.screen)}
                  accessibilityRole="button"
                  accessibilityLabel={m.title}
                >
                  <View style={[s.moduleEmoji, { backgroundColor: m.bg }]}>
                    <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                  </View>
                  <Text style={[s.moduleTitle, { color: m.color }]}>{m.title}</Text>
                  <Text style={s.moduleSub}>{m.sub}</Text>
                  <View style={[s.moduleChip, { backgroundColor: m.color + '18' }]}>
                    <Text style={[s.moduleChipTxt, { color: m.color }]}>Open →</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── ABOUT ── */}
        <View style={s.aboutSection}>
          <LinearGradient colors={[C.gradStart, C.gradMid]} style={s.aboutCard}>
            <View style={s.aboutRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.aboutTitle}>SLIIT Research Project</Text>
                <Text style={s.aboutDesc}>
                  Developed to improve black pepper cultivation in Sri Lanka using deep learning,
                  IoT sensors, and mobile technology.
                </Text>
                <View style={s.aboutTags}>
                  {['TensorFlow', 'EfficientNet', 'ThingSpeak', 'Expo'].map((tag) => (
                    <View key={tag} style={s.aboutTag}>
                      <Text style={s.aboutTagTxt}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={{ fontSize: 48 }}>🌿</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={s.footer}>Black Pepper AI · SLIIT · v2.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  // Hero
  hero: { paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 28,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoName: { fontSize: 15, fontWeight: '900', color: C.white, letterSpacing: -0.3 },
  logoSub: { fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.2, marginTop: 1 },

  authBtns: { flexDirection: 'row', gap: 8 },
  btnOutlineW: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  btnOutlineWTxt: { color: C.white, fontSize: 12, fontWeight: '700' },
  btnSolidW: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  btnSolidWTxt: { color: C.white, fontSize: 12, fontWeight: '800' },

  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  userBadgeTxt: { color: C.white, fontSize: 12, fontWeight: '700', maxWidth: 90 },

  heroBody: { paddingHorizontal: 22 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 16 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
  heroBadgeTxt: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: C.white,
    lineHeight: 39,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 20, marginBottom: 22 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statVal: { fontSize: 16, fontWeight: '900', color: C.white },
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.72)', marginTop: 2, fontWeight: '600' },

  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    ...SHADOW.md,
  },
  ctaPrimaryTxt: { color: C.primary, fontSize: 14, fontWeight: '900' },
  ctaSecondary: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center',
  },
  ctaSecondaryTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },

  // Modules
  modulesSection: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8 },
  sectionHead: { marginBottom: 20, alignItems: 'center' },
  sectionCapRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionCapLine: { flex: 1, height: 1, backgroundColor: C.border },
  sectionCap: { fontSize: 10, fontWeight: '800', color: C.text3, letterSpacing: 2 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionSub: { fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 19 },

  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  moduleCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 16,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.sm,
    marginBottom: 0,
  },
  moduleEmoji: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  moduleSub: { fontSize: 11, color: C.text3, lineHeight: 15, marginBottom: 12 },
  moduleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  moduleChipTxt: { fontSize: 11, fontWeight: '800' },

  // About
  aboutSection: { paddingHorizontal: 16, marginBottom: 24 },
  aboutCard: { borderRadius: 22, padding: 22 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  aboutTitle: { fontSize: 15, fontWeight: '900', color: C.white, marginBottom: 8 },
  aboutDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 18, marginBottom: 12 },
  aboutTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aboutTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aboutTagTxt: { fontSize: 10, color: C.white, fontWeight: '700' },

  footer: { textAlign: 'center', color: C.hint, fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
});
