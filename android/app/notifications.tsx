import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore, NotificationItem } from '../src/store/useNotificationStore';
import { THEME } from '../src/constants/Theme';
import { VergeHeader } from '../src/components/VergeHeader';
import { format } from 'date-fns';

export default function NotificationsScreen() {
  const { notifications, markAsRead, clearAll, markAllAsRead } = useNotificationStore();

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => b.date - a.date);
  }, [notifications]);

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.read ? "notifications-outline" : "notifications"}
          size={20}
          color={item.read ? THEME.colors.textMuted : THEME.colors.accent}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.date}>{format(item.date, 'MMM dd, HH:mm')}</Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <VergeHeader 
        title="ALERTS" 
        rightElement={
          notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
              <Text style={styles.clearText}>CLEAR ALL</Text>
            </TouchableOpacity>
          )
        }
      />
      
      {notifications.length > 0 ? (
        <View style={{ flex: 1 }}>
           <View style={styles.actionsBar}>
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.actionText}>MARK ALL AS READ</Text>
              </TouchableOpacity>
           </View>
          <FlatList
            data={sortedNotifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={THEME.colors.border} />
          <Text style={styles.emptyText}>NO ALERTS LOGGED</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  unreadItem: {
    borderColor: THEME.colors.accentBorder,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    fontFamily: THEME.fonts.primaryBold,
  },
  unreadText: {
    color: THEME.colors.accent,
  },
  date: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  body: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontFamily: THEME.fonts.primaryBold,
    letterSpacing: 2,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    fontSize: 10,
    color: THEME.colors.danger,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 10,
    color: THEME.colors.accent,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
