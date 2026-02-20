import React from 'react';
import { VergeAlert } from './VergeAlert';
import { useAlertStore } from '../store/useAlertStore';

export const GlobalAlert = () => {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();

  return (
    <VergeAlert
      visible={visible}
      title={title}
      message={message}
      buttons={buttons}
      onClose={hideAlert}
    />
  );
};
