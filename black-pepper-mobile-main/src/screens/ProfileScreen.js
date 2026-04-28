// src/screens/ProfileScreen.js
// ─────────────────────────────────────────────────────────────────────────────
//  Black Pepper AI — Profile Screen
//  • Shows user name, email, role
//  • Live scan stats loaded from AsyncStorage
//  • Farm count, total disease scans, variety scans
//  • Edit profile name
//  • Sign Out button
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { selectCurrentUser, signOut, updateProfile } from '../redux/slices/userSlice';
import { C, SHADOW } from '../components/theme';

const FARMS_COUNT = 4; // update when you have dynamic farms

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [stats, setStats] = useState({ disease: 0, variety: 0, soilScans: 0 });
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  // Load scan stats from AsyncStorage
  const loadStats = async () => {
    try {
      const [dRaw, vRaw] = await Promise.all([
        AsyncStorage.getItem('disease_history'),
        AsyncStorage.getItem('scanHistory'),
      ]);
      const disease = dRaw ? JSON.parse(dRaw).length : 0;
      const variety = vRaw ? JSON.parse(vRaw).length : 0;
      setStats({ disease, variety, soilScans: disease + variety });
    } catch (e) {
      console.warn('Stats load error:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const handleSaveName = async () => {
    const name = nameInput.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      dispatch(updateProfile({ name }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    const doSignOut = () => {
      dispatch(signOut());
      navigation.replace('Landing');
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Sign out of your account?')) doSignOut();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
    ]);
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statCards = [
    {
      icon: 'bug-outline',
      color: '#C62828',
      bg: '#FFEBEE',
      label: 'Disease Scans',
      val: stats.disease,
    },
    {
      icon: 'leaf-outline',
      color: '#2E7D32',
      bg: '#E8F5E9',
      label: 'Variety Scans',
      val: stats.variety,
    },
    {
      icon: 'home-outline',
      color: '#1565C0',
      bg: '#E3F2FD',
      label: 'Registered Farms',
      val: FARMS_COUNT,
    },
    {
      icon: 'analytics-outline',
      color: '#6A1B9A',
      bg: '#F3E5F5',
      label: 'Total Analyses',
      val: stats.disease + stats.variety,
    },
  ];

  const menuItems = [
    { icon: 'leaf-outline', label: 'Soil Analysis', screen: 'SoilAnalysis' },
    { icon: 'bug-outline', label: 'Disease Detection', screen: 'DiseaseIdentification' },
    { icon: 'scan-outline', label: 'Variety Identification', screen: 'VarietyHub' },
    { icon: 'map-outline', label: 'Farm Dashboard', screen: 'Dashboard' },
    { icon: 'partly-sunny-outline', label: 'Weather Station', screen: 'Weather' },
    { icon: 'flask-outline', label: 'Fertilizer Advisor', screen: 'Fertilizer' },
  ];

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0A1F05', '#1B5E20', '#2E7D32']} style={s.hero}>
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </View>
          <TouchableOpacity style={s.editAvatarBtn} onPress={() => setEditing(true)}>
            <Ionicons name="pencil" size={13} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Name (editable) */}
        {editing ? (
          <View style={s.nameEditRow}>
            <TextInput
              style={s.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity style={s.nameSaveBtn} onPress={handleSaveName} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.nameCancelBtn}
              onPress={() => {
                setEditing(false);
                setNameInput(user?.name ?? '');
              }}
            >
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.8}>
            <Text style={s.heroName}>{user?.name ?? 'Farmer'}</Text>
          </TouchableOpacity>
        )}

        <Text style={s.heroEmail}>{user?.email ?? 'Not signed in'}</Text>
        <View style={s.roleTag}>
          <Ionicons
            name="shield-checkmark-outline"
            size={11}
            color="#A5D6A7"
            style={{ marginRight: 4 }}
          />
          <Text style={s.roleTagTxt}>Agricultural Researcher · SLIIT</Text>
        </View>
      </LinearGradient>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <View style={s.statsGrid}>
        {statCards.map((sc) => (
          <View key={sc.label} style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: sc.bg }]}>
              <Ionicons name={sc.icon} size={20} color={sc.color} />
            </View>
            <Text style={s.statVal}>{sc.val}</Text>
            <Text style={s.statLbl}>{sc.label}</Text>
          </View>
        ))}
      </View>

      {/* ── QUICK LINKS ──────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Access</Text>
        <View style={s.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.screen}
              style={[s.menuRow, i < menuItems.length - 1 && s.menuRowBorder]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <View style={s.menuIconBox}>
                <Ionicons name={item.icon} size={18} color={C.primary} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={C.hint} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── APP INFO ─────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.infoCard}>
          {[
            { label: 'App Version', val: '2.0.0' },
            { label: 'Research Group', val: 'SLIIT AI Lab' },
            { label: 'ML Models', val: 'EfficientNetB0 · Ensemble' },
            { label: 'IoT Platform', val: 'ThingSpeak · Channel 3187265' },
          ].map((r, i) => (
            <View key={r.label} style={[s.infoRow, i < 3 && s.infoRowBorder]}>
              <Text style={s.infoLabel}>{r.label}</Text>
              <Text style={s.infoVal}>{r.val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── SIGN OUT ─────────────────────────────────────────────────── */}
      <View style={s.section}>
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={C.error} style={{ marginRight: 10 }} />
          <Text style={s.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTxt: { fontSize: 30, fontWeight: '900', color: '#fff' },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
  nameSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleTagTxt: { fontSize: 11, color: '#A5D6A7', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statVal: { fontSize: 26, fontWeight: '900', color: C.text, marginBottom: 3 },
  statLbl: { fontSize: 11, color: C.text3, textAlign: 'center', fontWeight: '600' },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text3,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.xlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },

  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  infoLabel: { fontSize: 13, color: C.text3, fontWeight: '600' },
  infoVal: { fontSize: 13, color: C.text, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  signOutTxt: { fontSize: 15, fontWeight: '800', color: C.error },
});
