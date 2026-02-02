// Ruta Segura Perú - Guide Tourist Group Chat
import { Colors, Spacing } from '@/src/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TouristGroupChat() {
    const { tourId } = useLocalSearchParams();
    const [message, setMessage] = useState('');

    const messages = [
        { id: '1', text: "Let's meet at the fountain in 10 mins.", sender: 'me', time: '10:23 AM' },
        { id: '2', text: 'Which fountain? The big one?', sender: 'Anna', time: '10:24 AM', translated: 'Spanish' },
        { id: '3', text: 'This one.', sender: 'me', time: '10:25 AM', hasImage: true },
    ];

    const quickActions = [
        { icon: '📍', label: 'Send Location', color: '#3b82f6' },
        { icon: '⚠️', label: 'Watch Your Step', color: '#f59e0b' },
        { icon: '⏱️', label: '5 Min Warning', color: '#6366f1' },
        { icon: '🆘', label: 'Emergency', color: '#ef4444' },
    ];

    const sendMessage = () => {
        if (message.trim()) {
            // Send message logic
            setMessage('');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>City Center Walking Group</Text>
                    <View style={styles.onlineIndicator}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>12 Active Members</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.sosBtn}>
                    <Text>🛡️</Text>
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.timestamp}>
                    <Text style={styles.timestampText}>Today, 10:23 AM</Text>
                </View>

                {messages.map((msg) => (
                    <View key={msg.id} style={[styles.messageRow, msg.sender === 'me' && styles.messageRowSent]}>
                        {msg.sender !== 'me' && (
                            <View style={styles.avatar}><Text>👩</Text></View>
                        )}
                        <View style={styles.messageContent}>
                            {msg.sender !== 'me' && <Text style={styles.senderName}>{msg.sender}</Text>}
                            <View style={[styles.messageBubble, msg.sender === 'me' ? styles.messageSent : styles.messageReceived]}>
                                {msg.hasImage && (
                                    <View style={styles.messageImage}><Text style={{ fontSize: 32 }}>⛲</Text></View>
                                )}
                                <Text style={[styles.messageText, msg.sender === 'me' && styles.messageTextSent]}>{msg.text}</Text>
                                {msg.translated && (
                                    <View style={styles.translationBadge}>
                                        <Text style={styles.translationIcon}>🌐</Text>
                                        <Text style={styles.translationText}>Translated from {msg.translated}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.messageTime}>{msg.time}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Footer */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Quick Actions */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
                    {quickActions.map((action, i) => (
                        <TouchableOpacity key={i} style={[styles.quickActionBtn, { backgroundColor: `${action.color}20`, borderColor: `${action.color}50` }]}>
                            <Text>{action.icon}</Text>
                            <Text style={[styles.quickActionText, { color: action.color }]}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Text>📷</Text>
                    </TouchableOpacity>
                    <View style={styles.textInputWrapper}>
                        <TextInput style={styles.textInput} placeholder="Type a message..." placeholderTextColor={Colors.textSecondary} value={message} onChangeText={setMessage} />
                        <TouchableOpacity style={styles.micBtn}>
                            <Text>🎤</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                        <Text style={styles.sendBtnIcon}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDark },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#324467' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    onlineIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
    onlineText: { color: '#92a4c9', fontSize: 12 },
    sosBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    messagesContainer: { flex: 1, padding: Spacing.md },
    timestamp: { alignItems: 'center', marginBottom: Spacing.md },
    timestampText: { backgroundColor: '#1e2430', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: '#92a4c9', fontSize: 12 },
    messageRow: { flexDirection: 'row', marginBottom: Spacing.md },
    messageRowSent: { justifyContent: 'flex-end' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#324467', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    messageContent: { maxWidth: '80%' },
    senderName: { color: '#92a4c9', fontSize: 12, marginLeft: 4, marginBottom: 2 },
    messageBubble: { borderRadius: 16, padding: 12 },
    messageSent: { backgroundColor: Colors.primary, borderTopRightRadius: 4 },
    messageReceived: { backgroundColor: '#1e2430', borderTopLeftRadius: 4 },
    messageImage: { width: 180, height: 100, backgroundColor: '#324467', borderRadius: 8, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
    messageText: { color: '#92a4c9', fontSize: 15 },
    messageTextSent: { color: 'white' },
    translationBadge: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 },
    translationIcon: { marginRight: 4 },
    translationText: { color: Colors.primary, fontSize: 12 },
    messageTime: { color: '#92a4c9', fontSize: 11, marginTop: 4, marginLeft: 4 },
    quickActions: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
    quickActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
    quickActionText: { fontSize: 13, fontWeight: '600' },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, gap: 8, borderTopWidth: 1, borderTopColor: '#324467' },
    attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e2430', alignItems: 'center', justifyContent: 'center' },
    textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e2430', borderRadius: 24, paddingHorizontal: 16 },
    textInput: { flex: 1, color: 'white', fontSize: 16, paddingVertical: 12 },
    micBtn: { padding: 4 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    sendBtnIcon: { color: 'white', fontSize: 18 },
});
