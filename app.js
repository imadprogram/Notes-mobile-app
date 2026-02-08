// ===== Notes App - Main JavaScript =====

// ===== State Management =====
let notes = [];
let currentNoteId = null;
let isChecklistMode = false;
let openedFromFab = false;
let sourceCardElement = null;

// ===== DOM Elements =====
const homeView = document.getElementById('home-view');
const editorView = document.getElementById('editor-view');
const notesGrid = document.getElementById('notes-grid');
const addNoteBtn = document.getElementById('add-note-btn');
const backBtn = document.getElementById('back-btn');
const searchInput = document.getElementById('search-input');

// Editor elements
const noteTitle = document.getElementById('note-title');
const noteBody = document.getElementById('note-body');
const checklistContainer = document.getElementById('checklist-container');
const checklistItems = document.getElementById('checklist-items');
const addItemRow = document.getElementById('add-item-row');

// Toolbar elements
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const imageBtn = document.getElementById('image-btn');
const checklistBtn = document.getElementById('checklist-btn');
const listBtn = document.getElementById('list-btn');
const colorBtn = document.getElementById('color-btn');
const colorPicker = document.getElementById('color-picker');
const closeColorPicker = document.getElementById('close-color-picker');
const colorOptions = document.querySelectorAll('.color-option');

// Menu elements
const moreBtn = document.getElementById('more-btn');
const moreMenu = document.getElementById('more-menu');
const favoriteToggle = document.getElementById('favorite-toggle');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const shareBtn = document.getElementById('share-btn');

// Navigation
const navItems = document.querySelectorAll('.nav-item');

// Overlay for animation
const noteOverlay = document.getElementById('note-overlay');

// ===== Sample Notes Data =====
const sampleNotes = [
    {
        id: generateId(),
        title: 'Q3 Planning',
        content: 'Discussion about the roadmap for next quarter. Focus on user retention and UI polish.',
        color: 'blue',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        favorite: false,
        isChecklist: false,
        checklistItems: []
    },
    {
        id: generateId(),
        title: 'Grocery List',
        content: '',
        color: 'green',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        favorite: false,
        isChecklist: true,
        checklistItems: [
            { text: 'Oat milk', checked: true },
            { text: 'Avocados', checked: false },
            { text: 'Coffee beans', checked: false }
        ]
    },
    {
        id: generateId(),
        title: 'Side Project',
        content: 'A marketplace for digital plants and virtual habitats.',
        color: 'purple',
        date: new Date('2024-10-12'),
        favorite: false,
        isChecklist: false,
        checklistItems: []
    },
    {
        id: generateId(),
        title: 'Upper Body',
        content: 'Bench Press 3x10, Pull Ups 4x8, Shoulder Press 3x12.',
        color: 'orange',
        date: new Date('2024-10-14'),
        favorite: false,
        isChecklist: false,
        checklistItems: []
    },
    {
        id: generateId(),
        title: 'Inspiration',
        content: '"The details are not the details. They make the design."',
        color: 'pink',
        date: new Date('2024-09-28'),
        favorite: true,
        isChecklist: false,
        checklistItems: []
    },
    {
        id: generateId(),
        title: 'Read Later',
        content: 'Atomic Habits, Dune, Zero to One.',
        color: 'teal',
        date: new Date('2024-09-15'),
        favorite: false,
        isChecklist: false,
        checklistItems: []
    }
];

// ===== Utility Functions =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ===== Storage Functions =====
function saveNotes() {
    localStorage.setItem('myNotes', JSON.stringify(notes));
}

function loadNotes() {
    const stored = localStorage.getItem('myNotes');
    if (stored) {
        notes = JSON.parse(stored);
        // Convert date strings back to Date objects
        notes.forEach(note => {
            note.date = new Date(note.date);
        });
    } else {
        notes = [...sampleNotes];
        saveNotes();
    }
}

