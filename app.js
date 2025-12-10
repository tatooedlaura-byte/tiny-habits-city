/**
 * Main application for Tiny Habits City
 * Handles habit management and ties habits to city growth
 */

let city;
let habits = [];

// DOM Elements
const habitsList = document.getElementById('habits-list');
const addHabitBtn = document.getElementById('add-habit-btn');
const addHabitForm = document.getElementById('add-habit-form');
const newHabitInput = document.getElementById('new-habit-input');
const saveHabitBtn = document.getElementById('save-habit-btn');
const cancelHabitBtn = document.getElementById('cancel-habit-btn');

// Stats elements
const buildingsCount = document.getElementById('buildings-count');
const floorsCount = document.getElementById('floors-count');
const decorationsCount = document.getElementById('decorations-count');

// Initialize app
async function init() {
    // Load assets first
    await assetLoader.loadAll();

    // Initialize city
    const canvas = document.getElementById('city-canvas');
    city = new City(canvas);

    // Load saved data
    loadHabits();
    city.load();

    // Render everything
    renderHabits();
    city.render();
    updateStats();

    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    addHabitBtn.addEventListener('click', showAddHabitForm);
    saveHabitBtn.addEventListener('click', saveNewHabit);
    cancelHabitBtn.addEventListener('click', hideAddHabitForm);

    newHabitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNewHabit();
        }
    });

    // Reset habits at midnight
    scheduleMidnightReset();
}

function showAddHabitForm() {
    addHabitForm.classList.remove('hidden');
    newHabitInput.focus();
}

function hideAddHabitForm() {
    addHabitForm.classList.add('hidden');
    newHabitInput.value = '';
}

function saveNewHabit() {
    const name = newHabitInput.value.trim();
    if (!name) return;

    const habit = {
        id: Date.now().toString(),
        name,
        completedToday: false,
        totalCompletions: 0,
        createdAt: new Date().toISOString(),
    };

    habits.push(habit);
    saveHabits();
    renderHabits();
    hideAddHabitForm();
}

function deleteHabit(id) {
    habits = habits.filter(h => h.id !== id);
    saveHabits();
    renderHabits();
}

function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    if (!habit.completedToday) {
        // Mark as complete and grow city!
        habit.completedToday = true;
        habit.totalCompletions++;

        // Grow the city - alternate between building growth and decorations
        const result = city.growCity();

        // Every 3rd completion also adds a decoration
        if (habit.totalCompletions % 3 === 0) {
            city.addDecoration();
        }

        // Save everything
        city.save();
        saveHabits();

        // Update UI with animation
        renderHabits();
        updateStats();

        // Add completion animation to the habit item
        setTimeout(() => {
            const habitEl = document.querySelector(`[data-habit-id="${id}"]`);
            if (habitEl) {
                habitEl.classList.add('just-completed');
                setTimeout(() => habitEl.classList.remove('just-completed'), 300);
            }
        }, 10);

    } else {
        // Allow unchecking (but don't shrink city - that would be mean!)
        habit.completedToday = false;
        saveHabits();
        renderHabits();
    }
}

function renderHabits() {
    if (habits.length === 0) {
        habitsList.innerHTML = `
            <li class="empty-state">
                <p>No habits yet!</p>
                <p class="text-muted">Add a tiny habit to start building your city.</p>
            </li>
        `;
        return;
    }

    habitsList.innerHTML = habits.map(habit => `
        <li class="habit-item ${habit.completedToday ? 'completed' : ''}"
            data-habit-id="${habit.id}"
            onclick="toggleHabit('${habit.id}')">
            <div class="habit-checkbox"></div>
            <span class="habit-name">${escapeHtml(habit.name)}</span>
            <button class="habit-delete" onclick="event.stopPropagation(); deleteHabit('${habit.id}')" title="Delete habit">
                &times;
            </button>
        </li>
    `).join('');
}

function updateStats() {
    const stats = city.getStats();
    buildingsCount.textContent = stats.buildings;
    floorsCount.textContent = stats.floors;
    decorationsCount.textContent = stats.decorations;
}

// Persistence
function saveHabits() {
    localStorage.setItem('tinyHabitsHabits', JSON.stringify(habits));
}

function loadHabits() {
    const saved = localStorage.getItem('tinyHabitsHabits');
    if (saved) {
        try {
            habits = JSON.parse(saved);

            // Check if we need to reset daily completions
            const lastReset = localStorage.getItem('tinyHabitsLastReset');
            const today = new Date().toDateString();

            if (lastReset !== today) {
                // Reset daily completions
                habits.forEach(h => h.completedToday = false);
                localStorage.setItem('tinyHabitsLastReset', today);
                saveHabits();
            }
        } catch (e) {
            console.warn('Failed to load habits:', e);
            habits = [];
        }
    }
}

function scheduleMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow - now;

    setTimeout(() => {
        // Reset all habits
        habits.forEach(h => h.completedToday = false);
        localStorage.setItem('tinyHabitsLastReset', new Date().toDateString());
        saveHabits();
        renderHabits();

        // Schedule next reset
        scheduleMidnightReset();
    }, msUntilMidnight);
}

// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Start the app
init();
