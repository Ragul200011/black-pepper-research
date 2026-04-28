// src/screens/AnalyticsScreen.js
// ─────────────────────────────────────────────────────────────────────────────
//  Black Pepper AI — Analytics & Model Performance Screen
//  • Scan summary stats (total, today, this week)
//  • Disease breakdown pie-style bars
//  • Variety breakdown bars
//  • Average confidence per category
//  • Most active scanning days
//  • Farm comparison table
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, SHADOW } from '../components/theme';

const DISEASE_COLORS = { healthy: '#2E7D32', leaf_blight: '#C62828', slow_wilt: '#E65100' };
const VARIETY_COLORS = { Butawerala: '#2E7D32', Dingirala: '#1565C0', Kohukuburerala: '#6A1B9A' };
// FARMS constant removed (unused) — sample farm lists are in the UI where needed

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  return diff < 7;
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function BarRow({ label, value, max, color, unit = '' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={ba.row}>
      <Text style={ba.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={ba.track}>
        <View style={[ba.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[ba.val, { color }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
}
const ba = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  label: { width: 110, fontSize: 12, color: '#555', fontWeight: '600' },
  track: { flex: 1, height: 10, backgroundColor: '#EDF3E8', borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  val: { width: 42, fontSize: 13, fontWeight: '800', textAlign: 'right' },
});

export default function AnalyticsScreen({ navigation }) {
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [varietyHistory, setVarietyHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [dRaw, vRaw] = await Promise.all([
            AsyncStorage.getItem('disease_history'),
            AsyncStorage.getItem('scanHistory'),
          ]);
          setDiseaseHistory(dRaw ? JSON.parse(dRaw) : []);
          setVarietyHistory(vRaw ? JSON.parse(vRaw) : []);
        } catch {}
      })();
    }, []),
  );

  // ── Computed stats ───────────────────────────────────────────────
  const totalScans = diseaseHistory.length + varietyHistory.length;
  const todayScans = [...diseaseHistory, ...varietyHistory].filter((s) =>
    isToday(s.timestamp),
  ).length;
  const weekScans = [...diseaseHistory, ...varietyHistory].filter((s) =>
    isThisWeek(s.timestamp),
  ).length;

  // Disease breakdown
  const diseaseBreakdown = {};
  let diseaseTotalConf = 0,
    diseaseConfCount = 0;
  diseaseHistory.forEach((s) => {
    const key = (s.disease ?? s.result ?? 'unknown').toLowerCase().replace(' ', '_');
    diseaseBreakdown[key] = (diseaseBreakdown[key] ?? 0) + 1;
    if (s.confidence) {
      diseaseTotalConf += parseFloat(s.confidence);
      diseaseConfCount++;
    }
  });
  const avgDiseaseConf =
    diseaseConfCount > 0 ? (diseaseTotalConf / diseaseConfCount).toFixed(1) : '—';

  // Variety breakdown
  const varietyBreakdown = {};
  let varTotalConf = 0,
    varConfCount = 0;
  varietyHistory.forEach((s) => {
    const key = s.result ?? 'Unknown';
    varietyBreakdown[key] = (varietyBreakdown[key] ?? 0) + 1;
    if (s.confidence) {
      varTotalConf += parseFloat(s.confidence);
      varConfCount++;
    }
  });
  const avgVarConf = varConfCount > 0 ? (varTotalConf / varConfCount).toFixed(1) : '—';

  const maxDisease = Math.max(1, ...Object.values(diseaseBreakdown));
  const maxVariety = Math.max(1, ...Object.values(varietyBreakdown));

  // Confidence distribution
  const allConfs = [...diseaseHistory, ...varietyHistory]
    .map((s) => parseFloat(s.confidence))
    .filter((v) => !isNaN(v));
  const high = allConfs.filter((v) => v >= 75).length;
  const medium = allConfs.filter((v) => v >= 55 && v < 75).length;
  const low = allConfs.filter((v) => v < 55).length;
  const total = allConfs.length || 1;

  const summaryCards = [
    {
      icon: 'camera-outline',
      color: '#1565C0',
      bg: '#E3F2FD',
      label: 'Total Scans',
      val: totalScans,
    },
    { icon: 'today-outline', color: '#2E7D32', bg: '#E8F5E9', label: 'Today', val: todayScans },
    {
      icon: 'calendar-outline',
      color: '#6A1B9A',
      bg: '#F3E5F5',
      label: 'This Week',
      val: weekScans,
    },
    {
      icon: 'bug-outline',
      color: '#C62828',
      bg: '#FFEBEE',
      label: 'Disease Scans',
      val: diseaseHistory.length,
    },
    {
      icon: 'leaf-outline',
      color: '#2E7D32',
      bg: '#E8F5E9',
      label: 'Variety Scans',
      val: varietyHistory.length,
    },
    {
      icon: 'stats-chart-outline',
      color: '#E65100',
      bg: '#FFF3E0',
      label: 'Avg Confidence',
      val: `${avgDiseaseConf}%`,
    },
  ];

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <LinearGradient colors={['#0A1F05', '#1B5E20', '#2E7D32']} style={s.hero}>
        <View style={s.heroBadge}>
          <Ionicons name="stats-chart-outline" size={13} color="#A5D6A7" />
          <Text style={s.heroBadgeTxt}> MODEL ANALYTICS</Text>
        </View>
        <Text style={s.heroTitle}>Performance Dashboard</Text>
        <Text style={s.heroSub}>Scan statistics, model confidence, and disease trends</Text>
      </LinearGradient>

      {/* SUMMARY GRID */}
      <View style={s.grid}>
        {summaryCards.map((c) => (
          <View key={c.label} style={s.summaryCard}>
            <View style={[s.summaryIcon, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon} size={20} color={c.color} />
            </View>
            <Text style={[s.summaryVal, { color: c.color }]}>{c.val}</Text>
            <Text style={s.summaryLbl}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* CONFIDENCE DISTRIBUTION */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Confidence Distribution</Text>
        <Text style={s.cardSub}>
          How certain the AI is across all {allConfs.length} predictions
        </Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          {[
            {
              label: 'High (≥75%)',
              val: high,
              color: '#2E7D32',
              pct: Math.round((high / total) * 100),
            },
            {
              label: 'Medium (55–74%)',
              val: medium,
              color: '#F57F17',
              pct: Math.round((medium / total) * 100),
            },
            {
              label: 'Low (<55%)',
              val: low,
              color: '#C62828',
              pct: Math.round((low / total) * 100),
            },
          ].map((row) => (
            <View key={row.label} style={s.confRow}>
              <Text style={s.confLbl}>{row.label}</Text>
              <View style={s.confTrack}>
                <View style={[s.confFill, { width: `${row.pct}%`, backgroundColor: row.color }]} />
              </View>
              <Text style={[s.confPct, { color: row.color }]}>{row.pct}%</Text>
              <Text style={s.confCount}>({row.val})</Text>
            </View>
          ))}
        </View>
        {allConfs.length === 0 && (
          <Text style={s.noData}>No predictions yet. Run some scans first.</Text>
        )}
      </View>

      {/* DISEASE BREAKDOWN */}
      <View style={s.card}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle}>Disease Detection Results</Text>
          <Text style={s.cardBadge}>
            {diseaseHistory.length} scans · avg {avgDiseaseConf}%
          </Text>
        </View>
        <Text style={s.cardSub}>Distribution of detected conditions</Text>
        <View style={{ marginTop: 14 }}>
          {Object.keys(diseaseBreakdown).length === 0 ? (
            <Text style={s.noData}>No disease scans yet.</Text>
          ) : (
            Object.entries(diseaseBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <BarRow
                  key={key}
                  label={key.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                  value={count}
                  max={maxDisease}
                  color={DISEASE_COLORS[key] ?? '#888'}
                  unit=" scans"
                />
              ))
          )}
        </View>
      </View>

      {/* VARIETY BREAKDOWN */}
      <View style={s.card}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle}>Variety Identification Results</Text>
          <Text style={s.cardBadge}>
            {varietyHistory.length} scans · avg {avgVarConf}%
          </Text>
        </View>
        <Text style={s.cardSub}>Distribution of identified varieties</Text>
        <View style={{ marginTop: 14 }}>
          {Object.keys(varietyBreakdown).length === 0 ? (
            <Text style={s.noData}>No variety scans yet.</Text>
          ) : (
            Object.entries(varietyBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <BarRow
                  key={key}
                  label={key}
                  value={count}
                  max={maxVariety}
                  color={VARIETY_COLORS[key] ?? '#888'}
                  unit=" scans"
                />
              ))
          )}
        </View>
      </View>

      {/* FARM COMPARISON */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Farm Comparison</Text>
        <Text style={s.cardSub}>Registered farms with soil health overview</Text>
        <View style={s.tableHeader}>
          {['Farm', 'N', 'P', 'K', 'pH', 'Status'].map((h) => (
            <Text key={h} style={[s.tableH, h === 'Farm' && { flex: 2 }]}>
              {h}
            </Text>
          ))}
        </View>
        {[
          { name: 'SLIIT Plot', n: 82, p: 38, k: 115, ph: 6.2, ok: true },
          { name: 'Eng. Field', n: 18, p: 8, k: 28, ph: 4.8, ok: false },
          { name: 'Campus Garden', n: 65, p: 22, k: 95, ph: 6.5, ok: true },
          { name: 'South Farm', n: 35, p: 12, k: 55, ph: 5.1, ok: false },
        ].map((farm, i) => (
          <View key={farm.name} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
            <Text style={[s.tableCell, { flex: 2 }]} numberOfLines={1}>
              {farm.name}
            </Text>
            <Text style={s.tableCell}>{farm.n}</Text>
            <Text style={s.tableCell}>{farm.p}</Text>
            <Text style={s.tableCell}>{farm.k}</Text>
            <Text style={s.tableCell}>{farm.ph}</Text>
            <View style={[s.statusDot, { backgroundColor: farm.ok ? '#2E7D32' : '#FFA726' }]} />
          </View>
        ))}
      </View>

      {/* QUICK ACTIONS */}
      <View style={s.quickRow}>
        {[
          {
            label: 'Disease Scan',
            icon: 'bug-outline',
            screen: 'DiseaseIdentification',
            color: '#C62828',
          },
          { label: 'Variety Scan', icon: 'leaf-outline', screen: 'VarietyHub', color: '#2E7D32' },
          {
            label: 'Sensor Trends',
            icon: 'trending-up-outline',
            screen: 'SensorTrend',
            color: '#1565C0',
          },
        ].map((q) => (
          <TouchableOpacity
            key={q.screen}
            style={s.quickBtn}
            onPress={() => navigation.navigate(q.screen)}
            activeOpacity={0.8}
          >
            <View style={[s.quickIcon, { backgroundColor: q.color + '18' }]}>
              <Ionicons name={q.icon} size={20} color={q.color} />
            </View>
            <Text style={s.quickLbl}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 22 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  heroBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.6,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  summaryCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryVal: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  summaryLbl: { fontSize: 10, color: C.text3, fontWeight: '600', textAlign: 'center' },

  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 2 },
  cardBadge: { fontSize: 11, color: C.text3, fontWeight: '600' },
  cardSub: { fontSize: 12, color: C.text3 },
  noData: { fontSize: 13, color: C.hint, textAlign: 'center', paddingVertical: 16 },

  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  confLbl: { width: 100, fontSize: 11, color: '#555', fontWeight: '600' },
  confTrack: {
    flex: 1,
    height: 10,
    backgroundColor: C.surface2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  confFill: { height: 10, borderRadius: 5 },
  confPct: { width: 36, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  confCount: { width: 32, fontSize: 11, color: C.hint },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginTop: 12,
  },
  tableH: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: C.text3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  tableRowAlt: { backgroundColor: C.surface2, borderRadius: 8 },
  tableCell: { flex: 1, fontSize: 12, color: C.text, fontWeight: '600', textAlign: 'center' },
  statusDot: { flex: 1, width: 10, height: 10, borderRadius: 5, alignSelf: 'center' },

  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLbl: { fontSize: 11, color: C.text, fontWeight: '700', textAlign: 'center' },
});