// ===== Render Functions =====
function renderNotes(filter = '') {
    notesGrid.innerHTML = '';

    let filteredNotes = notes;

    // Apply search filter
    if (filter) {
        const searchTerm = filter.toLowerCase();
        filteredNotes = notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            note.checklistItems.some(item => item.text.toLowerCase().includes(searchTerm))
        );
    }

    // Sort by date (newest first)
    filteredNotes.sort((a, b) => b.date - a.date);

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">note_add</span>
                <h3>${filter ? 'No notes found' : 'No notes yet'}</h3>
                <p>${filter ? 'Try a different search term' : 'Tap the + button to create your first note'}</p>
            </div>
        `;
        return;
    }

    filteredNotes.forEach((note, index) => {
        const card = createNoteCard(note, index);
        notesGrid.appendChild(card);
    });
}

function createNoteCard(note, index) {
    const card = document.createElement('div');
    card.className = `note-card ${note.favorite ? 'favorite' : ''}`;
    card.dataset.id = note.id;
    card.dataset.color = note.color;
    card.style.animationDelay = `${index * 0.05}s`;

    let contentHTML = '';

    if (note.isChecklist && note.checklistItems.length > 0) {
        contentHTML = `
            <div class="note-checklist-preview">
                ${note.checklistItems.slice(0, 2).map(item => `
                    <div class="checklist-preview-item ${item.checked ? 'checked' : ''}">
                        <span class="material-symbols-outlined">
                            ${item.checked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        ${item.text}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        contentHTML = `<p class="note-preview">${note.content || 'Empty note'}</p>`;
    }

    card.innerHTML = `
        <h3 class="note-title">${note.title || 'Untitled'}</h3>
        ${contentHTML}
        <div class="note-date">${formatDate(note.date)}</div>
    `;

    card.addEventListener('click', () => openNoteWithAnimation(note, card));

    return card;
}

// ===== Animation Functions =====
function openNoteWithAnimation(note, cardElement) {
    sourceCardElement = cardElement;
    openedFromFab = false;

    // Add slide-in class to editor and open it
    editorView.classList.add('slide-in');
    openNote(note);

    // Remove class after animation
    setTimeout(() => {
        editorView.classList.remove('slide-in');
    }, 350);
}

function getEditorColor(color) {
    const colors = {
        blue: '#e8f4fd',
        green: '#ecfdf5',
        purple: '#f5f3ff',
        orange: '#fff7ed',
        pink: '#fdf2f8',
        teal: '#f0fdfa',
        yellow: '#fefce8',
        red: '#fef2f2'
    };
    return colors[color] || colors.yellow;
}

function getNoteCardColor(color) {
    const colors = {
        blue: '#c8e6f5',
        green: '#c6f7e2',
        purple: '#ddd6fe',
        orange: '#fed7aa',
        pink: '#fbcfe8',
        teal: '#99f6e4',
        yellow: '#fef08a',
        red: '#fecaca'
    };
    return colors[color] || colors.yellow;
}

// ===== Note CRUD Operations =====
function openNote(note) {
    currentNoteId = note.id;

    // Set editor color
    editorView.dataset.color = note.color;

    // Fill in content
    noteTitle.value = note.title;
    noteBody.textContent = note.content;

    // Handle checklist mode
    isChecklistMode = note.isChecklist;
    updateChecklistMode();

    if (note.isChecklist) {
        renderChecklistItems(note.checklistItems);
    }

    // Update favorite button
    updateFavoriteButton(note.favorite);

    // Switch views
    homeView.classList.remove('active');
    editorView.classList.add('active');

    // Focus title if new note
    if (!note.title) {
        setTimeout(() => noteTitle.focus(), 100);
    }
}

function createNewNote() {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'yellow'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newNote = {
        id: generateId(),
        title: '',
        content: '',
        color: randomColor,
        date: new Date(),
        favorite: false,
        isChecklist: false,
        checklistItems: []
    };

    notes.unshift(newNote);
    saveNotes();

    // Animate from FAB button
    openNoteFromFab(newNote);
}

function openNoteFromFab(note) {
    openedFromFab = true;
    const fab = document.getElementById('add-note-btn');
    const fabRect = fab.getBoundingClientRect();
    const app = document.getElementById('app');
    const appRect = app.getBoundingClientRect();

    // Calculate position relative to app container
    const startX = fabRect.left - appRect.left + (fabRect.width / 2) - (appRect.width / 2);
    const startY = fabRect.top - appRect.top + (fabRect.height / 2) - (appRect.height / 2);

    // Start very small (from FAB size)
    const scaleX = fabRect.width / appRect.width;
    const scaleY = fabRect.height / appRect.height;

    // Create expanding card
    const expandingCard = document.createElement('div');
    expandingCard.className = 'expanding-card';
    expandingCard.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${getEditorColor(note.color)};
        border-radius: 50%;
        transform: translate(${startX}px, ${startY}px) scale(${scaleX}, ${scaleY});
        transform-origin: center center;
        will-change: transform, border-radius;
        z-index: 999;
    `;

    noteOverlay.innerHTML = '';
    noteOverlay.appendChild(expandingCard);
    noteOverlay.classList.add('active');

    // Hide FAB during animation
    fab.style.opacity = '0';
    fab.style.transform = 'scale(0)';

    // Force reflow
    expandingCard.offsetHeight;

    // Animate to full size (400ms)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            expandingCard.style.transition = 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1), border-radius 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)';
            expandingCard.style.transform = 'translate(0, 0) scale(1, 1)';
            expandingCard.style.borderRadius = '0px';
        });
    });

    // Show editor RIGHT when expansion completes
    setTimeout(() => {
        editorView.classList.add('fade-in');
        openNote(note);

        // Quick cleanup after fast fade
        setTimeout(() => {
            noteOverlay.classList.remove('active');
            noteOverlay.innerHTML = '';
            editorView.classList.remove('fade-in');
            fab.style.opacity = '1';
            fab.style.transform = 'scale(1)';
        }, 180);
    }, 390);
}

function saveCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex(n => n.id === currentNoteId);
    if (noteIndex === -1) return;

    const note = notes[noteIndex];
    const title = noteTitle.value.trim();
    const content = noteBody.textContent.trim();

    // Get checklist items if in checklist mode
    let checklistItemsData = [];
    if (isChecklistMode) {
        const items = checklistItems.querySelectorAll('.checklist-item');
        items.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const text = item.querySelector('input[type="text"]').value.trim();
            if (text) {
                checklistItemsData.push({
                    text: text,
                    checked: checkbox.checked
                });
            }
        });
    }

    // Check if note is empty
    const isEmpty = !title && !content && checklistItemsData.length === 0;

    if (isEmpty) {
        // Delete empty note
        notes.splice(noteIndex, 1);
        showToast('Empty note discarded');
    } else {
        // Check if content actually changed
        const titleChanged = note.title !== title;
        const contentChanged = note.content !== content;
        const checklistChanged = JSON.stringify(note.checklistItems) !== JSON.stringify(checklistItemsData);
        const modeChanged = note.isChecklist !== isChecklistMode;

        // Update note
        note.title = title;
        note.content = content;
        note.isChecklist = isChecklistMode;
        note.checklistItems = checklistItemsData;

        // Only update date if something changed
        if (titleChanged || contentChanged || checklistChanged || modeChanged) {
            note.date = new Date();
            showToast('Note saved');
        }
    }

    saveNotes();
}

function deleteCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex(n => n.id === currentNoteId);
    if (noteIndex !== -1) {
        notes.splice(noteIndex, 1);
        saveNotes();
        showToast('Note deleted');
    }

    closeEditor();
}

