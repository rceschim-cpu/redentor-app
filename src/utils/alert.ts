import { Alert, Platform } from 'react-native';

export function showAlert(title: string, msg?: string) {
  const full = msg ? `${title}\n${msg}` : title;
  if (Platform.OS === 'web') {
    // @ts-ignore
    window.alert(full);
  } else {
    Alert.alert(title, msg);
  }
}
