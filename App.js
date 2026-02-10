import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, StatusBar, Animated,
    Dimensions, KeyboardAvoidingView, Platform, ScrollView,
    Alert, LayoutAnimation, UIManager
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Plus, Search, Star, Settings, Folder, BookText,
    X, CheckSquare, Square, ChevronLeft, Trash2,
    Palette, MoreVertical, List
} from 'lucide-react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

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
    const [activeTab, setActiveTab] = useState('notes'); // notes, folders, favorites, settings
    const [editingNote, setEditingNote] = useState(null);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const saved = await AsyncStorage.getItem('notees_data_native');
            if (saved) setNotes(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load notes');
        }
    };

    const saveNotes = async (updatedNotes) => {
        try {
            await AsyncStorage.setItem('notees_data_native', JSON.stringify(updatedNotes));
            setNotes(updatedNotes);
        } catch (e) {
            console.error('Failed to save notes');
        }
    };

    const createNote = (isChecklist = false) => {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            color: 'blue',
            favorite: false,
            isChecklist: isChecklist,
            checklistItems: isChecklist ? [{ id: '1', text: '', checked: false }] : [],
            date: new Date().toISOString()
        };
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setEditingNote(newNote);
    };

    const closeEditor = () => {
        if (editingNote) {
            const exists = notes.find(n => n.id === editingNote.id);
            let updatedNotes = [...notes];

            const isEmpty = !editingNote.title &&
                !editingNote.content &&
                (editingNote.isChecklist ? editingNote.checklistItems.length === 1 && !editingNote.checklistItems[0].text : true);

            if (!isEmpty) {
                if (exists) {
                    updatedNotes = notes.map(n => n.id === editingNote.id ? editingNote : n);
                } else {
                    updatedNotes = [editingNote, ...notes];
                }
                saveNotes(updatedNotes);
            }
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setEditingNote(null);
        setIsColorPickerVisible(false);
    };

    const deleteNote = () => {
        Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updatedNotes = notes.filter(n => n.id !== editingNote.id);
                    saveNotes(updatedNotes);
                    setEditingNote(null);
                }
            }
        ]);
    };

    const toggleChecklistItem = (id) => {
        const updatedItems = editingNote.checklistItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        setEditingNote({ ...editingNote, checklistItems: updatedItems });
    };

    const updateChecklistItemText = (id, text) => {
        const updatedItems = editingNote.checklistItems.map(item =>
            item.id === id ? { ...item, text } : item
        );
        setEditingNote({ ...editingNote, checklistItems: updatedItems });
    };

    const addChecklistItem = () => {
        const newItem = { id: Date.now().toString(), text: '', checked: false };
        setEditingNote({
            ...editingNote,
            checklistItems: [...editingNote.checklistItems, newItem]
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
            activeOpacity={0.8}
            style={[styles.noteCard, { backgroundColor: COLORS.notes[item.color].bg }]}
            onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setEditingNote(item);
            }}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.noteTitle, { color: COLORS.notes[item.color].text }]} numberOfLines={1}>
                    {item.title || 'Untitled'}
                </Text>
                {item.favorite && <Star size={12} color={COLORS.yellow} fill={COLORS.yellow} />}
            </View>

            {item.isChecklist ? (
                <View style={styles.checklistPreview}>
                    {item.checklistItems.slice(0, 3).map((ci, i) => (
                        <View key={ci.id} style={styles.previewItem}>
                            {ci.checked ? <CheckSquare size={12} color="rgba(255,255,255,0.4)" /> : <Square size={12} color="rgba(255,255,255,0.6)" />}
                            <Text style={[styles.previewText, ci.checked && styles.checkedText]} numberOfLines={1}>{ci.text || 'Item'}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.notePreview} numberOfLines={4}>
                    {item.content || 'No content'}
                </Text>
            )}

            <Text style={styles.noteDate}>
                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Home View */}
            <View style={{ flex: 1, display: editingNote ? 'none' : 'flex' }}>
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
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No notes found</Text>
                        </View>
                    }
                />

                {/* FAB */}
                {activeTab === 'notes' && (
                    <TouchableOpacity
                        style={styles.fab}
                        activeOpacity={0.9}
                        onPress={() => createNote()}
                    >
                        <Plus color="#ffffff" size={32} />
                    </TouchableOpacity>
                )}

                {/* Bottom Nav */}
                <View style={styles.bottomNav}>
                    <NavButton icon={BookText} label="Notes" active={activeTab === 'notes'} onPress={() => setActiveTab('notes')} />
                    <NavButton icon={Folder} label="Folders" active={activeTab === 'folders'} onPress={() => setActiveTab('folders')} />
                    <NavButton icon={Star} label="Favorites" active={activeTab === 'favorites'} onPress={() => setActiveTab('favorites')} />
                    <NavButton icon={Settings} label="Settings" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
                </View>
            </View>

            {/* Fullscreen Editor View */}
            {editingNote && (
                <View style={[styles.editorContainer, { backgroundColor: COLORS.background }]}>
                    <View style={styles.editorHeader}>
                        <TouchableOpacity onPress={closeEditor} style={styles.iconBtn}>
                            <ChevronLeft color={COLORS.text} size={30} />
                        </TouchableOpacity>

                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => setEditingNote({ ...editingNote, favorite: !editingNote.favorite })}
                            >
                                <Star color={editingNote.favorite ? COLORS.yellow : COLORS.text} fill={editingNote.favorite ? COLORS.yellow : 'transparent'} size={24} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={deleteNote}>
                                <Trash2 color="#ff4444" size={24} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.editorBody} keyboardShouldPersistTaps="handled">
                        <TextInput
                            style={styles.editorTitleInput}
                            placeholder="Title"
                            placeholderTextColor={COLORS.textSecondary}
                            value={editingNote.title}
                            onChangeText={(t) => setEditingNote({ ...editingNote, title: t })}
                            multiline
                        />

                        {editingNote.isChecklist ? (
                            <View style={styles.checklistContainer}>
                                {editingNote.checklistItems.map((item) => (
                                    <View key={item.id} style={styles.checkItemRow}>
                                        <TouchableOpacity onPress={() => toggleChecklistItem(item.id)}>
                                            {item.checked ?
                                                <CheckSquare size={24} color={COLORS.primary} /> :
                                                <Square size={24} color={COLORS.textSecondary} />
                                            }
                                        </TouchableOpacity>
                                        <TextInput
                                            style={[styles.checkInput, item.checked && styles.checkedText]}
                                            value={item.text}
                                            onChangeText={(t) => updateChecklistItemText(item.id, t)}
                                            placeholder="List item..."
                                            placeholderTextColor={COLORS.textSecondary}
                                            multiline
                                        />
                                        <TouchableOpacity onPress={() => {
                                            const filtered = editingNote.checklistItems.filter(i => i.id !== item.id);
                                            setEditingNote({ ...editingNote, checklistItems: filtered });
                                        }}>
                                            <X size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addItemBtn} onPress={addChecklistItem}>
                                    <Plus size={20} color={COLORS.textSecondary} />
                                    <Text style={styles.addItemText}>Add item</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TextInput
                                style={styles.editorContentInput}
                                placeholder="Start typing..."
                                placeholderTextColor={COLORS.textSecondary}
                                value={editingNote.content}
                                onChangeText={(t) => setEditingNote({ ...editingNote, content: t })}
                                multiline
                                autoFocus={!editingNote.title}
                            />
                        )}
                    </ScrollView>

                    {isColorPickerVisible && (
                        <View style={styles.colorPalette}>
                            {Object.keys(COLORS.notes).map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.colorOption, { backgroundColor: COLORS.notes[c].bg, borderWidth: editingNote.color === c ? 2 : 0, borderColor: '#fff' }]}
                                    onPress={() => {
                                        setEditingNote({ ...editingNote, color: c });
                                        setIsColorPickerVisible(false);
                                    }}
                                />
                            ))}
                        </View>
                    )}

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={styles.toolbar}>
                            <TouchableOpacity style={styles.toolAction} onPress={() => setIsColorPickerVisible(!isColorPickerVisible)}>
                                <Palette color={isColorPickerVisible ? COLORS.primary : COLORS.textSecondary} size={24} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toolAction}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    if (editingNote.isChecklist) {
                                        // Convert checklist to text
                                        const content = editingNote.checklistItems.map(i => `${i.checked ? '☑' : '☐'} ${i.text}`).join('\n');
                                        setEditingNote({ ...editingNote, isChecklist: false, content, checklistItems: [] });
                                    } else {
                                        // Convert text to checklist
                                        const items = editingNote.content.split('\n').map((line, i) => ({
                                            id: Date.now().toString() + i,
                                            text: line.replace(/^[☑☐]\s*/, ''),
                                            checked: line.startsWith('☑')
                                        })).filter(item => item.text);
                                        setEditingNote({
                                            ...editingNote,
                                            isChecklist: true,
                                            checklistItems: items.length ? items : [{ id: '1', text: '', checked: false }]
                                        });
                                    }
                                }}
                            >
                                <List color={editingNote.isChecklist ? COLORS.primary : COLORS.textSecondary} size={24} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity style={styles.toolAction} onPress={closeEditor}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16
    },
    headerTitle: { fontSize: 34, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
    searchContainer: { paddingHorizontal: 16, marginBottom: 20 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 54,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    searchInput: { flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 16, fontWeight: '500' },
    grid: { paddingHorizontal: 16, paddingBottom: 110 },
    row: { justifyContent: 'space-between' },
    noteCard: {
        width: (width - 44) / 2,
        borderRadius: 28,
        padding: 18,
        minHeight: 180,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    noteTitle: { fontSize: 18, fontWeight: '800' },
    notePreview: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
    noteDate: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginTop: 'auto', paddingTop: 10 },
    checklistPreview: { gap: 6 },
    previewItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    previewText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    checkedText: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.4)' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 },
    fab: {
        position: 'absolute',
        bottom: 105,
        right: 24,
        width: 68,
        height: 68,
        borderRadius: 24,
        backgroundColor: '#2b8cee',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2b8cee',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 85,
        backgroundColor: '#0d141b',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    navBtn: { alignItems: 'center', minWidth: 60 },
    navText: { fontSize: 11, marginTop: 5, fontWeight: '700' },
    editorContainer: { flex: 1 },
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerRight: { flexDirection: 'row' },
    iconBtn: { padding: 12 },
    editorBody: { flex: 1, padding: 24 },
    editorTitleInput: { fontSize: 30, fontWeight: '900', color: COLORS.text, marginBottom: 20, lineHeight: 36 },
    editorContentInput: { fontSize: 19, color: COLORS.text, lineHeight: 28, minHeight: 400 },
    checklistContainer: { paddingBottom: 100 },
    checkItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 12 },
    checkInput: { flex: 1, fontSize: 18, color: COLORS.text, paddingVertical: 5 },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 10 },
    addItemText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
    toolbar: {
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: '#0d141b',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)'
    },
    toolAction: { padding: 12, marginRight: 5 },
    colorPalette: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
        backgroundColor: '#0d141b',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    colorOption: { width: 34, height: 34, borderRadius: 17 }
});