function closeEditor() {
    saveCurrentNote();

    // Get current note color for animation
    const currentColor = editorView.dataset.color || 'yellow';

    // Check if note is empty
    const title = noteTitle.value.trim();
    const content = noteBody.textContent.trim();
    const isEmpty = !title && !content;

    // Close menus first
    moreMenu.classList.remove('visible');
    colorPicker.classList.remove('visible');
    colorPicker.classList.add('hidden');

    // If empty and opened from FAB, reverse animate to FAB
    if (isEmpty && openedFromFab) {
        // Delete the empty note
        if (currentNoteId) {
            const noteIndex = notes.findIndex(n => n.id === currentNoteId);
            if (noteIndex !== -1) {
                notes.splice(noteIndex, 1);
                saveNotes();
            }
        }
        closeEditorToFab(currentColor);
    } else if (sourceCardElement) {
        // Reverse animate to the source card
        closeEditorToCard(currentColor);
    } else {
        closeEditorWithAnimation(currentColor);
    }

    // Reset flags
    openedFromFab = false;
    sourceCardElement = null;
}

function closeEditorToFab(color) {
    const fab = document.getElementById('add-note-btn');
    const fabRect = fab.getBoundingClientRect();
    const app = document.getElementById('app');
    const appRect = app.getBoundingClientRect();

    // Calculate end position (FAB center)
    const endX = fabRect.left - appRect.left + (fabRect.width / 2) - (appRect.width / 2);
    const endY = fabRect.top - appRect.top + (fabRect.height / 2) - (appRect.height / 2);

    // End scale (FAB size)
    const scaleX = fabRect.width / appRect.width;
    const scaleY = fabRect.height / appRect.height;

    // Create shrinking card starting at full size
    const shrinkingCard = document.createElement('div');
    shrinkingCard.className = 'expanding-card';
    shrinkingCard.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${getEditorColor(color)};
        border-radius: 0px;
        transform: translate(0, 0) scale(1, 1);
        transform-origin: center center;
        will-change: transform, border-radius;
        z-index: 999;
    `;

    // Reset state
    currentNoteId = null;
    isChecklistMode = false;
    noteTitle.value = '';
    noteBody.textContent = '';
    checklistItems.innerHTML = '';
    checklistContainer.classList.add('hidden');
    noteBody.style.display = 'block';

    // Show home view underneath
    homeView.classList.add('active');
    renderNotes(searchInput.value);

    // Hide editor
    editorView.classList.remove('active');

    // Hide FAB during animation
    fab.style.opacity = '0';
    fab.style.transform = 'scale(0)';

    // Add overlay on top
    noteOverlay.innerHTML = '';
    noteOverlay.appendChild(shrinkingCard);
    noteOverlay.classList.add('active');

    // Force reflow
    shrinkingCard.offsetHeight;

    // Animate shrinking back to FAB
    requestAnimationFrame(() => {
        shrinkingCard.style.transition = 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1), border-radius 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)';
        shrinkingCard.style.transform = `translate(${endX}px, ${endY}px) scale(${scaleX}, ${scaleY})`;
        shrinkingCard.style.borderRadius = '50%';
    });

    // Clean up and show FAB
    setTimeout(() => {
        noteOverlay.classList.remove('active');
        noteOverlay.innerHTML = '';
        fab.style.opacity = '1';
        fab.style.transform = 'scale(1)';
    }, 420);
}

function closeEditorToCard(color) {
    // Add slide-out animation
    editorView.classList.add('slide-out');

    // After animation, clean up and show home
    setTimeout(() => {
        // Reset state
        currentNoteId = null;
        isChecklistMode = false;
        noteTitle.value = '';
        noteBody.textContent = '';
        checklistItems.innerHTML = '';
        checklistContainer.classList.add('hidden');
        noteBody.style.display = 'block';

        // Switch views
        editorView.classList.remove('active');
        editorView.classList.remove('slide-out');
        homeView.classList.add('active');

        renderNotes(searchInput.value);
    }, 250);
}

function closeEditorWithAnimation(color) {
    // Reset the flag
    openedFromFab = false;

    // Add slide-out animation
    editorView.classList.add('slide-out');

    // After animation, clean up and show home
    setTimeout(() => {
        // Reset state
        currentNoteId = null;
        isChecklistMode = false;
        noteTitle.value = '';
        noteBody.textContent = '';
        checklistItems.innerHTML = '';
        checklistContainer.classList.add('hidden');
        noteBody.style.display = 'block';

        // Switch views
        editorView.classList.remove('active');
        editorView.classList.remove('slide-out');
        homeView.classList.add('active');

        renderNotes(searchInput.value);
    }, 250);
}

// ===== Checklist Functions =====
function updateChecklistMode() {
    if (isChecklistMode) {
        checklistContainer.classList.remove('hidden');
        noteBody.style.display = 'none';
        checklistBtn.classList.add('active');
    } else {
        checklistContainer.classList.add('hidden');
        noteBody.style.display = 'block';
        checklistBtn.classList.remove('active');
    }
}

function renderChecklistItems(items) {
    checklistItems.innerHTML = '';
    items.forEach((item, index) => {
        addChecklistItem(item.text, item.checked, index);
    });
}

function addChecklistItem(text = '', checked = false, index = null) {
    const item = document.createElement('div');
    item.className = `checklist-item ${checked ? 'checked' : ''}`;

    item.innerHTML = `
        <input type="checkbox" ${checked ? 'checked' : ''}>
        <input type="text" value="${text}" placeholder="Item...">
        <button class="delete-item">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;

    const checkbox = item.querySelector('input[type="checkbox"]');
    const textInput = item.querySelector('input[type="text"]');
    const deleteBtn = item.querySelector('.delete-item');

    checkbox.addEventListener('change', () => {
        item.classList.toggle('checked', checkbox.checked);
    });

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addChecklistItem('', false);
            // Focus the new item
            const newItem = checklistItems.lastElementChild.querySelector('input[type="text"]');
            if (newItem) newItem.focus();
        }
    });

    deleteBtn.addEventListener('click', () => {
        item.remove();
    });

    checklistItems.appendChild(item);

    if (!text) {
        textInput.focus();
    }
}

