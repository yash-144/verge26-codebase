import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const THEME = {
  accent: '#FF6B00',
  text: '#FFFFFF',
  textMuted: '#888888',
};

export const Countdown = memo(() => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2026-03-13T00:00:00');
    
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const Unit = ({ value, label }: { value: number, label: string }) => (
    <View style={styles.countdownUnit}>
      <Text style={styles.countdownValue}>{value.toString().padStart(2, '0')}</Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.countdownContainer}>
      <Unit value={timeLeft.days} label="DAYS" />
      <Text style={styles.countdownSeparator}>:</Text>
      <Unit value={timeLeft.hours} label="HRS" />
      <Text style={styles.countdownSeparator}>:</Text>
      <Unit value={timeLeft.minutes} label="MIN" />
      <Text style={styles.countdownSeparator}>:</Text>
      <Unit value={timeLeft.seconds} label="SEC" />
    </View>
  );
});

const styles = StyleSheet.create({
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 40,
  },
  countdownValue: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 16,
    color: THEME.text,
    letterSpacing: 1,
  },
  countdownLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  countdownSeparator: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    color: THEME.textMuted,
    marginBottom: 10,
    opacity: 0.5,
  },
});
