import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;

function NotificationItem({ item, onMarkRead }: { item: Notification; onMarkRead: (id: string) => void }) {
  const getIcon = () => {
    switch(item.type) {
      case 'gig': return '💼';
      case 'trust': return '📈';
      case 'wallet': return '💰';
      default: return '⚙️';
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Pressable 
      onPress={() => onMarkRead(item.id)}
      style={[styles.item, !item.read && styles.itemUnread]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getIcon()}</Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.time}>{getTimeAgo(item.timestamp)}</Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllAsRead}>
            <Text style={styles.clearBtn}>Clear</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        ) : (
          notifications.map(item => (
            <NotificationItem 
              key={item.id} 
              item={item} 
              onMarkRead={markAsRead} 
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: C.textPrimary },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  clearBtn: {
    color: C.brand,
    fontSize: Typography.size.sm,
    fontWeight: 'bold',
  },

  scrollContent: { paddingVertical: Spacing[2] },
  
  item: {
    flexDirection: 'row',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: C.background,
  },
  itemUnread: {
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[4],
    position: 'relative',
  },
  icon: { fontSize: 24 },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.gold[500],
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  content: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: C.textSecondary,
  },
  titleUnread: {
    color: C.textPrimary,
    fontWeight: Typography.weight.bold,
  },
  time: {
    fontSize: 10,
    color: C.textMuted,
  },
  body: {
    fontSize: Typography.size.xs,
    color: C.textSecondary,
    lineHeight: 18,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: { fontSize: 60, marginBottom: Spacing[4] },
  emptyText: {
    fontSize: Typography.size.md,
    color: C.textMuted,
    fontWeight: Typography.weight.medium,
  },
});