// ===== Color Functions =====
function setNoteColor(color) {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.color = color;
        editorView.dataset.color = color;
        saveNotes();
    }

    // Update selected state
    colorOptions.forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === color);
    });

    toggleColorPicker(false);
}

function toggleColorPicker(show = null) {
    const isVisible = colorPicker.classList.contains('visible');
    const shouldShow = show !== null ? show : !isVisible;

    if (shouldShow) {
        colorPicker.classList.remove('hidden');
        colorPicker.classList.add('visible');

        // Mark current color as selected
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            colorOptions.forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.color === note.color);
            });
        }
    } else {
        colorPicker.classList.remove('visible');
        colorPicker.classList.add('hidden');
    }
}

// ===== Favorite Functions =====
function toggleFavorite() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.favorite = !note.favorite;
        updateFavoriteButton(note.favorite);
        saveNotes();
        showToast(note.favorite ? 'Added to favorites' : 'Removed from favorites');
    }

    moreMenu.classList.remove('visible');
}

function updateFavoriteButton(isFavorite) {
    const icon = favoriteToggle.querySelector('.material-symbols-outlined');
    const text = favoriteToggle.querySelector('span:last-child');

    if (isFavorite) {
        icon.style.fontVariationSettings = "'FILL' 1";
        icon.style.color = 'gold';
        text.textContent = 'Remove from Favorites';
    } else {
        icon.style.fontVariationSettings = "'FILL' 0";
        icon.style.color = '';
        text.textContent = 'Add to Favorites';
    }
}

