import { Alert, Platform } from 'react-native';
import { triggerAlert, triggerConfirm } from './customAlert';

/** Show an alert — on web uses custom in-app modal, on native uses Alert.alert */
export function showAlert(title: string, msg?: string): void {
  if (Platform.OS === 'web') {
    triggerAlert(title, msg);
  } else {
    Alert.alert(title, msg);
  }
}

/**
 * Show a confirm dialog — calls onConfirm if the user presses the positive button.
 * On web uses the custom in-app modal (shows "Comunidade do Redentor" header).
 * On native uses Alert.alert with Cancel / okLabel buttons.
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  okLabel = 'Confirmar'
): void {
  if (Platform.OS === 'web') {
    triggerConfirm(title, message, onConfirm, okLabel);
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: okLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
