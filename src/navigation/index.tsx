import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import GroupMemberRequestsScreen from '../screens/GroupMemberRequestsScreen';
import {
  MembersListScreen,
  MemberDetailScreen,
  AddMemberScreen,
} from '../screens/MembersScreens';
import { GroupsListScreen, GroupDetailScreen } from '../screens/GroupsScreens';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const MembersStack = createNativeStackNavigator();
const GroupsStack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: Colors.headerBg },
  headerTintColor: Colors.headerText as string,
  headerTitleStyle: { fontFamily: 'Lora_600SemiBold', fontSize: 17, color: Colors.headerText },
  headerBackTitle: '',
};

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={headerStyle}>
      <DashboardStack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: 'Usuários' }}
      />
      <DashboardStack.Screen
        name="Cultos"
        component={CultosScreen}
        options={{ title: 'Cultos' }}
      />
      <DashboardStack.Screen
        name="Parking"
        component={ParkingScreen}
        options={{ title: 'Estacionamento' }}
      />
    </DashboardStack.Navigator>
  );
}

function MembersNavigator() {
  return (
    <MembersStack.Navigator screenOptions={headerStyle}>
      <MembersStack.Screen
        name="MembersList"
        component={MembersListScreen}
        options={({ navigation }) => ({
          title: 'Membros',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Dashboard')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 8 }}
            >
              <Text style={{ fontSize: 17, color: Colors.primary, fontWeight: '600' }}>← Início</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <MembersStack.Screen
        name="MemberDetail"
        component={MemberDetailScreen}
        options={{ title: '' }}
      />
      <MembersStack.Screen
        name="AddMember"
        component={AddMemberScreen}
        options={{ title: 'Novo Membro' }}
      />
    </MembersStack.Navigator>
  );
}

function GroupsNavigator() {
  return (
    <GroupsStack.Navigator screenOptions={headerStyle}>
      <GroupsStack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={({ navigation }) => ({
          title: 'Pequenos Grupos',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Dashboard')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 8 }}
            >
              <Text style={{ fontSize: 17, color: Colors.primary, fontWeight: '600' }}>← Início</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: '' }}
      />
      <GroupsStack.Screen
        name="AddGroup"
        component={AddGroupScreen}
        options={{ title: 'Novo Grupo' }}
      />
      <GroupsStack.Screen
        name="GroupMemberRequests"
        component={GroupMemberRequestsScreen}
        options={{ title: 'Solicitações' }}
      />
    </GroupsStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⌂',
    Members: '●●',
    SmallGroups: '▲',
    Celebration: '✦',
  };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4, color: Colors.primary }}>
      {icons[name]}
    </Text>
  );
}

function MainTabs() {
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
          fontFamily: 'SourceSans3_600SemiBold',
          color: Colors.textPrimary,
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{ title: 'Início', headerShown: false }}
      />
      <Tab.Screen
        name="Members"
        component={MembersNavigator}
        options={{ title: 'Membros' }}
      />
      <Tab.Screen
        name="SmallGroups"
        component={GroupsNavigator}
        options={{ title: 'Pequenos Grupos' }}
      />
      <Tab.Screen
        name="Celebration"
        component={CelebrationScreen}
        options={({ navigation }) => ({
          title: '160 Anos',
          headerShown: true,
          ...headerStyle,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Dashboard')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 8 }}
            >
              <Text style={{ fontSize: 17, color: Colors.primary, fontWeight: '600' }}>← Início</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, appUser, loading } = useAuth();

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
      ) : !appUser?.profileComplete ? (
        <RootStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      ) : (
        <RootStack.Screen name="Main" component={MainTabs} />
      )}
    </RootStack.Navigator>
  );
}
