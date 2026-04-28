// src/screens/DiseaseUploadScreen.js — FIXED
// Fix: navigation.navigate('DiseaseResult') now passes the exact params
//      that DiseaseResultScreen destructures:
//      { image, disease, confidence, treatment, description, probabilities, lowConfidence }
// Fix: replaced deprecated ImagePicker.MediaTypeOptions with ['images']
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { C, SHADOW } from '../components/theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import { API_BASE } from '../config/api';

export default function DiseaseUploadScreen({ navigation }) {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestPermission = useCallback(async (type) => {
    const perm =
      type === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission Required',
        `${type === 'camera' ? 'Camera' : 'Gallery'} permission is required.`,
      );
      return false;
    }
    return true;
  }, []);

  const pickFromCamera = useCallback(async () => {
    if (!(await requestPermission('camera'))) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // ✅ FIXED: deprecated MediaTypeOptions removed
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAsset(result.assets[0]);
        setError('');
      }
    } catch {
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  }, [requestPermission]);

  const pickFromGallery = useCallback(async () => {
    if (!(await requestPermission('gallery'))) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // ✅ FIXED: deprecated MediaTypeOptions removed
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAsset(result.assets[0]);
        setError('');
      }
    } catch {
      Alert.alert('Error', 'Could not open gallery. Please try again.');
    }
  }, [requestPermission]);

  const handleUpload = useCallback(async () => {
    if (!asset) {
      setError('Please select or capture a leaf image first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const filename = asset.uri.split('/').pop() || 'leaf.jpg';
      const ext = (/\.(\w+)$/.exec(filename)?.[1] ?? 'jpg').toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blob = await fetch(asset.uri).then((r) => r.blob());
        formData.append('file', new File([blob], filename, { type: mimeType }));
      } else {
        formData.append('file', { uri: asset.uri, name: filename, type: mimeType });
      }

      const res = await axios.post(`${API_BASE}/api/predict-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (!res.data?.ai_analysis) throw new Error('Unexpected response from server.');

      // ✅ FIXED: map ai_analysis fields to what DiseaseResultScreen expects
      const ai = res.data.ai_analysis;
      navigation.navigate('DiseaseResult', {
        image: asset.uri,
        disease: ai.prediction ?? ai.class_name ?? 'Unknown',
        confidence: ai.confidence != null ? `${parseFloat(ai.confidence).toFixed(1)}%` : 'N/A',
        treatment: ai.advice ?? ai.treatment ?? 'Consult an agricultural expert.',
        description: ai.description ?? '',
        probabilities: ai.all_probabilities ?? ai.probabilities ?? {},
        lowConfidence: ai.low_confidence ?? false,
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ECONNABORTED' ? 'Request timed out. Check your server.' : null) ||
        (err.message?.match(/Network|connect/i)
          ? 'Cannot reach server. Make sure backend is running on port 5001.'
          : null) ||
        err.message ||
        'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [asset, navigation]);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Instructions */}
      <View style={s.infoCard}>
        <Text style={s.infoTitle}>📋 Before You Upload</Text>
        {[
          'Use a clear, well-lit close-up photo of a single leaf',
          'Avoid blurry, shadowed or partially cropped images',
          'Ensure the entire leaf is visible in the frame',
          'Supported formats: JPG, PNG',
        ].map((tip, i) => (
          <View key={i} style={s.infoRow}>
            <Ionicons name="checkmark-circle" size={14} color={C.success} />
            <Text style={s.infoTxt}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Image picker */}
      <View style={s.pickerCard}>
        <Text style={s.pickerTitle}>Select Leaf Image</Text>
        <View style={s.pickerBtns}>
          <TouchableOpacity
            style={s.pickerBtn}
            onPress={pickFromCamera}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            <View style={[s.pickerIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="camera-outline" size={26} color={C.blue} />
            </View>
            <Text style={s.pickerBtnTxt}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.pickerBtn}
            onPress={pickFromGallery}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Choose from gallery"
          >
            <View style={[s.pickerIcon, { backgroundColor: C.xlight }]}>
              <Ionicons name="images-outline" size={26} color={C.primary} />
            </View>
            <Text style={s.pickerBtnTxt}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {asset ? (
          <View style={s.previewWrap}>
            <Image source={{ uri: asset.uri }} style={s.preview} resizeMode="cover" />
            <TouchableOpacity style={s.clearBtn} onPress={() => setAsset(null)}>
              <Ionicons name="close-circle" size={24} color={C.error} />
            </TouchableOpacity>
            <View style={s.selectedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={C.success} />
              <Text style={s.selectedTxt}>Image selected</Text>
            </View>
          </View>
        ) : (
          <View style={s.emptyPreview}>
            <Ionicons name="leaf-outline" size={48} color={C.border2} />
            <Text style={s.emptyPreviewTxt}>No image selected</Text>
          </View>
        )}

        {/* Error */}
        {!!error && (
          <View style={s.errBox}>
            <Ionicons name="warning-outline" size={15} color={C.error} />
            <Text style={s.errTxt}>{error}</Text>
          </View>
        )}

        <PrimaryButton
          title={loading ? 'Analysing…' : '🔍  Analyse Leaf'}
          onPress={handleUpload}
          loading={loading}
          disabled={!asset || loading}
          style={{ marginTop: 16 }}
        />
        {asset && !loading && (
          <OutlineButton
            title="Choose Different Image"
            onPress={() => setAsset(null)}
            style={{ marginTop: 10 }}
          />
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: C.primary, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  infoTxt: { flex: 1, fontSize: 13, color: C.text2, lineHeight: 18 },

  pickerCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    ...SHADOW.sm,
  },
  pickerTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 16 },
  pickerBtns: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickerBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  pickerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerBtnTxt: { fontSize: 13, fontWeight: '700', color: C.text2 },

  previewWrap: { position: 'relative', marginBottom: 4 },
  preview: { width: '100%', height: 220, borderRadius: 14 },
  clearBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: C.white, borderRadius: 99 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  selectedTxt: { fontSize: 12, color: C.success, fontWeight: '600' },

  emptyPreview: {
    height: 160,
    borderRadius: 14,
    backgroundColor: C.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  emptyPreviewTxt: { fontSize: 13, color: C.hint },

  errBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.error + '33',
  },
  errTxt: { flex: 1, fontSize: 13, color: C.error, lineHeight: 18 },
});
