// src/screens/OnboardingScreen.js
// ─────────────────────────────────────────────────────────────────────────────
//  Black Pepper AI — Onboarding Walkthrough
//  • 5 swipeable slides introducing key features
//  • Progress dots + skip / next / get started buttons
//  • Saves "onboarded" flag to AsyncStorage → shown only once
//  • Call from AppNavigator: if !onboarded → Onboarding, else → Landing
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, SHADOW } from '../components/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    gradient: ['#0A1F05', '#1B5E20', '#2E7D32'],
    icon: 'leaf',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Welcome to\nBlack Pepper AI',
    subtitle: 'Smart agricultural intelligence for black pepper farmers and researchers at SLIIT.',
    tag: 'RESEARCH PLATFORM',
  },
  {
    id: '2',
    gradient: ['#1A237E', '#1565C0', '#1976D2'],
    icon: 'analytics-outline',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Live Soil\nMonitoring',
    subtitle:
      'Real-time IoT sensor data from ThingSpeak — nitrogen, phosphorus, potassium, pH and moisture tracked automatically.',
    tag: 'IoT SENSORS',
  },
  {
    id: '3',
    gradient: ['#4A0000', '#B71C1C', '#C62828'],
    icon: 'bug-outline',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Disease\nDetection',
    subtitle:
      'Upload a leaf photo and our EfficientNetB0 model identifies Leaf Blight, Slow Wilt, or Healthy with confidence scores.',
    tag: 'AI VISION',
  },
  {
    id: '4',
    gradient: ['#1A0033', '#4A148C', '#6A1B9A'],
    icon: 'scan-outline',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Variety\nIdentification',
    subtitle:
      'Identify Butawerala, Dingirala, and Kohukuburerala varieties from leaf images using a two-stage classification model.',
    tag: 'ML CLASSIFIER',
  },
  {
    id: '5',
    gradient: ['#0D3B0D', '#2E7D32', '#43A047'],
    icon: 'map-outline',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Smart Farm\nDashboard',
    subtitle:
      'Live GPS, nearby field recommendations, weather station data, and fertilizer planning — all in one place.',
    tag: 'FARM MANAGEMENT',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const finish = async () => {
    try {
      await AsyncStorage.setItem('onboarded', 'true');
    } catch {}
    navigation.replace('Landing');
  };

  const next = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
    } else {
      finish();
    }
  };

  const skip = () => finish();

  const isLast = current === SLIDES.length - 1;

  return (
    <View style={s.root}>
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
        renderItem={({ item }) => (
          <LinearGradient colors={item.gradient} style={s.slide}>
            {/* Icon */}
            <View style={[s.iconCircle, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={56} color="#fff" />
            </View>

            {/* Tag */}
            <View style={s.tag}>
              <Text style={s.tagTxt}>{item.tag}</Text>
            </View>

            {/* Text */}
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.subtitle}>{item.subtitle}</Text>
          </LinearGradient>
        )}
      />

      {/* ── BOTTOM CONTROLS ──────────────────────────────────────────── */}
      <View style={s.controls}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  s.dot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: i === current ? C.primary : C.border,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          {!isLast && (
            <TouchableOpacity style={s.skipBtn} onPress={skip} activeOpacity={0.75}>
              <Text style={s.skipTxt}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, isLast && s.nextBtnFull]}
            onPress={next}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']} style={s.nextGrad}>
              <Text style={s.nextTxt}>{isLast ? '🌿  Get Started' : 'Next'}</Text>
              {!isLast && (
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  slide: {
    width,
    minHeight: height * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 20,
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 18,
  },
  tagTxt: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 2 },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },

  controls: {
    backgroundColor: C.surface,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },

  btnRow: { flexDirection: 'row', gap: 12 },
  skipBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  skipTxt: { fontSize: 15, fontWeight: '700', color: C.text3 },
  nextBtn: { flex: 2, borderRadius: 16, overflow: 'hidden', ...SHADOW.md },
  nextBtnFull: { flex: 1 },
  nextGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  nextTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
