import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { KidsListScreen, KidsDetailScreen, AddKidScreen } from '../screens/KidsScreens';
import KidsAttendanceScreen from '../screens/KidsAttendanceScreen';
import {
  MinistriesListScreen,
  MinistryDetailScreen,
  MinistryEditScreen,
  AddMinistryScreen,
} from '../screens/MinistriesScreens';
import AddScheduleScreen from '../screens/AddScheduleScreen';

const RootStack  = createNativeStackNavigator();
const Tab        = createBottomTabNavigator();
const HomeStack  = createNativeStackNavigator();
const MembStack  = createNativeStackNavigator();
const GroupStack = createNativeStackNavigator();
const CelebStack = createNativeStackNavigator();

// ─── Estilos de header compartilhados ─────────────────────────────────────────
const headerStyle = {
  headerStyle: { backgroundColor: Colors.headerBg },
  headerTintColor: Colors.headerText as string,
  headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.headerText },
  headerBackTitle: '',
};

// Botão de voltar manual — para telas que são raiz do seu stack dentro da tab
function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ paddingHorizontal: Platform.OS === 'ios' ? 8 : 4 }}
    >
      <Ionicons
        name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
        size={24}
        color={Colors.headerText}
      />
    </TouchableOpacity>
  );
}

type IoniconName = keyof typeof Ionicons.glyphMap;

// ─── Ícones das tabs ───────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  HomeTab:        { active: 'home',    inactive: 'home-outline' },
  MembersTab:     { active: 'person',  inactive: 'person-outline' },
  SmallGroupsTab: { active: 'people',  inactive: 'people-outline' },
  CelebrationTab: { active: 'star',    inactive: 'star-outline' },
};

// ─── Stack do Dashboard (tab Início) ──────────────────────────────────────────
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={headerStyle}>
      <HomeStack.Screen name="Dashboard"     component={DashboardScreen}   options={{ headerShown: false }} />
      <HomeStack.Screen name="Events"        component={EventsScreen}       options={{ title: 'Agenda' }} />
      <HomeStack.Screen name="Cultos"        component={CultosScreen}       options={{ title: 'Cultos' }} />
      <HomeStack.Screen name="Parking"       component={ParkingScreen}      options={{ title: 'Estacionamento' }} />
      <HomeStack.Screen name="Profile"       component={ProfileScreen}      options={{ title: 'Meu Perfil' }} />
      <HomeStack.Screen name="Users"         component={UsersScreen}        options={{ title: 'Usuários' }} />
      <HomeStack.Screen name="Settings"      component={SettingsScreen}     options={{ title: 'Configurações' }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificações' }} />
      <HomeStack.Screen name="Banners"       component={BannersScreen}      options={{ title: 'Banners da Home' }} />
      <HomeStack.Screen name="Bible"         component={BibleScreen}        options={{ title: 'Bíblia' }} />
      <HomeStack.Screen name="KidsList"      component={KidsListScreen}     options={{ title: 'Redentor Kids' }} />
      <HomeStack.Screen name="KidsDetail"    component={KidsDetailScreen}   options={{ title: '' }} />
      <HomeStack.Screen name="AddKid"        component={AddKidScreen}       options={{ title: 'Nova Criança' }} />
      <HomeStack.Screen name="KidsAttendance" component={KidsAttendanceScreen} options={{ title: 'Chamada do Dia' }} />
      <HomeStack.Screen name="MemberDetail"  component={MemberDetailScreen} options={{ title: '' }} />
      <HomeStack.Screen name="GroupDetail"   component={GroupDetailScreen}  options={{ title: '' }} />
      <HomeStack.Screen name="Ministries"    component={MinistriesListScreen} options={{ title: 'Ministérios' }} />
      <HomeStack.Screen name="MinistryDetail" component={MinistryDetailScreen} options={{ title: '' }} />
      <HomeStack.Screen name="MinistryEdit"  component={MinistryEditScreen} options={{ title: 'Editar Ministério' }} />
      <HomeStack.Screen name="AddMinistry"   component={AddMinistryScreen}  options={{ title: 'Novo Ministério' }} />
      <HomeStack.Screen name="AddSchedule"   component={AddScheduleScreen}  options={{ title: 'Nova Escala' }} />
    </HomeStack.Navigator>
  );
}

