import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../theme';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CelebrationScreen from '../screens/CelebrationScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import UsersScreen from '../screens/UsersScreen';
import AddGroupScreen from '../screens/AddGroupScreen';
import CultosScreen from '../screens/CultosScreen';
import ParkingScreen from '../screens/ParkingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventsScreen from '../screens/EventsScreen';
import GroupMemberRequestsScreen from '../screens/GroupMemberRequestsScreen';
import GroupMaterialsScreen from '../screens/GroupMaterialsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BannersScreen from '../screens/BannersScreen';
import BibleScreen from '../screens/BibleScreen';
import {
  MembersListScreen,
  MemberDetailScreen,
  AddMemberScreen,
} from '../screens/MembersScreens';
import { GroupsListScreen, GroupDetailScreen } from '../screens/GroupsScreens';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AppStack = createNativeStackNavigator();

// Todas as telas compartilham o mesmo stack — garantindo botão nativo em todas
const headerStyle = {
  headerStyle: { backgroundColor: Colors.headerBg },
  headerTintColor: Colors.headerText as string,
  headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.headerText },
  headerBackTitle: '',
};

// Botão de voltar idêntico ao nativo — mesma cor do headerTintColor, mesmo peso
function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ paddingRight: Platform.OS === 'ios' ? 6 : 4 }}
    >
      <Text style={{ fontSize: 32, lineHeight: 36, color: Colors.headerText, fontWeight: '200', marginTop: -2 }}>‹</Text>
    </TouchableOpacity>
  );
}

const TAB_ICONS: Record<string, string> = {
  Dashboard: '⌂',
  Members: '●●',
  SmallGroups: '▲',
  Celebration: '✦',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4, color: Colors.primary }}>
      {TAB_ICONS[name]}
    </Text>
  );
}

// Tab bar como overlay — sempre visível nas telas raiz
function MainTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.headerBg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: 'Inter_600SemiBold',
          color: Colors.textPrimary,
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen
        name="Members"
        component={MembersListScreen}
        options={{ title: 'Membros', headerShown: false }}
      />
      <Tab.Screen
        name="SmallGroups"
        component={GroupsListScreen}
        options={{ title: 'Pequenos Grupos', headerShown: false }}
      />
      <Tab.Screen
        name="Celebration"
        component={CelebrationScreen}
        options={{ title: '160 Anos', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Stack principal — todas as telas empilhadas sobre as tabs
function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={headerStyle}>
      {/* Tab root — sem header próprio */}
      <AppStack.Screen
        name="Tabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      {/* Membros */}
      <AppStack.Screen name="MembersList" component={MembersListScreen} options={{ title: 'Membros' }} />
      <AppStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: '' }} />
      <AppStack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'Novo Membro' }} />
      {/* Grupos */}
      <AppStack.Screen name="GroupsList" component={GroupsListScreen} options={{ title: 'Pequenos Grupos' }} />
      <AppStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: '' }} />
      <AppStack.Screen name="AddGroup" component={AddGroupScreen} options={{ title: 'Novo Grupo' }} />
      <AppStack.Screen name="GroupMemberRequests" component={GroupMemberRequestsScreen} options={{ title: 'Solicitações' }} />
      <AppStack.Screen name="GroupMaterials" component={GroupMaterialsScreen} options={{ title: 'Materiais' }} />
      {/* Outros */}
      <AppStack.Screen name="Events" component={EventsScreen} options={{ title: 'Agenda' }} />
      <AppStack.Screen name="Cultos" component={CultosScreen} options={{ title: 'Cultos' }} />
      <AppStack.Screen name="Parking" component={ParkingScreen} options={{ title: 'Estacionamento' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
      <AppStack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuários' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
      <AppStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificações' }} />
      <AppStack.Screen name="Banners" component={BannersScreen} options={{ title: 'Banners da Home' }} />
      <AppStack.Screen name="Bible" component={BibleScreen} options={{ title: 'Bíblia' }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, appUser, loading, isNewUser } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Login" component={LoginScreen} />
      ) : isNewUser ? (
        <RootStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      ) : (
        <RootStack.Screen name="Main" component={AppNavigator} />
      )}
    </RootStack.Navigator>
  );
}
