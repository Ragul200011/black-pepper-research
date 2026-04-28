// src/screens/DashboardScreen.js  — Light Theme, Platform Safe
// MapView is guarded with Platform.OS check to prevent web crash
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { WEATHER_URL } from '../config/api';
import { C, SHADOW } from '../components/theme';
import BottomNav from '../components/BottomNav';

// Only import MapView on native (avoids web crash)
let MapView, Marker, Callout, Circle;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  Circle = maps.Circle;
}

const FARMS = [
  {
    id: 1,
    title: 'SLIIT Research Plot',
    lat: 6.9147,
    lon: 79.9729,
    status: 'healthy',
    n: 82,
    p: 38,
    k: 115,
    ph: 6.2,
    area: '0.8 ha',
  },
  {
    id: 2,
    title: 'Engineering Faculty Field',
    lat: 6.9021,
    lon: 79.961,
    status: 'needs_attention',
    n: 18,
    p: 8,
    k: 28,
    ph: 4.8,
    area: '0.5 ha',
  },
  {
    id: 3,
    title: 'Campus Garden',
    lat: 6.92,
    lon: 79.98,
    status: 'healthy',
    n: 65,
    p: 22,
    k: 95,
    ph: 6.5,
    area: '1.2 ha',
  },
  {
    id: 4,
    title: 'South Research Farm',
    lat: 6.895,
    lon: 79.95,
    status: 'needs_attention',
    n: 35,
    p: 12,
    k: 55,
    ph: 5.1,
    area: '2.0 ha',
  },
];

// haversine distance removed (unused) — reintroduce if needed

