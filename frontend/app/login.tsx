import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = process.env.EXPO_PUBLIC_BACKEND_URL + '/auth-callback';
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    
    Linking.openURL(authUrl);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#00d9ff', '#0066ff']}
          style={styles.logoGradient}
        >
          <Ionicons name="flash" size={60} color="#0a0a0f" />
        </LinearGradient>
        <Text style={styles.title}>NeoChat</Text>
        <Text style={styles.subtitle}>AI Chatbot with Neon Style</Text>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="chatbubbles" size={24} color="#00d9ff" />
          <Text style={styles.featureText}>Multiple Conversations</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="sparkles" size={24} color="#00d9ff" />
          <Text style={styles.featureText}>Claude Haiku AI</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="bar-chart" size={24} color="#00d9ff" />
          <Text style={styles.featureText}>Usage Tracking</Text>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleGoogleLogin}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00d9ff', '#0066ff']}
          style={styles.loginGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="logo-google" size={24} color="#0a0a0f" />
          <Text style={styles.loginText}>Sign in with Google</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Secure authentication powered by Google
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00d9ff',
    marginBottom: 8,
    textShadowColor: '#00d9ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  descriptionContainer: {
    marginBottom: 60,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 16,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  loginText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a0a0f',
    marginLeft: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});