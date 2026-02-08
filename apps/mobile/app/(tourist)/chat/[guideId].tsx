// Ruta Segura Perú - Chat with Guide Screen
import { Colors, Spacing } from '@/src/constants/theme';
import { httpClient } from '@/src/core/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatWithGuide() {
    const { guideId } = useLocalSearchParams();
    const [message, setMessage] = useState('');
    const [translating, setTranslating] = useState(false);
    const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});

    const guide = { name: 'Maria Santos', status: 'Online', avatar: 'M' };

    const messages = [
        { id: '1', sender: 'guide', text: '¡Hola! Welcome! I\'m Maria, your guide for the Machu Picchu tour. How can I help you?', time: '10:30 AM' },
        { id: '2', sender: 'user', text: 'Hi Maria! I have a question about the tour schedule.', time: '10:31 AM' },
        { id: '3', sender: 'guide', text: 'Of course! We\'ll meet at 5:30 AM at the hotel lobby. The bus leaves at 6:00 AM sharp. Don\'t forget to bring warm clothes!', time: '10:32 AM' },
        { id: '4', sender: 'user', text: 'Perfect, thank you! Should I bring my own water?', time: '10:33 AM' },
        { id: '5', sender: 'guide', text: 'Water bottles are provided, but you can bring your own reusable bottle too. We\'ll have refill stations along the way 🚰', time: '10:34 AM' },
    ];

    const sendMessage = () => {
        if (!message.trim()) return;
        setMessage('');
    };

    const handleTranslate = async () => {
        const lastGuideMessage = [...messages].reverse().find(m => m.sender === 'guide');
        if (!lastGuideMessage) return;

        setTranslating(true);
        try {
            const response = await httpClient.post<{ translated_text?: string }>('/ai/translate', {
                text: lastGuideMessage.text,
                target_language: 'es',
                source_language: 'en',
            });

            if (response.data?.translated_text) {
                setTranslatedTexts(prev => ({
                    ...prev,
                    [lastGuideMessage.id]: response.data!.translated_text!,
                }));
            }
        } catch (error) {
            console.error('Translation failed', error);
            Alert.alert('Error', 'No se pudo traducir el mensaje');
        } finally {
            setTranslating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
                <View style={styles.guideInfo}>
                    <View style={styles.guideAvatar}><Text style={styles.guideInitial}>{guide.avatar}</Text><View style={styles.onlineDot} /></View>
                    <View>
                        <Text style={styles.guideName}>{guide.name}</Text>
                        <Text style={styles.guideStatus}>🟢 {guide.status}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.callButton}><Text style={styles.callIcon}>📞</Text></TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
                {messages.map((msg) => (
                    <View key={msg.id} style={[styles.messageRow, msg.sender === 'user' && styles.messageRowUser]}>
                        <View style={[styles.messageBubble, msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleGuide]}>
                            <Text style={[styles.messageText, msg.sender === 'user' && styles.messageTextUser]}>{msg.text}</Text>
                            {/* Translation Result */}
                            {translatedTexts[msg.id] && (
                                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }}>
                                    <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: 'bold', marginBottom: 2 }}>✨ TRANSLATION</Text>
                                    <Text style={[styles.messageText, { color: '#4b5563', fontStyle: 'italic' }]}>{translatedTexts[msg.id]}</Text>
                                </View>
                            )}
                            <Text style={[styles.messageTime, msg.sender === 'user' && styles.messageTimeUser]}>{msg.time}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Quick Replies */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplies}>
                <TouchableOpacity style={styles.quickReply}><Text style={styles.quickReplyText}>What should I bring?</Text></TouchableOpacity>
                <TouchableOpacity style={styles.quickReply}><Text style={styles.quickReplyText}>Meeting point?</Text></TouchableOpacity>
                <TouchableOpacity style={styles.quickReply}><Text style={styles.quickReplyText}>Cancel booking</Text></TouchableOpacity>
            </ScrollView>

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={[styles.translateButton, translating && { opacity: 0.5 }]}
                        onPress={handleTranslate}
                        disabled={translating}
                    >
                        <Text style={styles.translateIcon}>{translating ? '⏳' : '🌐'}</Text>
                    </TouchableOpacity>
                    <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor={Colors.textSecondary} value={message} onChangeText={setMessage} multiline />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}><Text style={styles.sendIcon}>📤</Text></TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundLight },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 20 },
    guideInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm },
    guideAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    guideInitial: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: 'white' },
    guideName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginLeft: 8 },
    guideStatus: { fontSize: 12, color: Colors.textSecondary, marginLeft: 8 },
    callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
    callIcon: { fontSize: 20 },
    messagesContainer: { flex: 1 },
    messagesContent: { padding: Spacing.md },
    messageRow: { marginBottom: Spacing.sm },
    messageRowUser: { alignItems: 'flex-end' },
    messageBubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: 16 },
    messageBubbleGuide: { backgroundColor: Colors.surfaceLight, borderTopLeftRadius: 4 },
    messageBubbleUser: { backgroundColor: Colors.primary, borderTopRightRadius: 4 },
    messageText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
    messageTextUser: { color: 'white' },
    messageTime: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, alignSelf: 'flex-end' },
    messageTimeUser: { color: 'rgba(255,255,255,0.7)' },
    quickReplies: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
    quickReply: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.surfaceLight, borderRadius: 20, borderWidth: 1, borderColor: Colors.borderLight },
    quickReplyText: { fontSize: 12, color: Colors.textSecondary },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: Spacing.sm },
    translateButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(17, 82, 212, 0.1)', alignItems: 'center', justifyContent: 'center' },
    translateIcon: { fontSize: 20 },
    input: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, maxHeight: 100 },
    sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    sendIcon: { fontSize: 18 },
});
