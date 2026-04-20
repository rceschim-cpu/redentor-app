import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { View } from 'react-native';

import RootNavigator from './src/navigation';
import { AuthProvider } from './src/context/AuthContext';
import { FontScaleProvider } from './src/context/FontScaleContext';
import { CustomAlertProvider } from './src/utils/customAlert';
import { BannersProvider } from './src/context/BannersContext';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <FontScaleProvider>
        <CustomAlertProvider>
          <BannersProvider>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <NavigationContainer>
                <StatusBar style="light" />
                <RootNavigator />
              </NavigationContainer>
            </View>
          </BannersProvider>
        </CustomAlertProvider>
      </FontScaleProvider>
    </AuthProvider>
  );
}