// ─── Stack de Membros ──────────────────────────────────────────────────────────
function MembersStackScreen() {
  return (
    <MembStack.Navigator screenOptions={headerStyle}>
      <MembStack.Screen
        name="MembersList"
        component={MembersListScreen}
        options={({ navigation }) => ({
          title: 'Membros',
          headerLeft: () => <BackBtn onPress={() => navigation.navigate('HomeTab')} />,
        })}
      />
      <MembStack.Screen name="MemberDetail"  component={MemberDetailScreen} options={{ title: '' }} />
      <MembStack.Screen name="AddMember"     component={AddMemberScreen}    options={{ title: 'Novo Membro' }} />
      <MembStack.Screen name="KidsList"      component={KidsListScreen}     options={{ title: 'Redentor Kids' }} />
      <MembStack.Screen name="KidsDetail"    component={KidsDetailScreen}   options={{ title: '' }} />
      <MembStack.Screen name="AddKid"        component={AddKidScreen}       options={{ title: 'Nova Criança' }} />
      <MembStack.Screen name="KidsAttendance" component={KidsAttendanceScreen} options={{ title: 'Chamada do Dia' }} />
    </MembStack.Navigator>
  );
}

// ─── Stack de Pequenos Grupos ──────────────────────────────────────────────────
function GroupsStackScreen() {
  return (
    <GroupStack.Navigator screenOptions={headerStyle}>
      <GroupStack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={({ navigation }) => ({
          title: 'Pequenos Grupos',
          headerLeft: () => <BackBtn onPress={() => navigation.navigate('HomeTab')} />,
        })}
      />
      <GroupStack.Screen name="GroupDetail"         component={GroupDetailScreen}          options={{ title: '' }} />
      <GroupStack.Screen name="AddGroup"            component={AddGroupScreen}             options={{ title: 'Novo Grupo' }} />
      <GroupStack.Screen name="GroupMemberRequests" component={GroupMemberRequestsScreen}  options={{ title: 'Solicitações' }} />
      <GroupStack.Screen name="GroupMaterials"      component={GroupMaterialsScreen}       options={{ title: 'Materiais' }} />
      <GroupStack.Screen name="MemberDetail"        component={MemberDetailScreen}         options={{ title: '' }} />
    </GroupStack.Navigator>
  );
}

// ─── Stack de 160 Anos ────────────────────────────────────────────────────────
function CelebrationStackScreen() {
  return (
    <CelebStack.Navigator screenOptions={headerStyle}>
      <CelebStack.Screen
        name="Celebration"
        component={CelebrationScreen}
        options={({ navigation }) => ({
          title: '160 Anos',
          headerLeft: () => <BackBtn onPress={() => navigation.navigate('HomeTab')} />,
        })}
      />
    </CelebStack.Navigator>
  );
}

// ─── Tab Navigator principal ───────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EEEEEE',
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: 'Inter_600SemiBold',
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={24}
              color={focused ? '#E7C530' : Colors.textSecondary}
            />
          );
        },
        tabBarActiveTintColor: '#E7C530',
        tabBarInactiveTintColor: Colors.textSecondary,
      })}
    >
      <Tab.Screen name="HomeTab"        component={HomeStackScreen}        options={{ title: 'Início' }} />
      <Tab.Screen name="MembersTab"     component={MembersStackScreen}     options={{ title: 'Membros' }} />
      <Tab.Screen name="SmallGroupsTab" component={GroupsStackScreen}      options={{ title: 'Grupos' }} />
      <Tab.Screen name="CelebrationTab" component={CelebrationStackScreen} options={{ title: '160 Anos' }} />
    </Tab.Navigator>
  );
}

// ─── Navigator raiz ───────────────────────────────────────────────────────────
function AppNavigator() {
  return <MainTabs />;
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
