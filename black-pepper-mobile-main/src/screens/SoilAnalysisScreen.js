// src/screens/SoilAnalysisScreen.js — FIXED
// Fix 1: fetchData added to useEffect dependency array (stale-closure bug)
// Fix 2: MetricCard wrapped in React.memo (stops animations re-running every second)
// Fix 3: Minor animation deps warning fixed
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { C, SHADOW } from '../components/theme';
import {
  PrimaryButton,
  OutlineButton,
  EmptyState,
  ErrorBanner,
  StatusBadge,
} from '../components/ui';
import BottomNav from '../components/BottomNav';
import { SOIL_ANALYSIS_URL } from '../config/api';

const AUTO_REFRESH = 30;
const TIMEOUT_MS = 15000;

const METRICS = [
  {
    key: 'Moisture',
    label: 'Moisture',
    unit: '%',
    emoji: '💧',
    color: C.blue,
    min: 0,
    max: 100,
    ideal: [50, 75],
  },
  {
    key: 'Temperature',
    label: 'Temperature',
    unit: '°C',
    emoji: '🌡️',
    color: C.warning,
    min: 15,
    max: 40,
    ideal: [22, 32],
  },
  {
    key: 'pH',
    label: 'pH Level',
    unit: '',
    emoji: '🧪',
    color: C.purple,
    min: 3,
    max: 9,
    ideal: [5.5, 7.0],
  },
  {
    key: 'Nitrogen',
    label: 'Nitrogen',
    unit: 'mg/kg',
    emoji: '🌿',
    color: C.success,
    min: 0,
    max: 300,
    ideal: [40, 80],
  },
  {
    key: 'Phosphorus',
    label: 'Phosphorus',
    unit: 'mg/kg',
    emoji: '🌸',
    color: C.rose,
    min: 0,
    max: 100,
    ideal: [20, 40],
  },
  {
    key: 'Potassium',
    label: 'Potassium',
    unit: 'mg/kg',
    emoji: '🟤',
    color: C.brown,
    min: 0,
    max: 400,
    ideal: [60, 120],
  },
];

function statusOf(key, raw) {
  const m = METRICS.find((x) => x.key === key);
  const v = parseFloat(raw);
  if (!m || isNaN(v)) return { color: C.hint, label: '—' };
  if (v >= m.ideal[0] && v <= m.ideal[1]) return { color: C.success, label: 'Optimal' };
  if (v < m.ideal[0] * 0.75 || v > m.ideal[1] * 1.35) return { color: C.error, label: 'Critical' };
  return { color: C.warning, label: 'Off-range' };
}

function barPct(key, raw) {
  const m = METRICS.find((x) => x.key === key);
  const v = parseFloat(raw);
  if (!m || isNaN(v)) return 2;
  return Math.min(100, Math.max(2, ((v - m.min) / (m.max - m.min)) * 100));
}

// ✅ FIXED: wrapped in React.memo so animations don't re-run every second
const MetricCard = React.memo(function MetricCard({ m, value, delay }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — only run once on mount

  const { color, label } = statusOf(m.key, value);
  const pct = barPct(m.key, value);
  const displayVal =
    value != null
      ? m.key === 'pH'
        ? parseFloat(value).toFixed(1)
        : Math.round(parseFloat(value))
      : '—';

  return (
    <Animated.View
      style={[s.metricCard, { opacity: fade, transform: [{ translateY: slide }] }]}
      accessible
      accessibilityLabel={`${m.label}: ${displayVal}${m.unit}. Status: ${label}`}
    >
      <View style={s.metricTop}>
        <View style={[s.metricIcon, { backgroundColor: m.color + '18' }]}>
          <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
        </View>
        <View style={s.metricText}>
          <Text style={s.metricLabel}>{m.label}</Text>
          <Text style={[s.metricVal, { color }]}>
            {displayVal}
            {m.unit ? ` ${m.unit}` : ''}
          </Text>
        </View>
        <StatusBadge label={label} color={color} />
      </View>
      <View style={s.barBg}>
        <View
          style={[
            s.idealZone,
            {
              left: `${((m.ideal[0] - m.min) / (m.max - m.min)) * 100}%`,
              width: `${((m.ideal[1] - m.ideal[0]) / (m.max - m.min)) * 100}%`,
            },
          ]}
        />
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.idealTxt}>
        Ideal: {m.ideal[0]}–{m.ideal[1]}
        {m.unit || ''}
      </Text>
    </Animated.View>
  );
});

