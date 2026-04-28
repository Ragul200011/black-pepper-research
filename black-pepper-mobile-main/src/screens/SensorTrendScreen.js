// src/screens/SensorTrendScreen.js
// ─────────────────────────────────────────────────────────────────────────────
//  Black Pepper AI — Sensor Trend Charts
//  • Fetches ThingSpeak historical data (last 24 / 7d / 30d)
//  • Line charts for N, P, K, pH, Temperature, Moisture
//  • react-native-chart-kit LineChart
//  • Optimal range bands shown as coloured labels
//  Install: npx expo install react-native-chart-kit react-native-svg
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { C, SHADOW } from '../components/theme';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 48;

// ThingSpeak config (matches server.js)
const TS_CHANNEL = '3187265';
const TS_KEY = 'ISFWVJXZW7P5TMQ9';

const PERIODS = [
  { label: '24 H', results: 24 },
  { label: '7 Days', results: 168 },
  { label: '30 Days', results: 720 },
];

const SENSORS = [
  {
    key: 'field2',
    label: 'Temperature',
    unit: '°C',
    color: '#E53935',
    field: 2,
    optMin: 20,
    optMax: 35,
  },
  {
    key: 'field1',
    label: 'Moisture',
    unit: '%',
    color: '#1565C0',
    field: 1,
    optMin: 50,
    optMax: 80,
  },
  {
    key: 'field5',
    label: 'Nitrogen',
    unit: 'N',
    color: '#2E7D32',
    field: 5,
    optMin: 50,
    optMax: 120,
  },
  {
    key: 'field6',
    label: 'Phosphorus',
    unit: 'P',
    color: '#AD1457',
    field: 6,
    optMin: 20,
    optMax: 50,
  },
  {
    key: 'field7',
    label: 'Potassium',
    unit: 'K',
    color: '#6D4C41',
    field: 7,
    optMin: 80,
    optMax: 160,
  },
  { key: 'field4', label: 'pH', unit: '', color: '#6A1B9A', field: 4, optMin: 5.5, optMax: 7.0 },
];

