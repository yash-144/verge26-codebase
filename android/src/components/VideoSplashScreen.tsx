import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';

interface VideoSplashScreenProps {
  onFinish: () => void;
}

export const VideoSplashScreen = ({ onFinish }: VideoSplashScreenProps) => {
  const player = useVideoPlayer(require('../../assets/splash.mp4'), (p) => {
    p.play();
    p.loop = false;
    p.muted = true;
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      onFinish();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
});
