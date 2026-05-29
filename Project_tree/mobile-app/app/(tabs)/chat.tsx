import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { chatService } from '../../src/services/chatService';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  data?: any[];
  type?: string;
}

const MemberCard = ({ member }: { member: any }) => {
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberCardHeader}>
        <Text style={styles.memberName}>{member.hoTen}</Text>
        <Text style={styles.memberIcon}>{member.gioiTinh === 1 ? '👨' : (member.gioiTinh === 0 ? '👩' : '')}</Text>
      </View>
      <View style={styles.divider} />
      {member.ngaySinh && (
        <Text style={styles.memberDetail}>🎂 Sinh năm: {new Date(member.ngaySinh).getFullYear()}</Text>
      )}
      {member.ngheNghiep && (
        <Text style={styles.memberDetail}>💼 Nghề nghiệp: {member.ngheNghiep}</Text>
      )}
      {member.doiThuoc && (
        <Text style={styles.memberDetail}>🌳 Đời thứ: {member.doiThuoc}</Text>
      )}
      {(member.tenCha || member.tenMe) && (
        <Text style={styles.memberDetail}>
          👪 Bố mẹ: {member.tenCha || '---'} & {member.tenMe || '---'}
        </Text>
      )}
      {member.tenVoChong && (
        <Text style={styles.memberDetail}>💍 Vợ/Chồng: {member.tenVoChong}</Text>
      )}
    </View>
  );
};

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của gia phả. Bạn có thể hỏi tôi về thành viên, sự kiện, tài chính...',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<any>(null);

  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const questions = await chatService.getQuickQuestions();
      if (questions) setQuickQuestions(questions);
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(
        textToSend,
        user?.dongHoId || ''
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
        isUser: false,
        timestamp: new Date(),
        data: response.data,
        type: response.type,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Lỗi: ${error.message || 'Không thể kết nối với server'}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userText : styles.botText,
          ]}
        >
          {item.text}
        </Text>
        
        {item.data && item.data.length > 0 && (
          <View style={styles.cardsContainer}>
            {item.data.map((member, index) => (
              <MemberCard key={index} member={member} />
            ))}
          </View>
        )}

        <Text
          style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.botTimestamp,
          ]}
        >
          {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header đẹp với gradient */}
      <LinearGradient colors={['#7B1F00', '#B83400']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="robot-outline" size={32} color="#D4AF37" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Trợ Lý AI</Text>
            <Text style={styles.headerSubtitle}>Hỏi đáp về gia phả</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B2500" />
            <Text style={styles.loadingText}>Đang suy nghĩ...</Text>
          </View>
        )}

        {quickQuestions.length > 0 && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickQuestionsContainer}>
              {quickQuestions.map((q, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.quickQuestionChip} 
                  onPress={() => handleQuickQuestion(q)}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#8B2500" />
                  <Text style={styles.quickQuestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về gia phả..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!loading}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <MaterialCommunityIcons
              name="send"
              size={24}
              color={!inputText.trim() || loading ? '#ccc' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7B1F00',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#F9F5EC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '90%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#8B2500', // Đỏ mận
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6D5B8', // Viền vàng đồng nhạt
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#3E2723', // Nâu đậm đen
  },
  cardsContainer: {
    marginTop: 12,
    gap: 8,
  },
  memberCard: {
    backgroundColor: '#FFF9E6', // Nền vàng nhạt hoàng gia
    borderWidth: 1,
    borderColor: '#D4AF37', // Vàng đồng
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B2500',
  },
  memberIcon: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D5B8',
    marginBottom: 8,
  },
  memberDetail: {
    fontSize: 13,
    color: '#5D4037',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#999',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  quickQuestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickQuestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    marginRight: 8,
    shadowColor: '#8B2500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quickQuestionText: {
    color: '#8B2500',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6D5B8',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9F5EC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#3E2723',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B2500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D7CCC8',
  },
});
