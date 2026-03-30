import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import {
  MembersListScreen,
  MemberDetailScreen,
  AddMemberScreen,
} from '../screens/MembersScreens';
import { GroupsListScreen, GroupDetailScreen } from '../screens/GroupsScreens';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MembersStack = createNativeStackNavigator();
const GroupsStack = createNativeStackNavigator();

function MembersNavigator() {
  return (
    <MembersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Lora_600SemiBold', fontSize: 17 },
        headerBackTitle: '',
      }}
    >
      <MembersStack.Screen name="MembersList" component={MembersListScreen} options={{ title: 'Membros' }} />
      <MembersStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Perfil do Membro' }} />
      <MembersStack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'Novo Membro' }} />
    </MembersStack.Navigator>
  );
}

function GroupsNavigator() {
  return (
    <GroupsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Lora_600SemiBold', fontSize: 17 },
        headerBackTitle: '',
      }}
    >
      <GroupsStack.Screen name="GroupsList" component={GroupsListScreen} options={{ title: 'Pequenos Grupos' }} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Detalhes do Grupo' }} />
    </GroupsStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⌂',
    Members: '●●',
    Groups: '▲',
    Profile: '◎',
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
          backgroundColor: '#fff',
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
        tabBarInactiveTintColor: Colors.textMuted,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Início', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff', headerShown: false }} />
      <Tab.Screen name="Members" component={MembersNavigator} options={{ title: 'Membros' }} />
      <Tab.Screen name="Groups" component={GroupsNavigator} options={{ title: 'Grupos' }} />
      <Tab.Screen name="Profile" component={DashboardScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Main" component={MainTabs} />
    </RootStack.Navigator>
  );
}
