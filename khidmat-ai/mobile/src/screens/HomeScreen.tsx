import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, Chip, Text, ActivityIndicator, FAB } from 'react-native-paper';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';
import { colors } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const store = useAppStore();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);

  // Initial welcome message
  useEffect(() => {
    if (store.messages.length === 0) {
      store.addMessage({
        id: 'msg-0',
        role: 'agent',
        text: 'Welcome to KhidmatAI! What service do you need today? (e.g. "Mujhe kal subah G-13 mein AC technician chahiye")',
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    store.addMessage(userMsg);
    setInputText('');
    store.setProcessing(true);

    try {
      const lat = store.userLocation?.lat || 33.6844;
      const lng = store.userLocation?.lng || 73.0479;
      
      const response = await api.sendRequest(userMsg.text, lat, lng, store.userId);
      
      if (response.booking) {
        store.setBooking(response.booking);
        store.addMessage({
          id: `msg-${Date.now() + 1}`,
          role: 'agent',
          text: response.booking.confirmation_message || "Your booking has been processed successfully.",
          timestamp: new Date().toISOString()
        });
      }
      
      store.setAgentTrace(response.agent_trace || []);
    } catch (error: any) {
      store.addMessage({
        id: `msg-${Date.now() + 1}`,
        role: 'agent',
        text: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      store.setProcessing(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}>
        <Text style={{ color: isUser ? '#fff' : colors.textPrimary }}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.chipContainer}>
        <Chip mode="outlined" style={styles.chip}>🇵🇰 اردو</Chip>
        <Chip mode="outlined" style={styles.chip}>Roman</Chip>
        <Chip mode="outlined" style={styles.chip}>EN</Chip>
      </View>

      <FlatList
        ref={flatListRef}
        data={store.messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {store.isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator animating={true} color={colors.brandPrimary} />
          <Text style={styles.processingText}>Processing request...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          style={styles.input}
          placeholder="Type your request..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          outlineColor="transparent"
          activeOutlineColor={colors.brandPrimary}
        />
        <IconButton
          icon="send"
          iconColor={colors.brandPrimary}
          size={24}
          onPress={handleSend}
          disabled={!inputText.trim() || store.isProcessing}
        />
      </View>

      {store.agentTrace.length > 0 && !store.isProcessing && (
        <FAB
          style={styles.fab}
          icon="eye"
          label="View Agent Trace"
          onPress={() => navigation.navigate('AgentTrace')}
          color="#fff"
        />
      )}
      
      {store.booking && !store.isProcessing && (
        <FAB
          style={styles.fabBook}
          icon="check-circle"
          label="View Receipt"
          onPress={() => navigation.navigate('BookingReceipt')}
          color="#fff"
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBg },
  chipContainer: { flexDirection: 'row', justifyContent: 'center', padding: 10, gap: 10 },
  chip: { backgroundColor: '#fff' },
  listContent: { padding: 16, paddingBottom: 100 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.brandPrimary, borderBottomRightRadius: 4 },
  agentBubble: { alignSelf: 'flex-start', backgroundColor: '#e0e0e0', borderBottomLeftRadius: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  input: { flex: 1, backgroundColor: '#fff' },
  processingContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'center' },
  processingText: { marginLeft: 8, color: colors.textSecondary },
  fab: { position: 'absolute', margin: 16, right: 0, top: 50, backgroundColor: colors.brandWarning },
  fabBook: { position: 'absolute', margin: 16, left: 0, bottom: 80, backgroundColor: colors.brandSecondary },
});
