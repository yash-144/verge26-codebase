import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      
      <Tabs
        backBehavior="none"
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: 'transparent',
          },
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopColor: 'rgba(255, 255, 255, 0.15)',
            display: 'none',
          },
          tabBarActiveTintColor: '#FF6B00',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        }}>
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="merch"
          options={{
            title: 'Merch',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accommodation"
          options={{
            title: 'Stay',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'bed' : 'bed-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
});
