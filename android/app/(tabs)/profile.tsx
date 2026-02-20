import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../src/services/auth';
import { THEME } from '../../src/constants/Theme';
import { useAppContext } from '../../src/context/AppContext';
import { VergeHeader } from '../../src/components/VergeHeader';
import { VergeLoader } from '../../src/components/VergeLoader';
import { VergeAlert } from '../../src/components/VergeAlert';
import { apiHelper } from '../../src/services/api';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL;

const formatDobInput = (value: string, previousValue = '') => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const previousDigits = previousValue.replace(/\D/g, '').slice(0, 8);
  const isDeleting = digits.length < previousDigits.length || value.length < previousValue.length;

  let formatted = '';

  if (digits.length <= 2) {
    formatted = digits;
  } else if (digits.length <= 4) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  if (!isDeleting && (digits.length === 2 || digits.length === 4)) {
    return `${formatted}/`;
  }

  return formatted;
};

const normalizeDobForInput = (value?: string) => {
  if (!value) return '';

  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [year, month, day] = trimmed.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  return formatDobInput(trimmed);
};

const isValidDobInput = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  const maxDay = new Date(year, month, 0).getDate();
  return day >= 1 && day <= maxDay;
};

const toApiDob = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

export default function Profile() {
  const { setIsVerified } = useAppContext();
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    _id: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    collegeName: '',
    studentId: '',
    aadhaarNumber: '',
    aadhaarImage: '',
    studentIdImage: '',
    role: 'visitor',
  });

  const [savedProfile, setSavedProfile] = useState<any>(null);

  // Refs to always have the latest values in callbacks (avoids stale closure race conditions)
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const savedProfileRef = useRef(savedProfile);
  savedProfileRef.current = savedProfile;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [activeImageField, setActiveImageField] = useState<'aadhaarImage' | 'studentIdImage' | null>(null);
  const [uploadingField, setUploadingField] = useState<'aadhaarImage' | 'studentIdImage' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const uploadToCloudinary = async (base64Image: string) => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing');
    }

    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const session = authService.getSession();
      const backendUser = await authService.getBackendUser();

      setGooglePhoto(session?.photoURL || backendUser?.profilePic || null);

      let response;
      if (backendUser?._id) {
        response = await apiHelper.fetch(`${SERVER_URL}/api/users/get?id=${backendUser._id}`);
      } else if (backendUser?.email || session?.email) {
        const email = backendUser?.email || session?.email;
        response = await apiHelper.fetch(`${SERVER_URL}/api/users/get?email=${email}`);
      }

      let loadedProfile;

      if (response && response.ok) {
        const data = await response.json();
        const apiData = data.data || {};
        loadedProfile = {
          ...profile,
          ...apiData,
          phone: apiData.phone ? String(apiData.phone) : '',
          dob: normalizeDobForInput(apiData.dob ? String(apiData.dob) : ''),
          aadhaarNumber: apiData.aadhaarNumber ? String(apiData.aadhaarNumber) : '',
          aadhaarImage: apiData.aadhaarImage || '',
          studentIdImage: apiData.studentIdImage || ''
        };
      } else {
        loadedProfile = {
          ...profile,
          name: session?.displayName || backendUser?.name || '',
          email: session?.email || backendUser?.email || '',
          _id: backendUser?._id || '',
        };
      }
      setProfile(loadedProfile);
      setSavedProfile(loadedProfile);
    } catch {
      showAlert('Error', 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    // Read latest values from refs to avoid stale closure issues on rapid taps
    const currentProfile = profileRef.current;
    const currentSaved = savedProfileRef.current;
    if (!currentSaved) return;

    // Clear all previous errors
    setFieldErrors({});

    const cleanedProfile = {
      ...currentProfile,
      name: String(currentProfile.name || '').trim(),
      phone: String(currentProfile.phone || '').trim(),
      dob: String(currentProfile.dob || '').trim(),
      collegeName: String(currentProfile.collegeName || '').trim(),
      studentId: String(currentProfile.studentId || '').trim(),
      aadhaarNumber: String(currentProfile.aadhaarNumber || '').trim(),
    };

    // 1. Compute full diff
    const allChanges: any = {};
    const clearedFields: string[] = [];

    Object.keys(cleanedProfile).forEach(key => {
      const k = key as keyof typeof cleanedProfile;
      if (k === '_id') return;

      const newVal = String(cleanedProfile[k] ?? '').trim();
      const oldVal = String(currentSaved[k] ?? '').trim();

      if (newVal !== oldVal) {
        if (newVal === '' && oldVal !== '') {
          clearedFields.push(k);
        } else {
          allChanges[k] = cleanedProfile[k];
        }
      }
    });

    // Show inline errors on cleared fields but leave them empty (don't revert)
    if (clearedFields.length > 0) {
      const errors: Record<string, string> = {};
      clearedFields.forEach(f => errors[f] = 'Cannot be emptied');
      setFieldErrors(prev => ({ ...prev, ...errors }));
    }

    // No real value changes left to send
    if (Object.keys(allChanges).length === 0) {
      if (clearedFields.length === 0) setIsEditing(false);
      return;
    }

    // Include identifying ID
    const userId = currentProfile._id;
    if (!userId) {
      showAlert('Error', 'User ID not found. Please re-login.');
      return;
    }
    const idParam = `id=${currentProfile._id}`;

    // 2. Validation — set inline field errors instead of popup alerts
    const errors: Record<string, string> = {};

    if ('phone' in allChanges) {
      if (!/^[0-9]{10}$/.test(allChanges.phone)) {
        errors.phone = 'Enter a valid 10-digit number';
      }
    }

    if ('aadhaarNumber' in allChanges) {
      if (!/^[0-9]{12}$/.test(allChanges.aadhaarNumber)) {
        errors.aadhaarNumber = 'Enter a valid 12-digit number';
      }
    }

    if ('dob' in allChanges) {
      if (!isValidDobInput(allChanges.dob)) {
        errors.dob = 'Use DD/MM/YYYY format';
      } else {
        allChanges.dob = toApiDob(allChanges.dob);
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    setSaving(true);
    try {
      const response = await apiHelper.fetch(`${SERVER_URL}/api/users/update?${idParam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allChanges),
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        const serverData = resData.data || {};
        const updatedProfileData = { ...cleanedProfile, ...serverData };
        clearedFields.forEach(field => {
          (updatedProfileData as any)[field] = currentSaved[field];
        });
        updatedProfileData.dob = normalizeDobForInput(updatedProfileData.dob ? String(updatedProfileData.dob) : '');
        setProfile(updatedProfileData);
        setSavedProfile(updatedProfileData);

        await AsyncStorage.setItem('backend_user', JSON.stringify(updatedProfileData));

        setIsEditing(false);
        showAlert('Success', 'Profile updated successfully.');
      } else {
        showAlert('Error', resData.message || 'Failed to update profile.');
      }
    } catch (err) {
      showAlert('Error', 'Update failed');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleImageResult = useCallback(async (result: ImagePicker.ImagePickerResult, field: 'aadhaarImage' | 'studentIdImage') => {
    if (!result.canceled && result.assets[0].base64) {
      setUploadingField(field);
      try {
        const imageUrl = await uploadToCloudinary(`data:image/jpeg;base64,${result.assets[0].base64}`);

        const currentProfile = profileRef.current;
        const updatedProfile = { ...currentProfile, [field]: imageUrl };
        setProfile(updatedProfile);

        const updatePayload = { [field]: imageUrl };
        const idParam = `id=${currentProfile._id}`;
        const response = await apiHelper.fetch(`${SERVER_URL}/api/users/update?${idParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (response.ok) {
          const resData = await response.json();
          const finalProfile = { ...updatedProfile, ...(resData.data || {}) };
          finalProfile.dob = normalizeDobForInput(finalProfile.dob ? String(finalProfile.dob) : '');
          setProfile(finalProfile);
          setSavedProfile(finalProfile);
          await AsyncStorage.setItem('backend_user', JSON.stringify(finalProfile));
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Server sync failed after upload');
        }
      } catch (error: any) {
        showAlert('Error', error.message || 'Failed to process image');
      } finally {
        setUploadingField(null);
      }
    }
  }, []);

  const launchCamera = useCallback(async (field: 'aadhaarImage' | 'studentIdImage') => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
      });
      handleImageResult(result, field);
    } catch { showAlert('Error', 'Camera not available'); }
  }, [handleImageResult]);

  const launchGallery = useCallback(async (field: 'aadhaarImage' | 'studentIdImage') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true,
      });
      handleImageResult(result, field);
    } catch { showAlert('Error', 'Gallery access denied'); }
  }, [handleImageResult]);

  const pickImage = useCallback((field: 'aadhaarImage' | 'studentIdImage') => {
    setActiveImageField(field);
    setShowImagePicker(true);
  }, []);

  const completionPercent = useMemo(() => {
    const fields = ['phone', 'gender', 'dob', 'collegeName', 'aadhaarNumber', 'aadhaarImage', 'studentId', 'studentIdImage'];
    const filled = fields.filter((field) => !!profile[field as keyof typeof profile]);
    return Math.round((filled.length / fields.length) * 100);
  }, [profile]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: THEME.colors.bg }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <LinearGradient colors={[THEME.colors.bg, '#0A0A0A', THEME.colors.bg]} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={styles.container}>
        <VergeHeader
          title="PROFILE"
          rightElement={
            !loading && (
              !isEditing ? (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
                  <Ionicons name="pencil" size={14} color={THEME.colors.accent} />
                  <Text style={styles.actionButtonText}>EDIT</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => { setProfile(savedProfile); setFieldErrors({}); setIsEditing(false); }} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={14} color="#000" />
                        <Text style={styles.saveButtonText}>SAVE</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )
            )
          }
        />

        {loading ? (
          <VergeLoader message="LOADING..." />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.cardContainer}>
              <View style={styles.headerRow}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarContainer}>
                    {googlePhoto ? <Image source={{ uri: googlePhoto }} style={styles.avatarImage} /> : <Ionicons name="person" size={32} color={THEME.colors.textMuted} />}
                  </View>
                  {completionPercent === 100 && (
                    <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={10} color="#000" /></View>
                  )}
                </View>

                <View style={styles.headerInfo}>
                  {isEditing ? (
                    <TextInput
                      style={styles.nameInput}
                      value={profile.name}
                      onChangeText={(t) => setProfile({ ...profile, name: t })}
                      placeholder="ENTER NAME"
                      placeholderTextColor={THEME.colors.textMuted}
                    />
                  ) : (
                    <Text style={styles.profileName} numberOfLines={1}>{profile.name || 'UNKNOWN'}</Text>
                  )}
                  <Text style={styles.profileEmail} numberOfLines={1}>{profile.email}</Text>
                  <View style={styles.roleBadge}><Text style={styles.roleText}>{profile.role.toUpperCase()}</Text></View>
                </View>

                {!isEditing && (
                  <TouchableOpacity onPress={() => setShowQRCode(true)} style={styles.qrButton}>
                    <Ionicons name="qr-code-outline" size={20} color={THEME.colors.accent} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{completionPercent}% COMPLETE</Text>
            </View>

            <Section title="CONTACT">
              <FieldRow
                icon="call-outline" label="PHONE" value={profile.phone} isEditing={isEditing}
                onChange={(t) => { setProfile({ ...profile, phone: t }); clearFieldError('phone'); }}
                keyboardType="phone-pad" maxLength={10} placeholder="8888888888" prefix="+91"
                error={fieldErrors.phone}
              />
            </Section>

            <Section title="PERSONAL">
              <View style={styles.fieldRow}>
                <View style={styles.fieldLabelGroup}>
                  <Ionicons name="person-outline" size={16} color={THEME.colors.textMuted} />
                  <Text style={styles.fieldLabel}>GENDER</Text>
                </View>
                <View style={styles.fieldContent}>
                  {isEditing ? (
                    <View style={styles.genderOptions}>
                      {['Male', 'Female'].map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => setProfile({ ...profile, gender: opt })}
                          style={[styles.optionButton, profile.gender === opt && styles.optionButtonActive]}
                        >
                          <Text style={[styles.optionText, profile.gender === opt && { color: THEME.colors.accent }]}>{opt.toUpperCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.fieldValue, !profile.gender && { color: THEME.colors.textMuted }]}>
                      {profile.gender || 'NOT SPECIFIED'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.divider} />

              <View>
                <View style={styles.fieldRow}>
                  <View style={styles.fieldLabelGroup}>
                    <Ionicons name="calendar-outline" size={16} color={fieldErrors.dob ? '#FF3B30' : THEME.colors.textMuted} />
                    <Text style={[styles.fieldLabel, fieldErrors.dob && { color: '#FF3B30' }]}>DOB</Text>
                  </View>
                  <View style={styles.fieldContent}>
                    {isEditing ? (
                      <TextInput
                        value={profile.dob}
                        onChangeText={(t) => { setProfile((prev) => ({ ...prev, dob: formatDobInput(t, prev.dob) })); clearFieldError('dob'); }}
                        keyboardType="number-pad"
                        maxLength={10}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={THEME.colors.textMuted}
                        selectionColor={fieldErrors.dob ? '#FF3B30' : THEME.colors.accent}
                        style={[styles.fieldInput, fieldErrors.dob && { color: '#FF3B30' }]}
                      />
                    ) : (
                      <Text style={[styles.fieldValue, !profile.dob && { color: THEME.colors.textMuted }]}>
                        {profile.dob || 'NOT SET'}
                      </Text>
                    )}
                  </View>
                </View>
                {fieldErrors.dob && <Text style={styles.fieldErrorText}>{fieldErrors.dob}</Text>}
              </View>
            </Section>

            <Section title="ACADEMIC">
              <FieldRow
                icon="school-outline" label="COLLEGE" value={profile.collegeName} isEditing={isEditing}
                onChange={(t) => { setProfile({ ...profile, collegeName: t }); clearFieldError('collegeName'); }}
                placeholder="UNIVERSITY NAME" hasBorder maxLength={100}
                error={fieldErrors.collegeName}
              />
              <FieldRow
                icon="id-card-outline" label="STUDENT ID" value={profile.studentId} isEditing={isEditing}
                onChange={(t) => { setProfile({ ...profile, studentId: t }); clearFieldError('studentId'); }}
                placeholder="ID NUMBER" maxLength={20}
                error={fieldErrors.studentId}
              />
            </Section>

            <Section title="VERIFICATION">
              <FieldRow
                icon="shield-checkmark-outline" label="AADHAAR NUMBER" value={profile.aadhaarNumber} isEditing={isEditing}
                onChange={(t) => { setProfile({ ...profile, aadhaarNumber: t }); clearFieldError('aadhaarNumber'); }}
                keyboardType="number-pad" maxLength={12} placeholder="1234..." hasBorder
                error={fieldErrors.aadhaarNumber}
              />
              <View style={styles.uploadContainer}>
                <View style={styles.uploadWrapper}>
                  <Text style={styles.uploadLabel}>AADHAAR CARD</Text>
                  <TouchableOpacity onPress={() => pickImage('aadhaarImage')} style={styles.uploadBox} disabled={uploadingField === 'aadhaarImage'}>
                    {profile.aadhaarImage ? <Image source={{ uri: profile.aadhaarImage }} style={styles.previewImg} /> : (
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="camera" size={20} color={THEME.colors.textMuted} />
                        <Text style={styles.uploadText}>FRONT</Text>
                      </View>
                    )}
                    {uploadingField === 'aadhaarImage' && (
                      <View style={styles.uploadOverlay}>
                        <ActivityIndicator size="small" color={THEME.colors.accent} />
                        <Text style={styles.uploadingText}>UPLOADING</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.uploadWrapper}>
                  <Text style={styles.uploadLabel}>STUDENT ID</Text>
                  <TouchableOpacity onPress={() => pickImage('studentIdImage')} style={styles.uploadBox} disabled={uploadingField === 'studentIdImage'}>
                    {profile.studentIdImage ? <Image source={{ uri: profile.studentIdImage }} style={styles.previewImg} /> : (
                      <View style={{ alignItems: 'center' }}>
                        <Ionicons name="camera" size={20} color={THEME.colors.textMuted} />
                        <Text style={styles.uploadText}>FRONT</Text>
                      </View>
                    )}
                    {uploadingField === 'studentIdImage' && (
                      <View style={styles.uploadOverlay}>
                        <ActivityIndicator size="small" color={THEME.colors.accent} />
                        <Text style={styles.uploadingText}>UPLOADING</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Section>

            <TouchableOpacity
              onPress={async () => {
                await authService.signOut();
                setIsVerified(false);
              }}
              style={styles.logoutButton}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
              <Text style={styles.logoutText}>LOGOUT</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <Modal visible={showQRCode} transparent animationType="fade" onRequestClose={() => setShowQRCode(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowQRCode(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>USER ID</Text>
              <View style={styles.qrWrapper}>
                <QRCode value={profile._id || 'N/A'} size={180} />
              </View>
              <Text style={styles.uidText}>{profile._id}</Text>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={showImagePicker} transparent animationType="slide" onRequestClose={() => setShowImagePicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowImagePicker(false)}>
            <View style={styles.actionSheetContent}>
              <View style={styles.actionSheetHeader}>
                <View style={styles.actionSheetHandle} />
                <Text style={styles.actionSheetTitle}>SELECT SOURCE</Text>
              </View>

              <View style={styles.actionOptions}>
                {activeImageField && profile[activeImageField] && (
                  <TouchableOpacity
                    style={styles.actionOption}
                    onPress={() => {
                      setShowImagePicker(false);
                      setShowImageViewer(true);
                    }}
                  >
                    <View style={styles.actionIconWrapper}>
                      <Ionicons name="eye-outline" size={24} color={THEME.colors.accent} />
                    </View>
                    <Text style={styles.actionOptionText}>VIEW</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionOption}
                  onPress={() => {
                    setShowImagePicker(false);
                    if (activeImageField) launchCamera(activeImageField);
                  }}
                >
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name="camera-outline" size={24} color={THEME.colors.accent} />
                  </View>
                  <Text style={styles.actionOptionText}>CAMERA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionOption}
                  onPress={() => {
                    setShowImagePicker(false);
                    if (activeImageField) launchGallery(activeImageField);
                  }}
                >
                  <View style={styles.actionIconWrapper}>
                    <Ionicons name="images-outline" size={24} color={THEME.colors.accent} />
                  </View>
                  <Text style={styles.actionOptionText}>GALLERY</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.actionCancel}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={styles.actionCancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={showImageViewer} transparent animationType="fade" onRequestClose={() => setShowImageViewer(false)}>
          <View style={styles.viewerOverlay}>
            <SafeAreaView style={styles.viewerHeader}>
              <TouchableOpacity onPress={() => setShowImageViewer(false)} style={styles.viewerCloseBtn}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.viewerTitle}>
                {activeImageField === 'aadhaarImage' ? 'AADHAAR CARD' : 'STUDENT ID'}
              </Text>
              <View style={{ width: 44 }} />
            </SafeAreaView>

            <View style={styles.viewerImageContainer}>
              {activeImageField && profile[activeImageField] && (
                <Image
                  source={{ uri: profile[activeImageField] }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>

        <VergeAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const Section = memo(({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
));

interface FieldRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (text: string) => void;
  keyboardType?: import('react-native').KeyboardTypeOptions;
  maxLength?: number;
  placeholder?: string;
  hasBorder?: boolean;
  prefix?: string;
  error?: string;
}

const FieldRow = memo(({ icon, label, value, isEditing, onChange, keyboardType, maxLength, placeholder, hasBorder, prefix, error }: FieldRowProps) => (
  <>
    <View>
      <View style={styles.fieldRow}>
        <View style={styles.fieldLabelGroup}>
          <Ionicons name={icon} size={16} color={error ? '#FF3B30' : THEME.colors.textMuted} />
          <Text style={[styles.fieldLabel, error && { color: '#FF3B30' }]}>{label}</Text>
        </View>

        <View style={styles.fieldContent}>
          {prefix && (
            <Text style={[styles.fieldValue, { marginRight: 2 }, error && { color: '#FF3B30' }]}>{prefix}</Text>
          )}
          {isEditing ? (
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType={keyboardType}
              maxLength={maxLength}
              placeholder={placeholder}
              placeholderTextColor={error ? 'rgba(255,59,48,0.4)' : THEME.colors.textMuted}
              selectionColor={error ? '#FF3B30' : THEME.colors.accent}
              style={[styles.fieldInput, error && { color: '#FF3B30' }]}
            />
          ) : (
            <Text style={[styles.fieldValue, !value && { color: THEME.colors.textMuted }]} numberOfLines={1}>
              {value || 'NOT SET'}
            </Text>
          )}
        </View>
      </View>
      {error && <Text style={styles.fieldErrorText}>{error}</Text>}
    </View>
    {hasBorder && <View style={styles.divider} />}
  </>
));

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerInfo: { flex: 1 },
  avatarWrapper: { position: 'relative' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header Actions
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: THEME.colors.border, gap: 6 },
  actionButtonText: { fontSize: 10, fontWeight: '800', color: THEME.colors.accent, letterSpacing: 1 },
  saveButton: { backgroundColor: THEME.colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButtonText: { fontSize: 10, fontWeight: '900', color: '#000' },
  cancelButton: { paddingVertical: 8, paddingHorizontal: 8 },
  cancelButtonText: { fontSize: 10, fontWeight: '800', color: THEME.colors.textMuted },

  // Profile Card
  cardContainer: { backgroundColor: THEME.colors.cardBg, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: THEME.colors.border },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A1A1A', borderWidth: 1.5, borderColor: THEME.colors.accent, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: THEME.colors.success, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.colors.cardBg },
  profileName: { fontSize: 20, fontWeight: '800', color: THEME.colors.text, includeFontPadding: false, height: 26 },
  nameInput: { fontSize: 20, fontWeight: '800', color: THEME.colors.accent, borderBottomWidth: 1, borderBottomColor: THEME.colors.accent, padding: 0, height: 26, includeFontPadding: false },
  profileEmail: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 2 },
  roleBadge: { marginTop: 8, backgroundColor: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: THEME.colors.border },
  roleText: { fontSize: 8, fontWeight: '900', color: THEME.colors.accent, letterSpacing: 1 },
  qrButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: THEME.colors.border },

  // Progress
  progressBarContainer: { height: 4, backgroundColor: '#1A1A1A', borderRadius: 2, marginTop: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: THEME.colors.accent },
  progressText: { fontSize: 8, fontWeight: '800', color: THEME.colors.textMuted, marginTop: 6, textAlign: 'right' },

  // Sections & Rows
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: THEME.colors.textMuted, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: THEME.colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: THEME.colors.border, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 52, paddingVertical: 8 },
  fieldLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 0.4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: THEME.colors.textMuted },
  fieldContent: { flex: 0.6, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  fieldValue: { fontSize: 13, fontWeight: '600', color: THEME.colors.text, includeFontPadding: false, textAlign: 'right' },
  fieldInput: { fontSize: 13, fontWeight: '600', color: THEME.colors.accent, textAlign: 'right', minWidth: 40, padding: 0, includeFontPadding: false, textAlignVertical: 'center' },
  divider: { height: 1, backgroundColor: THEME.colors.border },
  fieldErrorText: { fontSize: 9, fontWeight: '700', color: '#FF3B30', textAlign: 'right', paddingHorizontal: 16, paddingBottom: 6, marginTop: -2 },

  // Gender Toggle
  genderOptions: { flexDirection: 'row', gap: 6 },
  optionButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: THEME.colors.border },
  optionButtonActive: { borderColor: THEME.colors.accent, backgroundColor: 'rgba(255, 107, 0, 0.05)' },
  optionText: { fontSize: 9, fontWeight: '800', color: THEME.colors.textMuted },

  // Verification Uploads
  uploadContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  uploadWrapper: { flex: 1 },
  uploadLabel: { fontSize: 9, fontWeight: '800', color: THEME.colors.textMuted, marginBottom: 8, textAlign: 'center' },
  uploadBox: { height: 100, backgroundColor: '#0F0F0F', borderRadius: 8, borderWidth: 1, borderColor: THEME.colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadText: { fontSize: 8, fontWeight: '800', color: THEME.colors.textMuted, marginTop: 4 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  uploadingText: { fontSize: 8, fontWeight: '800', color: THEME.colors.accent, marginTop: 4, letterSpacing: 1 },

  // Logout
  logoutButton: { marginTop: 20, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  logoutText: { color: '#FF3B30', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#0A0A0A', padding: 30, borderRadius: 24, width: '80%', alignItems: 'center', borderWidth: 1, borderColor: THEME.colors.accent },
  modalTitle: { color: THEME.colors.text, fontSize: 14, fontWeight: '900', marginBottom: 20, letterSpacing: 2 },
  qrWrapper: { padding: 15, backgroundColor: '#FFF', borderRadius: 16 },
  uidText: { color: THEME.colors.textMuted, fontSize: 10, marginTop: 20, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Action Sheet
  actionSheetContent: {
    backgroundColor: '#0F0F0F',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderColor: THEME.colors.border,
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  actionSheetTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.textMuted,
    letterSpacing: 2,
  },
  actionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
  },
  actionOption: {
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  actionOptionText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: 1,
  },
  actionCancel: {
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    marginTop: 8,
  },
  actionCancelText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },

  // Viewer
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  viewerCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  viewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  }
});
