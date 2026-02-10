import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Animated,
    Dimensions, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Search, Star, Settings, Folder, BookText, X, CheckSquare, Square, ChevronLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
    background: '#101922',
    surface: '#1a2533',
    primary: '#19e680',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    yellow: '#FFD600',
    notes: {
        blue: { bg: '#1e3a8a', text: '#bfdbfe' },
        green: { bg: '#064e3b', text: '#a7f3d0' },
        purple: { bg: '#4c1d95', text: '#ddd6fe' },
        orange: { bg: '#7c2d12', text: '#fed7aa' },
        pink: { bg: '#831843', text: '#fbcfe8' },
        teal: { bg: '#134e4a', text: '#99fadc' },
    }
};

export default function App() {
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('notes');
    const [editingNote, setEditingNote] = useState(null);

    // Animation value
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const saved = await AsyncStorage.getItem('notees_data');
            if (saved) setNotes(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load notes');
        }
    };

    const saveNotes = async (updatedNotes) => {
        try {
            await AsyncStorage.setItem('notees_data', JSON.stringify(updatedNotes));
            setNotes(updatedNotes);
        } catch (e) {
            console.error('Failed to save notes');
        }
    };

    const addNote = () => {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            color: 'blue',
            favorite: false,
            isChecklist: false,
            checklistItems: [],
            date: new Date().toISOString()
        };
        setEditingNote(newNote);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    };

    const closeEditor = () => {
        if (editingNote) {
            const exists = notes.find(n => n.id === editingNote.id);
            let updatedNotes;

            // Save only if not empty
            if (editingNote.title || editingNote.content || editingNote.checklistItems.length > 0) {
                if (exists) {
                    updatedNotes = notes.map(n => n.id === editingNote.id ? editingNote : n);
                } else {
                    updatedNotes = [editingNote, ...notes];
                }
                saveNotes(updatedNotes);
            }
        }

        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setEditingNote(null);
        });
    };

    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'favorites') return n.favorite && matchesSearch;
        return matchesSearch;
    });

    const renderNoteCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.noteCard, { backgroundColor: COLORS.notes[item.color].bg }]}
            onPress={() => {
                setEditingNote(item);
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
            }}
        >
            <Text style={[styles.noteTitle, { color: COLORS.notes[item.color].text }]} numberOfLines={1}>
                {item.title || 'Untitled'}
            </Text>
            <Text style={styles.notePreview} numberOfLines={3}>
                {item.content || 'Empty note'}
            </Text>
            <Text style={styles.noteDate}>JUST NOW</Text>
            {item.favorite && <View style={styles.favoriteDot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Home List View */}
            <View style={styles.homeView}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notees</Text>
                    <BookText color={COLORS.yellow} size={28} />
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search color={COLORS.textSecondary} size={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search your notes..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredNotes}
                    renderItem={renderNoteCard}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.row}
                />

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={addNote}>
                    <Plus color="#ffffff" size={32} />
                </TouchableOpacity>

                {/* Bottom Nav */}
                <View style={styles.bottomNav}>
                    <NavButton icon={BookText} label="Notes" active={activeTab === 'notes'} onPress={() => setActiveTab('notes')} />
                    <NavButton icon={Folder} label="Folders" active={activeTab === 'folders'} onPress={() => setActiveTab('folders')} />
                    <NavButton icon={Star} label="Favorites" active={activeTab === 'favorites'} onPress={() => setActiveTab('favorites')} />
                    <NavButton icon={Settings} label="Settings" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
                </View>
            </View>

            {/* Fullscreen Editor Overlay */}
            {editingNote && (
                <Animated.View style={[styles.editorOverlay, { opacity: fadeAnim }]}>
                    <SafeAreaView style={[styles.editorContent, { backgroundColor: COLORS.background }]}>
                        <View style={styles.editorHeader}>
                            <TouchableOpacity onPress={closeEditor}>
                                <ChevronLeft color={COLORS.text} size={32} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditingNote({ ...editingNote, favorite: !editingNote.favorite })}>
                                <Star color={editingNote.favorite ? COLORS.yellow : COLORS.text} fill={editingNote.favorite ? COLORS.yellow : 'transparent'} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.editorScroll}>
                            <TextInput
                                style={styles.editorTitle}
                                placeholder="Title"
                                placeholderTextColor={COLORS.textSecondary}
                                value={editingNote.title}
                                onChangeText={(t) => setEditingNote({ ...editingNote, title: t })}
                                multiline
                            />
                            <TextInput
                                style={styles.editorBody}
                                placeholder="Start typing..."
                                placeholderTextColor={COLORS.textSecondary}
                                value={editingNote.content}
                                onChangeText={(t) => setEditingNote({ ...editingNote, content: t })}
                                multiline
                                autoFocus
                            />
                        </ScrollView>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                            <View style={styles.toolbar}>
                                <TouchableOpacity style={styles.toolBtn}><Text style={styles.toolText}>B</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.toolBtn}><Text style={[styles.toolText, { fontStyle: 'italic' }]}>I</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.toolBtn}><CheckSquare color={COLORS.textSecondary} size={22} /></TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const NavButton = ({ icon: Icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navBtn} onPress={onPress}>
        <Icon color={active ? COLORS.primary : COLORS.textSecondary} size={24} />
        <Text style={[styles.navText, { color: active ? COLORS.primary : COLORS.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    homeView: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16
    },
    headerTitle: { fontSize: 32, fontWeight: '800', color: COLORS.text },
    searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52
    },
    searchInput: { flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 16 },
    grid: { paddingHorizontal: 16, paddingBottom: 100 },
    row: { justifyContent: 'space-between', marginBottom: 16 },
    noteCard: {
        width: (width - 48) / 2,
        borderRadius: 24,
        padding: 16,
        minHeight: 160,
        justifyContent: 'flex-start'
    },
    noteTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
    notePreview: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
    noteDate: { position: 'absolute', bottom: 16, left: 16, fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
    favoriteDot: { position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.yellow },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2b8cee',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 80,
        backgroundColor: '#0d141b',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    navBtn: { alignItems: 'center' },
    navText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
    editorOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
    editorContent: { flex: 1 },
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60
    },
    editorScroll: { padding: 24 },
    editorTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
    editorBody: { fontSize: 18, color: COLORS.text, lineHeight: 28, minHeight: height - 200 },
    toolbar: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)'
    },
    toolBtn: { padding: 12, marginRight: 8 },
    toolText: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' }
});
