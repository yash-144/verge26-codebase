import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { THEME } from '../constants/Theme';

interface VergeAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface VergeAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: VergeAlertButton[];
  onClose: () => void;
}

export const VergeAlert = ({ visible, title, message, buttons, onClose }: VergeAlertProps) => {
  const defaultButtons: VergeAlertButton[] = buttons || [{ text: 'OK', onPress: onClose }];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title.toUpperCase()}</Text>
          </View>
          
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {defaultButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'destructive' && styles.destructiveButton,
                  defaultButtons.length > 2 && styles.verticalButton
                ]}
                onPress={() => {
                  if (button.onPress) button.onPress();
                  onClose();
                }}
              >
                <Text style={[
                  styles.buttonText,
                  button.style === 'cancel' && styles.cancelButtonText,
                  button.style === 'destructive' && styles.destructiveButtonText
                ]}>
                  {button.text.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#0F0F0F',
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 24,
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 30,
    height: 3,
    backgroundColor: THEME.colors.border,
    borderRadius: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  verticalButton: {
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.text,
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  cancelButtonText: {
    color: THEME.colors.textMuted,
  },
  destructiveButton: {
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  destructiveButtonText: {
    color: THEME.colors.danger,
  },
});
