import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('session_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/messages/${id}`, {
        headers,
      });
      
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: id as string,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setSending(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: id,
          content: userMessage,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Replace temp message with real ones
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.id.startsWith('temp-'));
        return [...filtered, data.user_message, data.ai_message];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {format(new Date(item.timestamp), 'HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header - Clean & Minimal */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NeoChat</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>What can I help with?</Text>
          
          <View style={styles.suggestionsContainer}>
            <TouchableOpacity style={styles.suggestionChip}>
              <Ionicons name="image-outline" size={20} color="#666" />
              <Text style={styles.suggestionText}>Generate image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.suggestionChip}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <Text style={styles.suggestionText}>Summarize text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.suggestionChip}>
              <Ionicons name="analytics-outline" size={20} color="#666" />
              <Text style={styles.suggestionText}>Analyze data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.suggestionChip}>
              <Ionicons name="bulb-outline" size={20} color="#666" />
              <Text style={styles.suggestionText}>Get advice</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.neonBorderTop} />
        <View style={styles.inputContent}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#6b7280"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              editable={!sending}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            <View style={[
              styles.sendButtonGradient,
              !inputText.trim() && { backgroundColor: '#e0e0e0' }
            ]}>
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={!inputText.trim() ? '#999' : '#fff'}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#000',
  },
  aiBubble: {
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    color: '#000',
    fontSize: 15,
    minHeight: 24,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
