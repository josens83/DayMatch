import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { restoreAuth } from '../store/slices/authSlice';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { colors } from '../theme';

// Screens
import JobDetailScreen from '../screens/job/JobDetailScreen';
import JobCreateScreen from '../screens/job/JobCreateScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileEditScreen from '../screens/profile/ProfileEditScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import ApplicationListScreen from '../screens/application/ApplicationListScreen';

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  JobDetail: { jobId: string };
  JobCreate: undefined;
  JobEdit: { jobId: string };
  ChatRoom: {
    chatRoomId?: string;
    jobId: string;
    otherUser: {
      id: string;
      nickname: string;
      profileImage?: string;
    };
  };
  Notifications: undefined;
  ProfileEdit: undefined;
  UserProfile: { userId: string };
  Payment: { matchId: string };
  PaymentDetail: { paymentId: string };
  ApplicationList: { jobId: string };
  ApplicationDetail: { applicationId: string };
  MatchDetail: { matchId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="JobDetail"
              component={JobDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="JobCreate"
              component={JobCreateScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="JobEdit"
              component={JobCreateScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="ChatRoom"
              component={ChatRoomScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ApplicationList"
              component={ApplicationListScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