// ===== Text Formatting Functions =====
function formatText(command) {
    document.execCommand(command, false, null);
    noteBody.focus();
    updateFormatButtonStates();
}

function updateFormatButtonStates() {
    // Check if bold is active
    if (document.queryCommandState('bold')) {
        boldBtn.classList.add('active');
    } else {
        boldBtn.classList.remove('active');
    }

    // Check if italic is active
    if (document.queryCommandState('italic')) {
        italicBtn.classList.add('active');
    } else {
        italicBtn.classList.remove('active');
    }
}

function insertBulletList() {
    document.execCommand('insertUnorderedList', false, null);
    noteBody.focus();
}

// ===== Share Function =====
function shareNote() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    const text = `${note.title}\n\n${note.content}`;

    if (navigator.share) {
        navigator.share({
            title: note.title,
            text: text
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard');
        }).catch(() => {
            showToast('Could not share');
        });
    }
}

// ===== Event Listeners =====
function initEventListeners() {
    // Add note button
    addNoteBtn.addEventListener('click', createNewNote);

    // Back button
    backBtn.addEventListener('click', closeEditor);

    // Search
    searchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    // Toolbar buttons
    boldBtn.addEventListener('click', () => formatText('bold'));
    italicBtn.addEventListener('click', () => formatText('italic'));
    listBtn.addEventListener('click', insertBulletList);

    // Update format button states when selection changes
    document.addEventListener('selectionchange', () => {
        if (editorView.classList.contains('active')) {
            updateFormatButtonStates();
        }
    });

    checklistBtn.addEventListener('click', () => {
        isChecklistMode = !isChecklistMode;
        updateChecklistMode();

        if (isChecklistMode) {
            // If no items, add first item
            if (checklistItems.children.length === 0) {
                addChecklistItem();
            }
        }
    });

    // Image button (placeholder)
    imageBtn.addEventListener('click', () => {
        showToast('Image upload coming soon');
    });

    // Color picker
    colorBtn.addEventListener('click', () => toggleColorPicker());
    closeColorPicker.addEventListener('click', () => toggleColorPicker(false));

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            setNoteColor(option.dataset.color);
        });
    });

    // More menu
    moreBtn.addEventListener('click', () => {
        moreMenu.classList.toggle('visible');
    });

    favoriteToggle.addEventListener('click', toggleFavorite);
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    shareBtn.addEventListener('click', shareNote);

    // Add checklist item
    addItemRow.addEventListener('click', () => {
        addChecklistItem();
    });

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const tab = item.dataset.tab;
            const fabBtn = document.getElementById('add-note-btn');
            if (tab === 'favorites') {
                fabBtn.style.display = 'none';
                renderNotes();
                // Filter to show only favorites
                const favNotes = notes.filter(n => n.favorite);
                renderFilteredNotes(favNotes);
            } else if (tab === 'notes') {
                fabBtn.style.display = 'flex';
                renderNotes();
            } else {
                fabBtn.style.display = 'none';
                showToast(`${tab.charAt(0).toUpperCase() + tab.slice(1)} coming soon`);
            }
        });
    });

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!moreMenu.contains(e.target) && !moreBtn.contains(e.target)) {
            moreMenu.classList.remove('visible');
        }
        if (!colorPicker.contains(e.target) && !colorBtn.contains(e.target)) {
            toggleColorPicker(false);
        }
    });

    // Handle keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editorView.classList.contains('active')) {
                closeEditor();
            }
        }
    });
}

function renderFilteredNotes(filteredNotes) {
    notesGrid.innerHTML = '';

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">star</span>
                <h3>No favorites yet</h3>
                <p>Star your important notes to see them here</p>
            </div>
        `;
        return;
    }

    filteredNotes.forEach((note, index) => {
        const card = createNoteCard(note, index);
        notesGrid.appendChild(card);
    });
}

// ===== Initialize App =====
function init() {
    loadNotes();
    renderNotes();
    initEventListeners();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
