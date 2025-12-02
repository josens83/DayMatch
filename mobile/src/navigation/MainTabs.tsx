import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import MyPageScreen from '../screens/main/MyPageScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import { colors, typography } from '../theme';

export type MainTabsParamList = {
  Home: undefined;
  Search: { categoryId?: string };
  Create: undefined;
  ChatList: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Create button that navigates to JobCreate screen
const CreateTabButton: React.FC<{ children: React.ReactNode; onPress?: () => void }> = ({
  children,
  onPress,
}) => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.createButton}
      onPress={() => navigation.navigate('JobCreate')}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
};

const EmptyComponent = () => null;

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({
  icon,
  focused,
}) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
);

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          ...typography.h4,
          color: colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: '검색',
          headerTitle: '일자리 검색',
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={EmptyComponent}
        options={{
          title: '등록',
          tabBarIcon: ({ focused }) => <TabIcon icon="➕" focused={focused} />,
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          title: '채팅',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: '마이',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 22,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  createButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainTabs;