function FarmRow({ farm, onPress, onFertilizer }) {
  const healthy = farm.status === 'healthy';
  return (
    <TouchableOpacity style={[s.farmRow, SHADOW.xs]} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.farmDot, { backgroundColor: healthy ? C.success : C.warning }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.farmTitle}>{farm.title}</Text>
        <Text style={s.farmSub}>
          N:{farm.n} P:{farm.p} K:{farm.k} pH:{farm.ph} · {farm.area}
        </Text>
        <View
          style={[
            s.farmStatus,
            {
              backgroundColor: healthy ? '#E8F5E9' : '#FFF8E1',
              borderColor: healthy ? C.light : '#FFE082',
            },
          ]}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: healthy ? C.success : C.warning }}>
            {healthy ? '✅ Healthy' : '⚠️ Needs Attention'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={s.fertBtn} onPress={onFertilizer} activeOpacity={0.8}>
        <Ionicons name="nutrition-outline" size={18} color={C.warning} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoad, setWeatherLoad] = useState(true);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState('loading');
  const mapRef = useRef(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      const res = await axios.get(`${WEATHER_URL}?lat=${lat}&lon=${lon}`, { timeout: 10000 });
      if (mounted.current) setWeather(res.data);
    } catch {}
    if (mounted.current) setWeatherLoad(false);
  }, []);

  useEffect(() => {
    (async () => {
      let lat = 6.9147,
        lon = 79.9729;
      try {
        let Location;
        try {
          Location = require('expo-location');
        } catch {
          throw new Error('Run: npx expo install expo-location');
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        if (!mounted.current) return;
        setUserLoc({ latitude: lat, longitude: lon });
        setLocStatus('ok');
        setTimeout(
          () =>
            mapRef.current?.animateToRegion(
              { latitude: lat, longitude: lon, latitudeDelta: 0.06, longitudeDelta: 0.06 },
              700,
            ),
          600,
        );
      } catch (e) {
        if (!mounted.current) return;
        setLocStatus('error');
        setUserLoc({ latitude: lat, longitude: lon });
      }
      fetchWeather(lat, lon);
    })();
    // fetchWeather is stable (useCallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusMap = (lat, lon) =>
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lon, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      600,
    );

  const healthy = FARMS.filter((f) => f.status === 'healthy').length;

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* STATS STRIP */}
        <LinearGradient colors={[C.gradStart, C.gradMid]} style={s.strip}>
          {[
            { n: FARMS.length, lbl: 'Farms', color: C.white },
            { n: healthy, lbl: 'Healthy', color: '#A5D6A7' },
            { n: FARMS.length - healthy, lbl: 'Attention', color: '#FFCC80' },
          ].map((it, i) => (
            <React.Fragment key={it.lbl}>
              {i > 0 && <View style={s.stripDiv} />}
              <View style={s.stripItem}>
                <Text style={[s.stripNum, { color: it.color }]}>{it.n}</Text>
                <Text style={s.stripLbl}>{it.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
          <View style={s.stripDiv} />
          <TouchableOpacity style={s.wChip} onPress={() => navigation.navigate('Weather')}>
            {weatherLoad ? (
              <ActivityIndicator size="small" color="#A5D6A7" />
            ) : weather ? (
              <>
                <Text style={s.wTemp}>{Math.round(weather.temperature)}°C</Text>
                <Text style={s.wHum}>{weather.humidity}% 🌤️</Text>
              </>
            ) : (
              <Text style={s.wHum}>Weather →</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* GPS BANNER */}
        {locStatus === 'loading' && (
          <View style={[s.locBanner, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' }]}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={[s.locTxt, { color: C.success, marginLeft: 8 }]}>
              {' '}
              Getting live GPS location…
            </Text>
          </View>
        )}
        {locStatus === 'ok' && (
          <View style={[s.locBanner, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
            <Ionicons name="location" size={14} color={C.success} />
            <Text style={[s.locTxt, { color: C.success }]}> Live GPS active</Text>
          </View>
        )}
        {locStatus === 'error' && (
          <View style={[s.locBanner, { backgroundColor: '#FFF8E1', borderColor: '#FFE082' }]}>
            <Ionicons name="warning-outline" size={14} color={C.warning} />
            <Text style={[s.locTxt, { color: C.warning }]}>
              {' '}
              Location unavailable — using default coordinates
            </Text>
          </View>
        )}

        {/* WEATHER CARD */}
        {weather && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Weather')}
            activeOpacity={0.9}
            style={s.wCard}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.wCity}>{weather.city}</Text>
              <Text style={s.wCond}>{weather.weather}</Text>
              <View style={s.wRow}>
                <Text style={s.wDetail}>💧 {weather.humidity}%</Text>
                <Text style={s.wDetail}>💨 {weather.wind} m/s</Text>
                <Text style={s.wDetail}>🤗 {Math.round(weather.feels_like)}°C</Text>
              </View>
            </View>
            <View style={s.wRight}>
              <Text style={s.wBigTemp}>{Math.round(weather.temperature)}°</Text>
              <View style={s.wMoreBtn}>
                <Text style={s.wMoreTxt}>Details</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* MAP (native only) */}
        <View style={s.mapSection}>
          <Text style={s.secTitle}>🗺️ Farm Map</Text>
          <Text style={s.secSub}>Tap a pin for soil details and fertilizer recommendations</Text>

          {Platform.OS === 'web' ? (
            <View style={s.webMapPlaceholder}>
              <Ionicons name="map-outline" size={40} color={C.hint} />
              <Text style={s.webMapTxt}>Map view available on iOS & Android</Text>
              <Text style={s.webMapSub}>All farm details are listed below</Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={s.map}
              mapType="satellite"
              initialRegion={{
                latitude: 6.91,
                longitude: 79.965,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
              }}
              showsUserLocation={locStatus === 'ok'}
              showsMyLocationButton={locStatus === 'ok'}
            >
              {FARMS.map((farm) => (
                <Marker
                  key={`f${farm.id}`}
                  coordinate={{ latitude: farm.lat, longitude: farm.lon }}
                  pinColor={farm.status === 'healthy' ? '#4CAF50' : '#FF9800'}
                  onPress={() => setSelectedFarm(farm)}
                >
                  <Callout>
                    <View style={s.callout}>
                      <Text style={s.calloutName}>{farm.title}</Text>
                      <Text
                        style={{
                          color: farm.status === 'healthy' ? C.success : C.warning,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {farm.status === 'healthy' ? '✅ Healthy' : '⚠️ Needs Attention'}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}

          {/* Map legend */}
          <View style={s.legend}>
            {[
              { color: '#4CAF50', label: 'Healthy Fields' },
              { color: '#FF9800', label: 'Needs Attention' },
              { color: '#2196F3', label: 'Your Location' },
            ].map((l) => (
              <View key={l.label} style={s.legItem}>
                <View style={[s.legDot, { backgroundColor: l.color }]} />
                <Text style={s.legTxt}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SELECTED FARM DETAIL */}
        {selectedFarm && (
          <View style={s.farmDetail}>
            <View style={s.farmDHdr}>
              <View style={{ flex: 1 }}>
                <Text style={s.farmDTitle}>{selectedFarm.title}</Text>
                <Text
                  style={{
                    color: selectedFarm.status === 'healthy' ? C.success : C.warning,
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  {selectedFarm.status === 'healthy' ? '✅ Healthy' : '⚠️ Needs Attention'} ·{' '}
                  {selectedFarm.area}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFarm(null)} style={s.closeBtn}>
                <Ionicons name="close" size={18} color={C.text3} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Nitrogen', val: selectedFarm.n, max: 150, color: C.success, unit: 'mg/kg' },
              { label: 'Phosphorus', val: selectedFarm.p, max: 60, color: C.rose, unit: 'mg/kg' },
              { label: 'Potassium', val: selectedFarm.k, max: 200, color: C.brown, unit: 'mg/kg' },
              { label: 'pH', val: selectedFarm.ph, max: 9, color: C.purple, unit: '' },
            ].map((n) => (
              <View key={n.label} style={s.nutriRow}>
                <Text style={s.nutriLbl}>{n.label}</Text>
                <View style={s.nutriBarBg}>
                  <View
                    style={[
                      s.nutriBarFill,
                      {
                        width: `${Math.min(100, (n.val / n.max) * 100)}%`,
                        backgroundColor: n.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[s.nutriVal, { color: n.color }]}>
                  {n.val}
                  {n.unit}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={s.fertCTA}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Fertilizer', {
                  nitrogen: selectedFarm.n,
                  phosphorus: selectedFarm.p,
                  potassium: selectedFarm.k,
                  ph: selectedFarm.ph,
                  farmName: selectedFarm.title,
                })
              }
            >
              <Ionicons name="nutrition-outline" size={16} color={C.white} />
              <Text style={s.fertCTATxt}>Get Fertilizer Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ALL FARMS LIST */}
        <View style={s.listSection}>
          <Text style={s.secTitle}>📋 All Farms</Text>
          {FARMS.map((farm) => (
            <FarmRow
              key={farm.id}
              farm={farm}
              onPress={() => {
                setSelectedFarm(farm);
                if (Platform.OS !== 'web') focusMap(farm.lat, farm.lon);
              }}
              onFertilizer={() =>
                navigation.navigate('Fertilizer', {
                  nitrogen: farm.n,
                  phosphorus: farm.p,
                  potassium: farm.k,
                  ph: farm.ph,
                  farmName: farm.title,
                })
              }
            />
          ))}
        </View>

        {/* QUICK NAV */}
        <View style={s.quickNav}>
          {[
            { emoji: '🌱', label: 'Soil', screen: 'SoilAnalysis' },
            { emoji: '🔬', label: 'Disease', screen: 'DiseaseIdentification' },
            { emoji: '🫑', label: 'Variety', screen: 'VarietyHub' },
            { emoji: '🌤️', label: 'Weather', screen: 'Weather' },
            { emoji: '🌿', label: 'Fertilize', screen: 'Fertilizer' },
          ].map((it) => (
            <TouchableOpacity
              key={it.screen}
              style={s.qBtn}
              onPress={() => navigation.navigate(it.screen)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22 }}>{it.emoji}</Text>
              <Text style={s.qLbl}>{it.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
      <BottomNav navigation={navigation} active="Dashboard" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 16 },

  strip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  stripItem: { flex: 1, alignItems: 'center' },
  stripNum: { fontSize: 22, fontWeight: '900', color: C.white },
  stripLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  stripDiv: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.25)' },
  wChip: { flex: 1, alignItems: 'center' },
  wTemp: { fontSize: 18, fontWeight: '900', color: C.white },
  wHum: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  locBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  locTxt: { fontSize: 12, fontWeight: '600' },

  wCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.sm,
  },
  wCity: { fontSize: 17, fontWeight: '900', color: C.text, marginBottom: 2 },
  wCond: { fontSize: 12, color: C.text3, textTransform: 'capitalize', marginBottom: 8 },
  wRow: { flexDirection: 'row', gap: 10 },
  wDetail: { fontSize: 11, color: C.text3 },
  wRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  wBigTemp: { fontSize: 48, fontWeight: '900', color: C.primary, lineHeight: 52 },
  wMoreBtn: {
    backgroundColor: C.xlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  wMoreTxt: { fontSize: 11, color: C.primary, fontWeight: '700' },

  mapSection: { padding: 16 },
  secTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4 },
  secSub: { fontSize: 11, color: C.text3, marginBottom: 12 },
  map: { width: '100%', height: 300, borderRadius: 18, overflow: 'hidden' },

  webMapPlaceholder: {
    height: 200,
    borderRadius: 18,
    backgroundColor: C.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
  },
  webMapTxt: { fontSize: 15, fontWeight: '700', color: C.text3 },
  webMapSub: { fontSize: 12, color: C.hint },

  callout: { padding: 6, minWidth: 140 },
  calloutName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legDot: { width: 10, height: 10, borderRadius: 5 },
  legTxt: { fontSize: 11, color: C.text3 },

  farmDetail: {
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    ...SHADOW.sm,
  },
  farmDHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  farmDTitle: { fontSize: 15, fontWeight: '800', color: C.text, maxWidth: 220 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutriRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  nutriLbl: { width: 80, fontSize: 12, fontWeight: '600', color: C.text3 },
  nutriBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: C.surface2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nutriBarFill: { height: 8, borderRadius: 4 },
  nutriVal: { width: 55, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  fertCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 10,
    ...SHADOW.sm,
  },
  fertCTATxt: { color: C.white, fontSize: 14, fontWeight: '700' },

  listSection: { paddingHorizontal: 16, paddingBottom: 8 },
  farmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  farmDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  farmTitle: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 2 },
  farmSub: { fontSize: 11, color: C.text3, marginBottom: 6 },
  farmStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  fertBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },

  quickNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: C.white,
    marginHorizontal: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.sm,
  },
  qBtn: { alignItems: 'center', gap: 4 },
  qLbl: { fontSize: 10, color: C.text3, fontWeight: '700' },
});
