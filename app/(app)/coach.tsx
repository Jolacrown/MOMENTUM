import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { colors, spacing, typography, radius } from '../../src/styles/theme';
import { CoachMessageBubble } from '../../src/components/CoachMessageBubble';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { sendMessageToCoach, Message } from '../../src/features/coaching/coach.service';

export default function CoachChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello TJ! Ready for today\'s small win? How is your progress on "Learn UI/UX Design" going?' }
  ]);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Mock user/goal for service call
      const mockUser: any = { name: 'TJ', skillLevel: 'Beginner' };
      const mockGoal: any = { title: 'Learn UI/UX Design', currentStreak: 5 };
      
      const response = await sendMessageToCoach(mockUser, mockGoal, userMessage, newMessages);
      
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting right now. Let\'s try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Momentum Coach</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[
            styles.messageWrapper,
            item.role === 'user' ? styles.userWrapper : styles.assistantWrapper
          ]}>
            {item.role === 'assistant' ? (
              <CoachMessageBubble content={item.content} />
            ) : (
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{item.content}</Text>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={() => isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary500} size="small" />
            <Text style={styles.loadingText}>Coach is thinking...</Text>
          </View>
        ) : null}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Talk to your coach..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBase,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size.textbase,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success500,
  },
  onlineText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[20],
  },
  messageWrapper: {
    marginBottom: spacing[16],
    width: '100%',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  assistantWrapper: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: colors.primary500,
    padding: spacing[12],
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    maxWidth: '85%',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: typography.size.textbase,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: spacing[4],
    marginBottom: spacing[20],
  },
  loadingText: {
    fontSize: typography.size.textxs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.borderBase,
    backgroundColor: colors.bgBase,
    gap: spacing[12],
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
    maxHeight: 120,
    fontSize: typography.size.textbase,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderBase,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderBase,
  },
});
