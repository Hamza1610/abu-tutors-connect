import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Modal, Image
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const ROLES = [
  { label: 'Student (Tutee)', value: 'tutee' },
  { label: 'Peer Tutor', value: 'tutor' },
];

const LEVELS = ['100L', '200L', '300L', '400L', '500L'];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'tutee' | 'tutor'>('tutee');
  const [level, setLevel] = useState('100L');
  const [regNumber, setRegNumber] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [profilePicture, setProfilePicture] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 1024 * 1024) {
        Alert.alert('Image Too Large', 'Profile picture must be less than 1MB.');
        return;
      }
      setProfilePicture(asset);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    const validatePassword = (pass: string) => {
      if (pass.length < 8) return false;
      const hasLetter = /[a-zA-Z]/.test(pass);
      const hasNumber = /\d/.test(pass);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
      return hasLetter && hasNumber && hasSpecial;
    };

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters and include a letter, a number, and a special character.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'You must accept the Terms and Conditions to register.');
      return;
    }
    if (role === 'tutee' && !profilePicture) {
      Alert.alert('Photo Required', 'Please upload a profile picture.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('role', role);
      formData.append('level', level);
      formData.append('registrationNumber', regNumber.trim());
      formData.append('acceptedTerms', 'true');

      if (profilePicture) {
        const uri = profilePicture.uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpg`;
        
        // @ts-ignore
        formData.append('profilePicture', {
          uri,
          name: filename,
          type,
        });
      }

      await register(formData);
    } catch (err: any) {
      Alert.alert(
        'Registration Failed',
        err.response?.data?.message || 'Could not create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>Join ABUTutorsConnect today</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleRow}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
                  onPress={() => setRole(r.value as 'tutee' | 'tutor')}
                >
                  <Text style={[styles.roleBtnText, role === r.value && styles.roleBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {role === 'tutee' && (
              <Text style={styles.roleInfo}>✓ Student accounts are active immediately!</Text>
            )}
          </View>

          {/* Photo Upload */}
          {role === 'tutee' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Picture (Max 1MB) *</Text>
              <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                    <Text style={styles.photoPlaceholderText}>Upload Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Abdullahi Musa"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@abu.edu.ng"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number *</Text>
            <TextInput
              style={styles.input}
              value={regNumber}
              onChangeText={setRegNumber}
              placeholder={role === 'tutor' ? "e.g. U21CO1015" : "e.g. 21/52HA/01234"}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
            {role === 'tutor' && (
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>
                Required format: U[Year][Dept][Serial] (e.g., U21CO1015)
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.levelRow}>
                {LEVELS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                    onPress={() => setLevel(l)}
                  >
                    <Text style={[styles.levelBtnText, level === l && styles.levelBtnTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="8+ chars, letter, num & special"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.termsLabelText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>Terms and Conditions</Text>
                {' '}of ABUTutorsConnect
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: Spacing.md, alignItems: 'center' }} onPress={() => router.push('/login')}>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>
              Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Ahmadu Bello University · Zaria</Text>
      </ScrollView>

    </KeyboardAvoidingView>

      <Modal 
        visible={showTerms} 
        animationType="slide" 
        transparent={true} 
        statusBarTranslucent={true}
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons name="close-circle" size={32} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.termsScroll} 
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <Text style={styles.termsText}>
                Welcome to our Tutoring Platform. By registering and using our services, you agree to the following terms and conditions:
              </Text>

              <Text style={styles.termsH3}>1. Eligibility</Text>
              <Text style={styles.termsText}>
                • You must provide accurate and truthful information during registration.{"\n"}
                • Users must be a registered student (tutee) or verified tutor.{"\n"}
                • Tutors must pay the registration fee unless waived by Admin.
              </Text>

              <Text style={styles.termsH3}>2. Account Responsibilities</Text>
              <Text style={styles.termsText}>
                • Keep your login credentials secure.{"\n"}
                • You are responsible for all activity on your account.{"\n"}
                • Users may register as both tutor and tutee using the same email.
              </Text>

              <Text style={styles.termsH3}>3. Profile Completion & Verification</Text>
              <Text style={styles.termsText}>
                • Tutors must complete their profile and submit required documents.{"\n"}
                • Admin will review profiles before granting access to the system.{"\n"}
                • Verified tutors may set their hourly charge.
              </Text>

              <Text style={styles.termsH3}>4. Session Rules</Text>
              <Text style={styles.termsText}>
                • Sessions must start and end using QR codes or secure PINs.{"\n"}
                • Once started, sessions are tracked using device clock/local timer, even if offline.{"\n"}
                • Tutors and tutees must follow professional conduct.
              </Text>

              <Text style={styles.termsH3}>5. Payment & Escrow</Text>
              <Text style={styles.termsText}>
                • Session fees are deducted from the tutee’s wallet and held in Escrow.{"\n"}
                • Escrow is released to the tutor only after a session ends successfully.{"\n"}
                • No commission will be taken from tutors after a session; the full agreed amount is released.{"\n"}
                • Refunds or reschedules are allowed according to No-Show or dispute policies.
              </Text>

              <Text style={styles.termsH3}>6. Ratings and Feedback</Text>
              <Text style={styles.termsText}>
                • Both tutors and tutees must submit honest ratings and reviews.{"\n"}
                • Ratings contribute to tutor verification and system trust.
              </Text>

              <Text style={styles.termsH3}>7. Disputes</Text>
              <Text style={styles.termsText}>
                • Users may flag disputes if issues arise.{"\n"}
                • Escrow funds remain frozen until Admin resolves the issue.
              </Text>

              <Text style={styles.termsH3}>8. User Conduct</Text>
              <Text style={styles.termsText}>
                • Users must treat each other professionally and respectfully.{"\n"}
                • Harassment, abuse, or fraudulent activity may result in account suspension or removal.
              </Text>

              <Text style={styles.termsH3}>9. Admin Authority</Text>
              <Text style={styles.termsText}>
                • Admin may update these terms at any time.{"\n"}
                • Users are required to agree to the latest terms to continue using the platform.{"\n"}
                • Admin manages registration fees (which may be free at admin's discretion), session monitoring, disputes, and Escrow resolution.
              </Text>

              <Text style={styles.termsH3}>10. Limitation of Liability</Text>
              <Text style={styles.termsText}>
                • The administrators will not be held liable for any recklessness from either tutor or tutee.{"\n"}
                • The platform is not liable for personal disputes between tutors and tutees.{"\n"}
                • The platform is not responsible for technical issues such as internet outages or device failures.
              </Text>

              <Text style={styles.termsH3}>11. Acceptance</Text>
              <Text style={styles.termsText}>
                • By continuing to use the platform, you confirm that you accept these terms and conditions and will abide by them.
              </Text>
            </ScrollView>
            
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => { setShowTerms(false); setAcceptedTerms(true); }}>
              <Text style={styles.closeModalBtnText}>I Agree & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: Spacing.xxl,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 60,
    height: 60,
  },

  appName: { color: '#fff', fontSize: FontSize.xxxl, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.base, marginTop: 4 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.base,
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  eyeIcon: {
    paddingHorizontal: Spacing.md,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },
  roleBtnTextActive: { color: Colors.primary },
  roleInfo: { color: Colors.success, fontSize: 13, marginTop: 10, fontWeight: '600' },
  
  photoPicker: {
    width: '100%', height: 120, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFF',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { alignItems: 'center', gap: 6 },
  photoPlaceholderText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },

  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  levelBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  levelBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },
  levelBtnTextActive: { color: '#fff' },
  
  termsRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: Spacing.lg, marginTop: 8,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  termsLabelText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary, lineHeight: 20,
  },
  termsLink: { color: Colors.primary, fontWeight: '800', textDecorationLine: 'underline' },
  
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
    height: 56, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 10, // Reduced padding to allow more space
    zIndex: 999,
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderRadius: Radius.xl, 
    padding: 24, 
    width: '95%',
    maxHeight: '85%',
    minHeight: 300, // ENSURE it doesn't collapse
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary },
  termsScroll: { 
    flex: 1, // Take up all available space
    marginVertical: 10,
  },
  termsH3: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 },
  termsText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 8 },
  closeModalBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: Radius.md, alignItems: 'center', marginTop: 10 },
  closeModalBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },

  footer: {
    textAlign: 'center', color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs, marginTop: Spacing.xxl, marginBottom: Spacing.xl,
  },
});