export default function SoilAnalysisScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErrMsg('');
    setWarnings([]);
    try {
      const res = await axios.get(SOIL_ANALYSIS_URL, { timeout: TIMEOUT_MS });
      if (!res.data?.sensors) throw new Error('Server response missing sensor data.');

      const warns = [];
      METRICS.forEach((m) => {
        const v = parseFloat(res.data.sensors[m.key]);
        if (isNaN(v)) warns.push(`${m.label}: no data`);
        else if (v < m.min - 1 || v > m.max + 1)
          warns.push(`${m.label} out of expected range: ${v}${m.unit}`);
      });
      if (isMounted.current) {
        setData(res.data);
        setWarnings(warns);
        setLastFetch(new Date().toLocaleTimeString());
        setCountdown(AUTO_REFRESH);
      }
    } catch (e) {
      if (isMounted.current) {
        setErrMsg(
          e.message?.match(/Network|connect|ECONNREFUSED/i)
            ? 'Cannot reach server. Make sure the Node.js backend is running on port 5001.'
            : e.code === 'ECONNABORTED'
            ? 'Request timed out. Check your server.'
            : e.message || 'Unexpected error.',
        );
        setCountdown(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // ✅ FIXED: fetchData is now in the dependency array
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      fetchData(true);
      return;
    }
    const t = setTimeout(() => isMounted.current && setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, fetchData]);

  const goToFertilizer = useCallback(() => {
    if (!data?.sensors) return;
    const { Nitrogen: n, Phosphorus: p, Potassium: k, pH: ph } = data.sensors;
    if ([n, p, k, ph].map(parseFloat).some(isNaN)) {
      Alert.alert('Invalid Data', 'One or more sensor readings are invalid. Please re-fetch.');
      return;
    }
    navigation.navigate('Fertilizer', {
      nitrogen: parseFloat(n),
      phosphorus: parseFloat(p),
      potassium: parseFloat(k),
      ph: parseFloat(ph),
      farmName: 'Live Sensor Data',
    });
  }, [data, navigation]);

  const sensors = data?.sensors ?? null;
  const ai = data?.ai_analysis ?? null;
  const isHealthy = ai?.status === 'Healthy' || ai?.prediction === 'Healthy';

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData(true);
            }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* HERO */}
        <LinearGradient colors={[C.gradStart, '#33691E', '#558B2F']} style={s.hero}>
          <View style={s.heroBadge}>
            <View style={s.heroBadgeDot} />
            <Text style={s.heroBadgeTxt}>🌱 LIVE THINGSPEAK IoT</Text>
          </View>
          <Text style={s.heroTitle}>Soil Monitor</Text>
          <Text style={s.heroSub}>
            Real-time NPK · Temperature · Moisture · pH{'\n'}Ensemble AI: RF + XGBoost + SVM
          </Text>

          <View style={s.statusRow}>
            {[
              { val: lastFetch ?? '—', lbl: 'Last Read' },
              {
                val: errMsg ? 'Offline' : lastFetch ? 'Online' : 'Ready',
                lbl: 'Status',
                dot: true,
                dotColor: errMsg ? C.error : lastFetch ? '#69F0AE' : C.warning,
              },
              { val: countdown != null ? `${countdown}s` : '—', lbl: 'Refresh In' },
            ].map((item, i) => (
              <React.Fragment key={item.lbl}>
                {i > 0 && <View style={s.statusDiv} />}
                <View style={s.statusItem}>
                  {item.dot ? (
                    <View style={s.dotRow}>
                      <View style={[s.dot, { backgroundColor: item.dotColor }]} />
                      <Text style={s.statusVal}>{item.val}</Text>
                    </View>
                  ) : (
                    <Text style={s.statusVal}>{item.val}</Text>
                  )}
                  <Text style={s.statusLbl}>{item.lbl}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* Fetch button */}
        <View style={s.fetchWrap}>
          <PrimaryButton
            title="📡  Read Sensors Now"
            onPress={() => fetchData(false)}
            loading={loading}
            style={s.fetchBtn}
          />
          <Text style={s.pullHint}>or pull down to refresh</Text>
        </View>

        {/* Error */}
        {!!errMsg && <ErrorBanner message={errMsg} onRetry={() => fetchData(false)} />}

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={s.warnCard}>
            <Text style={s.warnTitle}>⚠️ Data Quality Warnings</Text>
            {warnings.map((w, i) => (
              <Text key={i} style={s.warnTxt}>
                • {w}
              </Text>
            ))}
          </View>
        )}

        {/* AI verdict */}
        {ai && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🤖 AI Verdict</Text>
            <View
              style={[
                s.verdictCard,
                {
                  backgroundColor: isHealthy ? '#E8F5E9' : '#FFEBEE',
                  borderColor: isHealthy ? '#A5D6A7' : '#FFCDD2',
                },
              ]}
            >
              <Text style={{ fontSize: 32 }}>{isHealthy ? '✅' : '⚠️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.verdictTitle, { color: isHealthy ? C.success : C.error }]}>
                  {ai.consensus ?? ai.prediction ?? '—'}
                </Text>
                <Text style={s.verdictSub}>
                  {ai.rule_based
                    ? `Rule-based · ${ai.note ?? ''}`
                    : `RF: ${ai.rf ?? '—'}  ·  XGB: ${ai.xgb ?? '—'}  ·  SVM: ${ai.svm ?? '—'}`}
                </Text>
              </View>
            </View>
            <Text style={s.verdictNote}>
              {isHealthy
                ? '✅ Soil nutrients are within the optimal range for black pepper cultivation.'
                : '⚠️ One or more nutrients are outside the optimal range. Tap below for a fertilizer plan.'}
            </Text>
          </View>
        )}

        {/* Sensor readings */}
        {sensors && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📊 Sensor Readings</Text>
            <Text style={s.sectionSub}>
              6 live parameters from your RS-485 IoT sensor via ThingSpeak
            </Text>
            {METRICS.map((m, i) => {
              const val = sensors[m.key];
              if (val == null) return null;
              return <MetricCard key={m.key} m={m} value={val} delay={i * 55} />;
            })}
          </View>
        )}

        {/* Reference table */}
        {sensors && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📋 Optimal Ranges</Text>
            <View style={s.rangeCard}>
              {METRICS.map((m, i, arr) => {
                const { color, label } = statusOf(m.key, sensors[m.key]);
                return (
                  <View key={m.key} style={[s.rangeRow, i < arr.length - 1 && s.rangeRowBorder]}>
                    <Text style={{ fontSize: 15 }}>{m.emoji}</Text>
                    <Text style={s.rangeName}>{m.label}</Text>
                    <Text style={s.rangeVal}>
                      {m.ideal[0]}–{m.ideal[1]}
                      {m.unit ? ` ${m.unit}` : ''}
                    </Text>
                    <StatusBadge label={label} color={color} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Actions */}
        {sensors && (
          <View style={s.section}>
            <PrimaryButton
              title="🌿  Get Fertilizer Recommendations"
              onPress={goToFertilizer}
              style={{ marginBottom: 10 }}
            />
            <OutlineButton
              title="🗺️  View Regional Dashboard"
              onPress={() => navigation.navigate('Dashboard')}
            />
          </View>
        )}

        {/* Empty state */}
        {!data && !loading && !errMsg && (
          <EmptyState
            emoji="📡"
            title="Ready to Read Sensors"
            subtitle={
              'Tap the button above to fetch live soil data.\n\nMake sure your backend is running:\ncd backend → npm run dev'
            }
          />
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
      <BottomNav navigation={navigation} active="Soil" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 16 },

  hero: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
  heroBadgeTxt: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: C.white, marginBottom: 6 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 18, marginBottom: 16 },

  statusRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
  },
  statusItem: { flex: 1, alignItems: 'center' },
  statusVal: { fontSize: 13, fontWeight: '800', color: C.white, marginBottom: 2 },
  statusLbl: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5 },
  statusDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  fetchWrap: { padding: 16, paddingBottom: 6 },
  fetchBtn: { borderRadius: 14 },
  pullHint: { textAlign: 'center', fontSize: 10, color: C.hint, marginTop: 6 },

  warnCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 12,
  },
  warnTitle: { fontSize: 13, fontWeight: '700', color: C.warning, marginBottom: 6 },
  warnTxt: { fontSize: 12, color: C.warning, lineHeight: 18 },

  section: { paddingHorizontal: 16, paddingBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4 },
  sectionSub: { fontSize: 11, color: C.text3, marginBottom: 12 },

  verdictCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  verdictTitle: { fontSize: 20, fontWeight: '900', marginBottom: 3 },
  verdictSub: { fontSize: 11, color: C.text3 },
  verdictNote: {
    fontSize: 13,
    color: C.text2,
    lineHeight: 19,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },

  metricCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.xs,
  },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricText: { flex: 1 },
  metricLabel: { fontSize: 12, fontWeight: '700', color: C.text3, marginBottom: 2 },
  metricVal: { fontSize: 18, fontWeight: '900' },
  barBg: { height: 7, backgroundColor: C.surface2, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4, position: 'absolute', top: 0, left: 0 },
  idealZone: { position: 'absolute', top: 0, height: 7, backgroundColor: C.primary + '30' },
  idealTxt: { fontSize: 9, color: C.hint, marginTop: 4, textAlign: 'right', fontWeight: '600' },

  rangeCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  rangeRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  rangeName: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  rangeVal: { fontSize: 11, color: C.text3, marginRight: 6 },
});
