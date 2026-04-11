import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme';

type AlertConfig = {
  title: string;
  message?: string;
  isConfirm: boolean;
  onOk: () => void;
  onCancel?: () => void;
  okLabel?: string;
  cancelLabel?: string;
};

// Global trigger — set by CustomAlertProvider on mount
let _trigger: ((config: AlertConfig) => void) | null = null;

export function _registerTrigger(fn: (config: AlertConfig) => void) {
  _trigger = fn;
}

/** Show a simple alert with "Comunidade do Redentor" as the header */
export function triggerAlert(title: string, message?: string): void {
  _trigger?.({ title, message, isConfirm: false, onOk: () => {} });
}

/** Show a confirm dialog — calls onConfirm if the user clicks the positive button */
export function triggerConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  okLabel = 'Confirmar',
  cancelLabel = 'Cancelar'
): void {
  _trigger?.({
    title,
    message,
    isConfirm: true,
    onOk: onConfirm,
    onCancel: () => {},
    okLabel,
    cancelLabel,
  });
}

/** Wrap your app with this provider at the root level */
export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    _registerTrigger((c) => setConfig(c));
    return () => {
      _trigger = null;
    };
  }, []);

  const dismiss = () => setConfig(null);

  return (
    <>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={!!config}
        onRequestClose={dismiss}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.appName}>Comunidade do Redentor</Text>
            {config?.title ? (
              <Text style={styles.title}>{config.title}</Text>
            ) : null}
            {config?.message ? (
              <Text style={styles.message}>{config.message}</Text>
            ) : null}
            <View style={styles.btns}>
              {config?.isConfirm && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => {
                    const cancel = config.onCancel;
                    dismiss();
                    cancel?.();
                  }}
                >
                  <Text style={styles.btnCancelText}>
                    {config.cancelLabel ?? 'Cancelar'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btn, styles.btnOk]}
                onPress={() => {
                  const ok = config?.onOk;
                  dismiss();
                  ok?.();
                }}
              >
                <Text style={styles.btnOkText}>
                  {config?.okLabel ?? 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 22,
    width: '100%',
    maxWidth: 340,
  },
  appName: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  btns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  btnOk: { backgroundColor: Colors.primary },
  btnOkText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
