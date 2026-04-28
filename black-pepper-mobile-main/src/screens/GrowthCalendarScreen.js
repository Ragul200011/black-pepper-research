// src/screens/GrowthCalendarScreen.js
// ─────────────────────────────────────────────────────────────────────────────
//  Black Pepper AI — Growth Calendar / Farm Activity Tracker
//  • Log planting, fertilizing, spraying, harvesting events
//  • Calendar view with colour-coded event dots
//  • Timeline history list below calendar
//  • Add/delete events, persisted in AsyncStorage
//  Install: npx expo install react-native-calendars
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
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, SHADOW } from '../components/theme';

// Try to use react-native-calendars if installed, else show simple date picker
let Calendar;
try {
  Calendar = require('react-native-calendars').Calendar;
} catch {
  Calendar = null;
}

const STORAGE_KEY = 'farm_calendar_events';

const EVENT_TYPES = [
  { id: 'plant', label: 'Planting', icon: 'leaf', color: '#2E7D32', bg: '#E8F5E9' },
  { id: 'fertilize', label: 'Fertilizing', icon: 'flask', color: '#1565C0', bg: '#E3F2FD' },
  { id: 'spray', label: 'Spraying', icon: 'water', color: '#00838F', bg: '#E0F7FA' },
  { id: 'harvest', label: 'Harvesting', icon: 'basket', color: '#E65100', bg: '#FFF3E0' },
  { id: 'inspect', label: 'Inspection', icon: 'search', color: '#6A1B9A', bg: '#F3E5F5' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#757575', bg: '#F5F5F5' },
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export default function GrowthCalendarScreen({ navigation }) {
  const [events, setEvents] = useState({}); // { 'YYYY-MM-DD': [event, ...] }
  const [selected, setSelected] = useState(getTodayStr());
  const [showModal, setShowModal] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [noteText, setNoteText] = useState('');
  const [farmName, setFarmName] = useState('');

  const loadEvents = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, []),
  );

  const saveEvents = async (updated) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Save error:', e);
    }
  };

  const addEvent = async () => {
    const newEvent = {
      id: Date.now().toString(),
      type: eventType.id,
      label: eventType.label,
      color: eventType.color,
      note: noteText.trim(),
      farm: farmName.trim(),
      date: selected,
      createdAt: new Date().toISOString(),
    };
    const updated = { ...events };
    if (!updated[selected]) updated[selected] = [];
    updated[selected].unshift(newEvent);
    setEvents(updated);
    await saveEvents(updated);
    setShowModal(false);
    setNoteText('');
    setFarmName('');
    setEventType(EVENT_TYPES[0]);
  };

  const deleteEvent = (dateStr, eventId) => {
    const doDelete = async () => {
      const updated = { ...events };
      updated[dateStr] = (updated[dateStr] ?? []).filter((e) => e.id !== eventId);
      if (updated[dateStr].length === 0) delete updated[dateStr];
      setEvents(updated);
      await saveEvents(updated);
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Delete this event?')) doDelete();
      return;
    }
    Alert.alert('Delete Event', 'Remove this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  // Build calendar marked dates
  const markedDates = {};
  Object.entries(events).forEach(([date, evList]) => {
    markedDates[date] = {
      dots: evList.slice(0, 3).map((e) => ({ key: e.id, color: e.color })),
      marked: true,
    };
  });
  markedDates[selected] = {
    ...(markedDates[selected] ?? {}),
    selected: true,
    selectedColor: C.primary,
  };

  const todayEvents = events[selected] ?? [];

  // All events sorted newest first for timeline
  const allEvents = Object.entries(events)
    .flatMap(([date, evList]) => evList.map((e) => ({ ...e, date })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <LinearGradient colors={['#0A1F05', '#1B5E20', '#2E7D32']} style={s.hero}>
          <View style={s.heroBadge}>
            <Ionicons name="calendar-outline" size={13} color="#A5D6A7" />
            <Text style={s.heroBadgeTxt}> FARM ACTIVITY TRACKER</Text>
          </View>
          <Text style={s.heroTitle}>Growth Calendar</Text>
          <Text style={s.heroSub}>Log planting, fertilizing, spraying, and harvest events.</Text>

          {/* Stats */}
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{allEvents.length}</Text>
              <Text style={s.heroStatLbl}>Total Events</Text>
            </View>
            <View style={s.heroStatDiv} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{Object.keys(events).length}</Text>
              <Text style={s.heroStatLbl}>Active Days</Text>
            </View>
            <View style={s.heroStatDiv} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{todayEvents.length}</Text>
              <Text style={s.heroStatLbl}>Today</Text>
            </View>
          </View>
        </LinearGradient>

        {/* CALENDAR */}
        <View style={s.calCard}>
          {Calendar ? (
            <Calendar
              current={selected}
              onDayPress={(day) => setSelected(day.dateString)}
              markingType="multi-dot"
              markedDates={markedDates}
              theme={{
                backgroundColor: '#fff',
                calendarBackground: '#fff',
                selectedDayBackgroundColor: C.primary,
                selectedDayTextColor: '#fff',
                todayTextColor: C.primary,
                dayTextColor: C.text,
                textDisabledColor: C.hint,
                monthTextColor: C.text,
                arrowColor: C.primary,
                dotColor: C.primary,
                textMonthFontWeight: '800',
                textDayFontWeight: '600',
              }}
            />
          ) : (
            <View style={s.noCalMsg}>
              <Ionicons
                name="calendar-outline"
                size={32}
                color={C.hint}
                style={{ marginBottom: 8 }}
              />
              <Text style={s.noCalTxt}>Install react-native-calendars for calendar view</Text>
              <Text style={s.noCalSub}>npx expo install react-native-calendars</Text>
              <Text style={s.noCalDate}>Selected date: {selected}</Text>
            </View>
          )}
        </View>

        {/* ADD EVENT BUTTON */}
        <View style={s.addRow}>
          <Text style={s.addLabel}>Events on {selected}</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.addBtnTxt}>Add Event</Text>
          </TouchableOpacity>
        </View>

        {/* SELECTED DAY EVENTS */}
        {todayEvents.length === 0 ? (
          <View style={s.emptyDay}>
            <Text style={s.emptyDayTxt}>No events for this day. Tap "+ Add Event" to log one.</Text>
          </View>
        ) : (
          <View style={s.eventList}>
            {todayEvents.map((ev) => {
              const typeInfo = EVENT_TYPES.find((t) => t.id === ev.type) ?? EVENT_TYPES[5];
              return (
                <View key={ev.id} style={s.eventCard}>
                  <View style={[s.eventIcon, { backgroundColor: typeInfo.bg }]}>
                    <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventLabel}>{ev.label}</Text>
                    {ev.farm ? <Text style={s.eventFarm}>📍 {ev.farm}</Text> : null}
                    {ev.note ? <Text style={s.eventNote}>{ev.note}</Text> : null}
                    <Text style={s.eventTime}>
                      {new Date(ev.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteEvent(selected, ev.id)}
                    style={s.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={C.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* RECENT TIMELINE */}
        {allEvents.length > 0 && (
          <View style={s.timelineSection}>
            <Text style={s.timelineTitle}>Recent Activity</Text>
            {allEvents.slice(0, 10).map((ev, i) => {
              const typeInfo = EVENT_TYPES.find((t) => t.id === ev.type) ?? EVENT_TYPES[5];
              return (
                <View key={`${ev.id}-${i}`} style={s.timelineItem}>
                  <View style={[s.timelineDot, { backgroundColor: typeInfo.color }]} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineLabel}>
                      {ev.label} {ev.farm ? `· ${ev.farm}` : ''}
                    </Text>
                    <Text style={s.timelineDate}>{ev.date}</Text>
                    {ev.note ? <Text style={s.timelineNote}>{ev.note}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── ADD EVENT MODAL ───────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Add Event · {selected}</Text>

            {/* Event type selector */}
            <Text style={s.modalLabel}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
              {EVENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    s.typeChip,
                    {
                      backgroundColor: t.bg,
                      borderColor: eventType.id === t.id ? t.color : 'transparent',
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setEventType(t)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon} size={16} color={t.color} style={{ marginRight: 5 }} />
                  <Text style={[s.typeChipTxt, { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Farm name */}
            <Text style={s.modalLabel}>Farm Name (optional)</Text>
            <TextInput
              style={s.modalInput}
              value={farmName}
              onChangeText={setFarmName}
              placeholder="e.g. SLIIT Research Plot"
              placeholderTextColor={C.hint}
            />

            {/* Note */}
            <Text style={s.modalLabel}>Notes (optional)</Text>
            <TextInput
              style={[s.modalInput, s.modalTextArea]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="e.g. Applied 200g NPK compound fertilizer"
              placeholderTextColor={C.hint}
              multiline
              numberOfLines={3}
            />

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowModal(false)}
                activeOpacity={0.8}
              >
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={addEvent} activeOpacity={0.85}>
                <LinearGradient colors={['#1B5E20', '#2E7D32']} style={s.modalSaveGrad}>
                  <Text style={s.modalSaveTxt}>Save Event</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 12,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  calCard: {
    backgroundColor: C.surface,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 8,
  },
  noCalMsg: { alignItems: 'center', padding: 24 },
  noCalTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  noCalSub: { fontSize: 12, color: C.info, marginBottom: 10 },
  noCalDate: { fontSize: 13, color: C.text3 },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  addLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    ...SHADOW.sm,
  },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  emptyDay: {
    margin: 16,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyDayTxt: { fontSize: 13, color: C.text3, textAlign: 'center' },

  eventList: { paddingHorizontal: 16, gap: 10 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...SHADOW.xs,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  eventFarm: { fontSize: 12, color: C.text3, marginBottom: 2 },
  eventNote: { fontSize: 12, color: C.text2, lineHeight: 18, marginBottom: 3 },
  eventTime: { fontSize: 11, color: C.hint },
  deleteBtn: { padding: 6 },

  timelineSection: {
    margin: 16,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  timelineDate: { fontSize: 11, color: C.hint, marginBottom: 2 },
  timelineNote: { fontSize: 12, color: C.text3, lineHeight: 17 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 18 },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  typeScroll: { marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  typeChipTxt: { fontSize: 13, fontWeight: '700' },
  modalInput: {
    backgroundColor: C.surface2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  modalTextArea: { height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  modalCancelTxt: { fontSize: 15, fontWeight: '700', color: C.text3 },
  modalSaveBtn: { flex: 2, borderRadius: 14, overflow: 'hidden', ...SHADOW.md },
  modalSaveGrad: { paddingVertical: 15, alignItems: 'center' },
  modalSaveTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