function formatLabels(feeds, period) {
  if (!feeds?.length) return [];
  const step = Math.max(1, Math.floor(feeds.length / 6));
  return feeds.map((f, i) => {
    if (i % step !== 0) return '';
    const d = new Date(f.created_at);
    if (period.results <= 24) return `${d.getHours()}:00`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
}

function parseFeeds(feeds, fieldKey) {
  return feeds.map((f) => parseFloat(f[fieldKey])).filter((v) => !isNaN(v));
}

const chartConfig = (color) => ({
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 1,
  color: (opacity = 1) =>
    `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`,
  labelColor: (opacity = 1) => `rgba(80,100,80,${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: '3', strokeWidth: '1', stroke: color },
  propsForBackgroundLines: { stroke: '#EDF3E8', strokeWidth: 1 },
});

export default function SensorTrendScreen({ navigation }) {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const fetchData = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        `https://api.thingspeak.com/channels/${TS_CHANNEL}/feeds.json` +
        `?api_key=${TS_KEY}&results=${p.results}`;
      const res = await axios.get(url, { timeout: 10000 });
      if (mounted.current) {
        setFeeds(res.data.feeds ?? []);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (e) {
      if (mounted.current) setError('Could not load sensor data. Check your ThingSpeak API key.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // labels intentionally unused — using displayLabels per-chart below

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <LinearGradient colors={['#0A1F05', '#1B5E20', '#2E7D32']} style={s.hero}>
        <View style={s.heroBadge}>
          <Ionicons name="trending-up-outline" size={13} color="#A5D6A7" />
          <Text style={s.heroBadgeTxt}> SENSOR TRENDS</Text>
        </View>
        <Text style={s.heroTitle}>Soil & Climate History</Text>
        <Text style={s.heroSub}>Live ThingSpeak sensor data over time</Text>
        {lastUpdate && (
          <View style={s.heroUpdated}>
            <Ionicons
              name="refresh-outline"
              size={11}
              color="rgba(165,214,167,0.8)"
              style={{ marginRight: 4 }}
            />
            <Text style={s.heroUpdatedTxt}>Updated {lastUpdate}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Period selector */}
      <View style={s.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={[s.periodBtn, period.label === p.label && s.periodBtnActive]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.8}
          >
            <Text style={[s.periodTxt, period.label === p.label && s.periodTxtActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.refreshBtn} onPress={() => fetchData(period)}>
          <Ionicons name="refresh-outline" size={18} color={C.primary} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingTxt}>Loading sensor data…</Text>
        </View>
      )}

      {error && (
        <View style={s.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={C.error}
            style={{ marginRight: 8 }}
          />
          <Text style={s.errorTxt}>{error}</Text>
        </View>
      )}

      {!loading && !error && feeds.length > 0 && (
        <View style={s.charts}>
          {SENSORS.map((sensor) => {
            const values = parseFeeds(feeds, sensor.key);
            if (values.length < 2) return null;

            const displayLabels = formatLabels(
              feeds.filter((f) => !isNaN(parseFloat(f[sensor.key]))),
              period,
            );
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const inRange = avg >= sensor.optMin && avg <= sensor.optMax;

            return (
              <View key={sensor.key} style={s.chartCard}>
                {/* Card header */}
                <View style={s.chartHeader}>
                  <View style={[s.chartDot, { backgroundColor: sensor.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.chartTitle}>{sensor.label}</Text>
                    <Text style={s.chartOptimal}>
                      Optimal: {sensor.optMin}–{sensor.optMax}
                      {sensor.unit}
                    </Text>
                  </View>
                  <View
                    style={[s.rangeBadge, { backgroundColor: inRange ? '#E8F5E9' : '#FFF8E1' }]}
                  >
                    <Text style={[s.rangeBadgeTxt, { color: inRange ? '#2E7D32' : '#F57F17' }]}>
                      {inRange ? '✅ Good' : '⚠️ Check'}
                    </Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={s.statsRow}>
                  {[
                    { lbl: 'Avg', val: avg.toFixed(1) },
                    { lbl: 'Min', val: min.toFixed(1) },
                    { lbl: 'Max', val: max.toFixed(1) },
                    { lbl: 'Readings', val: values.length },
                  ].map((st) => (
                    <View key={st.lbl} style={s.statChip}>
                      <Text style={[s.statChipVal, { color: sensor.color }]}>
                        {st.val}
                        {st.lbl !== 'Readings' ? sensor.unit : ''}
                      </Text>
                      <Text style={s.statChipLbl}>{st.lbl}</Text>
                    </View>
                  ))}
                </View>

                {/* Chart */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels: displayLabels.slice(0, values.length),
                      datasets: [{ data: values }],
                    }}
                    width={Math.max(CHART_W, values.length * 28)}
                    height={180}
                    chartConfig={chartConfig(sensor.color)}
                    bezier
                    style={s.chart}
                    withInnerLines
                    withOuterLines={false}
                    withVerticalLines={false}
                    fromZero={false}
                  />
                </ScrollView>
              </View>
            );
          })}
        </View>
      )}

      {!loading && !error && feeds.length === 0 && (
        <View style={s.emptyBox}>
          <Ionicons name="cellular-outline" size={40} color={C.hint} style={{ marginBottom: 12 }} />
          <Text style={s.emptyTxt}>No sensor data found.</Text>
          <Text style={s.emptySub}>Check your ThingSpeak channel ID and API key in server.js</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 22, alignItems: 'flex-start' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  heroBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.6,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  heroUpdated: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  heroUpdatedTxt: { fontSize: 11, color: 'rgba(165,214,167,0.8)' },

  periodRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  periodBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  periodTxt: { fontSize: 13, fontWeight: '700', color: C.text3 },
  periodTxtActive: { color: '#fff' },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.xlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  loadingBox: { alignItems: 'center', padding: 40 },
  loadingTxt: { marginTop: 12, fontSize: 14, color: C.text3 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorTxt: { flex: 1, fontSize: 13, color: C.error, lineHeight: 19 },
  emptyBox: { alignItems: 'center', padding: 40 },
  emptyTxt: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 20 },

  charts: { paddingHorizontal: 16 },
  chartCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: C.border,
  },

  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  chartDot: { width: 12, height: 12, borderRadius: 6 },
  chartTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  chartOptimal: { fontSize: 11, color: C.text3, marginTop: 1 },
  rangeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  rangeBadgeTxt: { fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statChip: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statChipVal: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  statChipLbl: { fontSize: 10, color: C.text3, fontWeight: '600' },

  chart: { borderRadius: 12, marginLeft: -10 },
});
