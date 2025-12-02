import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';

const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      // Upload image
      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);

        const response = await api.post('/uploads/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setProfileImage(response.data.url);
      } catch (error) {
        Alert.alert('오류', '이미지 업로드에 실패했습니다');
      }
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      Alert.alert('알림', '이미 추가된 스킬입니다');
      return;
    }
    if (skills.length >= 10) {
      Alert.alert('알림', '스킬은 최대 10개까지 추가할 수 있습니다');
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (nickname.length < 2) {
      newErrors.nickname = '닉네임은 2자 이상 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await api.patch('/users/me', {
        name: name.trim(),
        nickname: nickname.trim(),
        bio: bio.trim(),
        profileImage,
        skills,
      });

      Alert.alert('성공', '프로필이 수정되었습니다', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '프로필 수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileImageSection}>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require('../../assets/default-avatar.png')
                }
                style={styles.profileImage}
              />
              <View style={styles.editImageButton}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Input
              label="이름"
              placeholder="실명을 입력해주세요"
              value={name}
              onChangeText={setName}
              error={errors.name}
              maxLength={20}
            />
          </View>

          <View style={styles.section}>
            <Input
              label="닉네임"
              placeholder="닉네임을 입력해주세요"
              value={nickname}
              onChangeText={setNickname}
              error={errors.nickname}
              maxLength={20}
            />
          </View>

          <View style={styles.section}>
            <Input
              label="자기소개"
              placeholder="자신을 소개해주세요"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.textArea}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>보유 스킬</Text>
            <View style={styles.skillInputRow}>
              <View style={styles.skillInputWrapper}>
                <Input
                  placeholder="스킬 추가"
                  value={newSkill}
                  onChangeText={setNewSkill}
                  onSubmitEditing={addSkill}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => removeSkill(skill)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color={colors.gray[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title="저장하기"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.gray[900],
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[200],
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subtitle2,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.sm,
  },
  charCount: {
    ...typography.caption,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  skillInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  skillInputWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addSkillButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  skillText: {
    ...typography.body2,
    color: colors.gray[700],
    marginRight: spacing.xs,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});

export default ProfileEditScreen;
