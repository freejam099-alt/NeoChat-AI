import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Usage {
  total_conversations: number;
  total_messages: number;
  total_ai_responses: number;
}

export default function Index() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadConversations(), loadUsage()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/conversations`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUsage = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/usage`);
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const createNewChat = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/conversations`, {
        method: 'POST',
      });
      const data = await response.json();
      router.push(`/chat/${data.conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  const deleteConversation = async (id: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BACKEND_URL}/api/conversations/${id}`, {
                method: 'DELETE',
              });
              await loadData();
            } catch (error) {
              console.error('Error deleting conversation:', error);
            }
          },
        },
      ]
    );
  };

  const clearAllChats = () => {
    Alert.alert(
      'Clear All Chats',
      'Are you sure you want to delete all conversations? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BACKEND_URL}/api/conversations/clear/all`, {
                method: 'DELETE',
              });
              await loadData();
            } catch (error) {
              console.error('Error clearing conversations:', error);
            }
          },
        },
      ]
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => router.push(`/chat/${item.id}`)}
      onLongPress={() => deleteConversation(item.id)}
    >
      <View style={styles.neonBorder} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#00d9ff" />
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text style={styles.messageCount}>
            {item.message_count} messages
          </Text>
          <Text style={styles.timestamp}>
            {format(new Date(item.updated_at), 'MMM d, HH:mm')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
        <Text style={styles.loadingText}>Loading NeoChat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#00d9ff', '#0066ff']}
              style={styles.logoGradient}
            >
              <Ionicons name="flash" size={24} color="#0a0a0f" />
            </LinearGradient>
            <Text style={styles.headerTitle}>NeoChat</Text>
          </View>
          {conversations.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllChats}
            >
              <Ionicons name="trash-outline" size={20} color="#ff0066" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Usage Stats */}
      {usage && (
        <View style={styles.statsContainer}>
          <View style={styles.neonBorder} />
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{usage.total_conversations}</Text>
              <Text style={styles.statLabel}>Chats</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{usage.total_messages}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{usage.total_ai_responses}</Text>
              <Text style={styles.statLabel}>AI Replies</Text>
            </View>
          </View>
        </View>
      )}

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#1a1a2e" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new chat to begin talking with AI
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}

      {/* New Chat Button */}
      <TouchableOpacity style={styles.newChatButton} onPress={createNewChat}>
        <LinearGradient
          colors={['#00d9ff', '#0066ff']}
          style={styles.newChatGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="#0a0a0f" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00d9ff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginLeft: 12,
    textShadowColor: '#00d9ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  clearButton: {
    padding: 8,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
  },
  neonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00d9ff',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  statsContent: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2a2a3e',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  conversationCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
  },
  conversationContent: {
    padding: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  newChatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  newChatGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});