import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Usage {
  user_id: string;
  total_conversations: number;
  total_messages: number;
  total_ai_responses: number;
}

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('session_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

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
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/conversations`, {
        headers,
      });
      
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUsage = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/usage`, {
        headers,
      });
      
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/conversations`, {
        method: 'POST',
        headers,
      });
      
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      
      const data = await response.json();
      setSidebarVisible(false);
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
              const headers = await getAuthHeaders();
              await fetch(`${BACKEND_URL}/api/conversations/${id}`, {
                method: 'DELETE',
                headers,
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => {
        setSidebarVisible(false);
        router.push(`/chat/${item.id}`);
      }}
      onLongPress={() => deleteConversation(item.id)}
    >
      <View style={styles.conversationIconContainer}>
        <Ionicons name="chatbubble-outline" size={18} color="#666" />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationMeta}>
          {item.message_count} messages · {format(new Date(item.updated_at), 'MMM d')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Clean & Minimal */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>NeoChat</Text>
        
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={createNewChat}
        >
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Empty State dengan Suggestion Chips */}
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>What can I help with?</Text>
          
          <View style={styles.suggestionsContainer}>
            <TouchableOpacity style={styles.suggestionChip} onPress={createNewChat}>
              <Ionicons name="create-outline" size={20} color="#666" />
              <Text style={styles.suggestionText}>Start a conversation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.suggestionChip} onPress={createNewChat}>
              <Ionicons name="bulb-outline" size={20} color="#666" />
              <Text style={styles.suggestionText}>Ask me anything</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListHeaderComponent={
            <Text style={styles.listHeader}>Recent Conversations</Text>
          }
        />
      )}

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <TouchableOpacity
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={() => setSidebarVisible(false)}
        >
          <View style={styles.sidebar} onStartShouldSetResponder={() => true}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>Menu</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* User Profile */}
            <View style={styles.userProfile}>
              {user.picture && (
                <Image source={{ uri: user.picture }} style={styles.userAvatar} />
              )}
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>

            {/* Stats */}
            {usage && (
              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{usage.total_conversations}</Text>
                  <Text style={styles.statLabel}>Conversations</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{usage.total_messages}</Text>
                  <Text style={styles.statLabel}>Messages</Text>
                </View>
              </View>
            )}

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <TouchableOpacity style={styles.menuItem} onPress={createNewChat}>
                <Ionicons name="add-circle-outline" size={22} color="#000" />
                <Text style={styles.menuItemText}>New Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
                <Ionicons name="settings-outline" size={22} color="#000" />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#d00" />
                <Text style={[styles.menuItemText, { color: '#d00' }]}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Conversations List in Sidebar */}
            <View style={styles.sidebarConversations}>
              <Text style={styles.sidebarSectionTitle}>Your Chats</Text>
              <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Action Button */}
      {conversations.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={createNewChat}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    marginBottom: 32,
    textAlign: 'center',
  },
  suggestionsContainer: {
    width: '100%',
    gap: 12,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  conversationMeta: {
    fontSize: 13,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  sidebar: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: '#000',
  },
  sidebarConversations: {
    flex: 1,
    paddingTop: 12,
  },
  sidebarSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
