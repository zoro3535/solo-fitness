/* ========================================================
   SOLO FITNESS TRACKER - SHADOW MONARCH GAME ENGINE
   Features:
   1. 3-Tab Bottom Navigation (Quests, Status, History)
   2. Custom Exercises: Add, Edit, and Delete Workouts
   3. Gym Splits: Push, Pull, Legs, Full Body
   4. Progressive Difficulty Scaling
   5. Locked Quests (Option B Anti-Cheat)
   6. Dungeon Clear History Logging
   7. LocalStorage Persistence
   ======================================================== */

// 1. CONSTANTS & GAME RULES
const STORAGE_KEY = "solo_fitness_monarch_v3";
const XP_PER_QUEST = 25;
const XP_FOR_LEVEL_UP = 100;

// DEFAULT GYM SPLITS TEMPLATE
const DEFAULT_SPLITS = {
  push: {
    title: "PUSH DAY (CHEST, SHOULDERS, TRICEPS)",
    exercises: [
      { id: "push_bench", name: "Barbell Bench Press", icon: "🏋️", baseSets: 3, baseReps: 8, focus: "Chest & Front Delts" },
      { id: "push_ohp", name: "Overhead Shoulder Press", icon: "⚔️", baseSets: 3, baseReps: 8, focus: "Shoulders & Core" },
      { id: "push_incline", name: "Incline DB Dumbbell Press", icon: "🛡️", baseSets: 3, baseReps: 10, focus: "Upper Chest" },
      { id: "push_triceps", name: "Tricep Rope Pushdowns", icon: "⚡", baseSets: 3, baseReps: 12, focus: "Triceps Arm Size" }
    ]
  },
  pull: {
    title: "PULL DAY (BACK, BICEPS, REAR DELTS)",
    exercises: [
      { id: "pull_lat", name: "Lat Pulldown / Pull-ups", icon: "🦅", baseSets: 3, baseReps: 8, focus: "Back Width & Lats" },
      { id: "pull_row", name: "Barbell / Cable Rows", icon: "⚔️", baseSets: 3, baseReps: 10, focus: "Back Thickness" },
      { id: "pull_face", name: "Face Pulls", icon: "🏹", baseSets: 3, baseReps: 12, focus: "Rear Delts & Posture" },
      { id: "pull_curls", name: "Bicep Barbell Curls", icon: "💪", baseSets: 3, baseReps: 10, focus: "Biceps Peak" }
    ]
  },
  legs: {
    title: "LEG DAY (QUADS, HAMSTRINGS, CALVES)",
    exercises: [
      { id: "leg_squat", name: "Barbell Back Squats / Leg Press", icon: "🦵", baseSets: 3, baseReps: 8, focus: "Quad Power & Glutes" },
      { id: "leg_rdl", name: "Romanian Deadlifts (RDL)", icon: "🛡️", baseSets: 3, baseReps: 10, focus: "Hamstrings & Glutes" },
      { id: "leg_lunge", name: "Walking DB Lunges", icon: "⚔️", baseSets: 3, baseReps: 10, focus: "Unilateral Leg Strength" },
      { id: "leg_calves", name: "Standing Calf Raises", icon: "⚡", baseSets: 4, baseReps: 15, focus: "Calf Endurance" }
    ]
  },
  full: {
    title: "FULL BODY / RECOVERY DUNGEON",
    exercises: [
      { id: "full_deadlift", name: "Conventional Deadlifts", icon: "🔥", baseSets: 3, baseReps: 6, focus: "Posterior Chain" },
      { id: "full_dips", name: "Bodyweight Dips / Push-ups", icon: "⚔️", baseSets: 3, baseReps: 12, focus: "Chest & Arms" },
      { id: "full_pullup", name: "Pull-ups / Inverted Rows", icon: "🦅", baseSets: 3, baseReps: 8, focus: "Back & Grip" },
      { id: "full_core", name: "Hanging Leg Raises / Planks", icon: "🛡️", baseSets: 3, baseReps: 15, focus: "Abdominal Core" }
    ]
  }
};

// 3 DAILY AUXILIARY SHADOW HABITS
const DAILY_HABITS = [
  { id: "habit_water", name: "Shadow Hydration", icon: "💧", baseAmount: 2.5, unit: "Liters", desc: "Cellular recovery & muscle endurance" },
  { id: "habit_steps", name: "Stamina March / Steps", icon: "👟", baseAmount: 8000, unit: "Steps", desc: "Active recovery & aerobic conditioning" },
  { id: "habit_nutrition", name: "Monarch's Nutrition", icon: "🥗", baseAmount: 1, unit: "Clean Diet Target", desc: "High protein & nutrient-dense meals" }
];

// DEFAULT STARTING STATE
const DEFAULT_STATE = {
  awakened: false,
  hunterName: "HUNTER",
  fitnessRank: "beginner",
  goal: "Hypertrophy",
  level: 1,
  xp: 0,
  currentSplit: "push",
  currentTab: "quests",
  // Customizable Splits stored per user
  splits: JSON.parse(JSON.stringify(DEFAULT_SPLITS)),
  completedQuests: {},
  history: []
};

let gameState = { ...DEFAULT_STATE };

// ========================================================
// 2. STORAGE (Save & Load)
// ========================================================

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      gameState = {
        ...DEFAULT_STATE,
        ...parsed,
        splits: parsed.splits || JSON.parse(JSON.stringify(DEFAULT_SPLITS))
      };
    }
  } catch (error) {
    console.error("Save load error:", error);
    gameState = { ...DEFAULT_STATE };
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.error("Save write error:", error);
  }
}

// ========================================================
// 3. TAB NAVIGATION (Quests, Status, History)
// ========================================================

function switchTab(tabName) {
  const tabs = ["quests", "status", "history"];
  if (!tabs.includes(tabName)) return;

  gameState.currentTab = tabName;

  // Toggle View Containers
  tabs.forEach((t) => {
    const viewEl = document.getElementById(`view-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);

    if (viewEl) {
      if (t === tabName) {
        viewEl.classList.add("active");
      } else {
        viewEl.classList.remove("active");
      }
    }

    if (navBtn) {
      if (t === tabName) {
        navBtn.classList.add("active");
      } else {
        navBtn.classList.remove("active");
      }
    }
  });

  // Re-render the active tab
  render();
}

// ========================================================
// 4. PROGRESSIVE DIFFICULTY SCALING
// ========================================================

function getScaledExercise(exercise, level) {
  const setBonus = Math.min(2, Math.floor((level - 1) / 5));
  const repBonus = Math.min(4, Math.floor((level - 1) / 2));

  const totalSets = Number(exercise.baseSets || 3) + setBonus;
  const totalReps = Number(exercise.baseReps || 10) + repBonus;

  return {
    sets: totalSets,
    reps: totalReps,
    targetText: `${totalSets} Sets × ${totalReps} Reps`
  };
}

function getScaledHabit(habit, level) {
  if (habit.id === "habit_water") {
    const bonusLiters = Math.min(1.0, (level - 1) * 0.1);
    const totalWater = (habit.baseAmount + bonusLiters).toFixed(1);
    return `${totalWater} Liters (${Math.round(totalWater * 4)} Glasses)`;
  }
  if (habit.id === "habit_steps") {
    const bonusSteps = Math.min(4000, (level - 1) * 500);
    const totalSteps = (habit.baseAmount + bonusSteps).toLocaleString();
    return `${totalSteps} Steps`;
  }
  return "High Protein Clean Meals";
}

// ========================================================
// 5. RANK TITLE LOGIC
// ========================================================

function getRankTitle(level) {
  if (level >= 25) return "SHADOW MONARCH";
  if (level >= 20) return "NATIONAL LEVEL HUNTER";
  if (level >= 15) return "S-RANK HUNTER";
  if (level >= 10) return "A-RANK HUNTER";
  if (level >= 7)  return "B-RANK HUNTER";
  if (level >= 5)  return "C-RANK HUNTER";
  if (level >= 3)  return "D-RANK HUNTER";
  return "E-RANK HUNTER";
}

// ========================================================
// 6. RENDERING LOGIC
// ========================================================

function render() {
  // 1. Status Cards
  const nameEl = document.getElementById("player-name-display");
  const rankEl = document.getElementById("player-rank");
  const goalEl = document.getElementById("player-goal-display");
  const levelEl = document.getElementById("player-level");
  const difficultyBadge = document.getElementById("difficulty-badge");

  if (nameEl) nameEl.textContent = gameState.hunterName.toUpperCase();
  if (rankEl) rankEl.textContent = getRankTitle(gameState.level);
  if (goalEl) goalEl.textContent = gameState.goal.toUpperCase();
  if (levelEl) levelEl.textContent = gameState.level;
  if (difficultyBadge) difficultyBadge.textContent = `SCALING: LV ${gameState.level}`;

  // 2. XP Bar
  const xpTextEl = document.getElementById("xp-text");
  const xpFillEl = document.getElementById("xp-fill");
  const xpPercent = Math.min((gameState.xp / XP_FOR_LEVEL_UP) * 100, 100);

  if (xpTextEl) xpTextEl.textContent = `${gameState.xp} / ${XP_FOR_LEVEL_UP} XP`;
  if (xpFillEl) xpFillEl.style.width = `${xpPercent}%`;

  // 3. Split Tabs Active State
  const splits = ["push", "pull", "legs", "full"];
  splits.forEach((s) => {
    const tabBtn = document.getElementById(`tab-${s}`);
    if (tabBtn) {
      if (s === gameState.currentSplit) {
        tabBtn.classList.add("active");
      } else {
        tabBtn.classList.remove("active");
      }
    }
  });

  // 4. Render Gym Exercises List
  const splitData = gameState.splits[gameState.currentSplit] || DEFAULT_SPLITS.push;
  const splitTitleEl = document.getElementById("current-split-title");
  if (splitTitleEl) splitTitleEl.textContent = `${gameState.currentSplit.toUpperCase()} EXERCISES`;

  const exercisesContainer = document.getElementById("exercises-list");
  if (exercisesContainer) {
    exercisesContainer.innerHTML = "";
    
    if (splitData.exercises.length === 0) {
      exercisesContainer.innerHTML = `
        <div class="history-empty">
          No exercises in this split yet. Tap "+ ADD EXERCISE" above to create one!
        </div>
      `;
    } else {
      splitData.exercises.forEach((ex) => {
        const isDone = Boolean(gameState.completedQuests[ex.id]);
        const scaled = getScaledExercise(ex, gameState.level);

        const card = document.createElement("article");
        card.className = `quest-card ${isDone ? "completed" : ""}`;

        card.innerHTML = `
          <div class="quest-icon" onclick="toggleQuest('${ex.id}')">${ex.icon || '⚔️'}</div>
          <div class="quest-details" onclick="toggleQuest('${ex.id}')">
            <div class="quest-title-row">
              <h4 class="quest-title">${ex.name}</h4>
              <span class="target-badge">${scaled.targetText}</span>
            </div>
            <p class="quest-desc">${ex.focus || 'Target Workout'}</p>
            ${isDone ? '<span class="completed-locked-tag">✓ CLEARED & LOCKED</span>' : ''}
          </div>
          <div class="card-actions">
            ${!isDone ? `<button class="card-tool-btn" onclick="openExerciseModal('${ex.id}')" title="Edit Exercise">✎</button>` : ''}
            ${!isDone ? `<button class="card-tool-btn delete" onclick="deleteExercise('${ex.id}')" title="Delete Exercise">✕</button>` : ''}
            <button class="quest-check-btn" type="button" onclick="toggleQuest('${ex.id}')" aria-label="Complete ${ex.name}">
              <span>✓</span>
            </button>
          </div>
        `;
        exercisesContainer.appendChild(card);
      });
    }
  }

  // 5. Render Daily Habits List
  const habitsContainer = document.getElementById("habits-list");
  if (habitsContainer) {
    habitsContainer.innerHTML = "";
    DAILY_HABITS.forEach((hb) => {
      const isDone = Boolean(gameState.completedQuests[hb.id]);
      const targetText = getScaledHabit(hb, gameState.level);

      const card = document.createElement("article");
      card.className = `quest-card ${isDone ? "completed" : ""}`;
      card.onclick = () => toggleQuest(hb.id);

      card.innerHTML = `
        <div class="quest-icon">${hb.icon}</div>
        <div class="quest-details">
          <div class="quest-title-row">
            <h4 class="quest-title">${hb.name}</h4>
            <span class="target-badge">${targetText}</span>
          </div>
          <p class="quest-desc">${hb.desc}</p>
          ${isDone ? '<span class="completed-locked-tag">✓ CLEARED & LOCKED</span>' : ''}
        </div>
        <button class="quest-check-btn" type="button" aria-label="Complete ${hb.name}">
          <span>✓</span>
        </button>
      `;
      habitsContainer.appendChild(card);
    });
  }

  // 6. Calculate Completion %
  const currentExercises = splitData.exercises;
  const allCurrentTaskIds = [...currentExercises.map(e => e.id), ...DAILY_HABITS.map(h => h.id)];
  const totalTasks = allCurrentTaskIds.length;
  let completedCount = 0;

  allCurrentTaskIds.forEach(id => {
    if (gameState.completedQuests[id]) completedCount++;
  });

  const dailyPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const percentEl = document.getElementById("daily-percentage");
  const counterEl = document.getElementById("quests-counter");
  const dailyFillEl = document.getElementById("daily-fill");

  if (percentEl) percentEl.textContent = `${dailyPercent}%`;
  if (counterEl) counterEl.textContent = `${completedCount} of ${totalTasks} Completed`;
  if (dailyFillEl) dailyFillEl.style.width = `${dailyPercent}%`;

  // 7. Render History
  renderHistory();
}

/**
 * Renders the Dungeon Clear History List
 */
function renderHistory() {
  const historyContainer = document.getElementById("history-container");
  const countBadge = document.getElementById("history-count-badge");
  if (!historyContainer) return;

  const history = gameState.history || [];
  if (countBadge) countBadge.textContent = `${history.length} Cleared`;

  if (history.length === 0) {
    historyContainer.innerHTML = `
      <div class="history-empty">
        No completed dungeons yet. Finish today's workout to claim your first clear record!
      </div>
    `;
    return;
  }

  historyContainer.innerHTML = "";
  history.slice().reverse().forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-left">
        <span class="history-date">${item.date}</span>
        <span class="history-split">${item.splitName}</span>
      </div>
      <div class="history-right">
        <span class="history-xp">+${item.xpEarned} XP (LV ${item.level})</span>
        <span class="history-badge">✓ CLEARED (${item.tasksCompleted} Tasks)</span>
      </div>
    `;
    historyContainer.appendChild(card);
  });
}

// ========================================================
// 7. CUSTOM EXERCISE MANAGEMENT (Add, Edit, Delete)
// ========================================================

function openExerciseModal(exerciseId = "") {
  const modal = document.getElementById("exercise-modal");
  const modalTitle = document.getElementById("exercise-modal-title");
  const splitLabel = document.getElementById("exercise-modal-split-label");
  const idInput = document.getElementById("edit-exercise-id");
  const nameInput = document.getElementById("input-exercise-name");
  const setsInput = document.getElementById("input-exercise-sets");
  const repsInput = document.getElementById("input-exercise-reps");
  const focusInput = document.getElementById("input-exercise-focus");

  const currentSplitKey = gameState.currentSplit;
  const currentSplit = gameState.splits[currentSplitKey];

  if (splitLabel) splitLabel.textContent = `Targeting: ${currentSplit.title.split("(")[0].trim()}`;

  if (exerciseId) {
    // EDIT MODE
    const existing = currentSplit.exercises.find(e => e.id === exerciseId);
    if (existing) {
      if (modalTitle) modalTitle.textContent = "EDIT EXERCISE";
      if (idInput) idInput.value = existing.id;
      if (nameInput) nameInput.value = existing.name;
      if (setsInput) setsInput.value = existing.baseSets;
      if (repsInput) repsInput.value = existing.baseReps;
      if (focusInput) focusInput.value = existing.focus || "";
    }
  } else {
    // ADD NEW MODE
    if (modalTitle) modalTitle.textContent = "ADD NEW EXERCISE";
    if (idInput) idInput.value = "";
    if (nameInput) nameInput.value = "";
    if (setsInput) setsInput.value = "3";
    if (repsInput) repsInput.value = "10";
    if (focusInput) focusInput.value = "";
  }

  if (modal) modal.classList.add("active");
}

function closeExerciseModal() {
  const modal = document.getElementById("exercise-modal");
  if (modal) modal.classList.remove("active");
}

function handleExerciseSubmit(event) {
  event.preventDefault();

  const idInput = document.getElementById("edit-exercise-id");
  const nameInput = document.getElementById("input-exercise-name");
  const setsInput = document.getElementById("input-exercise-sets");
  const repsInput = document.getElementById("input-exercise-reps");
  const focusInput = document.getElementById("input-exercise-focus");

  const name = nameInput.value.trim();
  const sets = parseInt(setsInput.value, 10) || 3;
  const reps = parseInt(repsInput.value, 10) || 10;
  const focus = focusInput.value.trim() || "Muscle Conditioning";
  const existingId = idInput.value;

  const currentSplitKey = gameState.currentSplit;
  const currentSplit = gameState.splits[currentSplitKey];

  if (existingId) {
    // Update existing
    const exIndex = currentSplit.exercises.findIndex(e => e.id === existingId);
    if (exIndex !== -1) {
      currentSplit.exercises[exIndex].name = name;
      currentSplit.exercises[exIndex].baseSets = sets;
      currentSplit.exercises[exIndex].baseReps = reps;
      currentSplit.exercises[exIndex].focus = focus;
    }
  } else {
    // Add new exercise
    const newId = `custom_${Date.now()}`;
    const newExercise = {
      id: newId,
      name: name,
      icon: "⚔️",
      baseSets: sets,
      baseReps: reps,
      focus: focus
    };
    currentSplit.exercises.push(newExercise);
  }

  saveData();
  closeExerciseModal();
  render();
}

function deleteExercise(exerciseId) {
  const currentSplitKey = gameState.currentSplit;
  const currentSplit = gameState.splits[currentSplitKey];
  const ex = currentSplit.exercises.find(e => e.id === exerciseId);

  if (!ex) return;

  const confirmed = confirm(`Are you sure you want to remove "${ex.name}" from ${currentSplitKey.toUpperCase()} day?`);
  if (!confirmed) return;

  currentSplit.exercises = currentSplit.exercises.filter(e => e.id !== exerciseId);
  delete gameState.completedQuests[exerciseId];

  saveData();
  render();
}

// ========================================================
// 8. QUEST INTERACTIONS & LOCKING (Option B)
// ========================================================

function toggleQuest(questId) {
  // Option B Bug Fix: Once locked, it cannot be unclicked!
  if (gameState.completedQuests[questId]) {
    return;
  }

  gameState.completedQuests[questId] = true;
  gainXP(XP_PER_QUEST);

  saveData();
  render();
}

function gainXP(amount) {
  gameState.xp += amount;

  if (gameState.xp >= XP_FOR_LEVEL_UP) {
    const oldLevel = gameState.level;
    gameState.level += 1;
    gameState.xp = gameState.xp - XP_FOR_LEVEL_UP;

    showLevelUpModal(oldLevel, gameState.level);
  }
}

function selectSplit(splitKey) {
  if (gameState.splits[splitKey]) {
    gameState.currentSplit = splitKey;
    saveData();
    render();
  }
}

// ========================================================
// 9. DUNGEON CLEAR / FINISH WORKOUT DAY
// ========================================================

function finishWorkoutDay() {
  const splitData = gameState.splits[gameState.currentSplit];
  const currentTaskIds = [...splitData.exercises.map(e => e.id), ...DAILY_HABITS.map(h => h.id)];
  
  let clearedCount = 0;
  currentTaskIds.forEach(id => {
    if (gameState.completedQuests[id]) clearedCount++;
  });

  if (clearedCount === 0) {
    alert("System Alert: You haven't cleared any quests yet today! Complete at least one exercise before finishing.");
    return;
  }

  const confirmLog = confirm(
    `Log today's workout (${splitData.title.split("(")[0].trim()}) to your Dungeon History?\n` +
    `• Cleared: ${clearedCount} tasks\n` +
    `• Hunter Level: ${gameState.level}\n\n` +
    `This will archive today's session and prepare fresh quests for tomorrow.`
  );

  if (!confirmLog) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  const historyEntry = {
    date: dateStr,
    splitName: splitData.title.split("(")[0].trim(),
    tasksCompleted: clearedCount,
    xpEarned: clearedCount * XP_PER_QUEST,
    level: gameState.level
  };

  if (!gameState.history) gameState.history = [];
  gameState.history.push(historyEntry);

  // Reset active quest status for next day
  gameState.completedQuests = {};

  saveData();
  render();

  alert("DUNGEON CLEARED! Workout logged to your history. Great work, Hunter!");
  // Automatically switch to history tab to see the new record!
  switchTab("history");
}

function resetTodayQuests() {
  if (confirm("Reset today's active quests? Your Hunter Level, XP, and History will remain safe.")) {
    gameState.completedQuests = {};
    saveData();
    render();
  }
}

function resetAllData() {
  if (confirm("Reset ALL data and re-awaken from Level 1? This will wipe your custom exercises and history.")) {
    localStorage.removeItem(STORAGE_KEY);
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    openAwakeningModal(false);
    render();
  }
}

// ========================================================
// 10. LEVEL UP & AWAKENING MODALS
// ========================================================

function showLevelUpModal(oldLevel, newLevel) {
  const modal = document.getElementById("level-modal");
  const oldLevelEl = document.getElementById("modal-old-level");
  const newLevelEl = document.getElementById("modal-new-level");
  const noticeEl = document.getElementById("modal-difficulty-notice");

  if (oldLevelEl) oldLevelEl.textContent = `LV. ${oldLevel}`;
  if (newLevelEl) newLevelEl.textContent = `LV. ${newLevel}`;
  if (noticeEl) {
    noticeEl.textContent = `Workout difficulty scaled! Sets and reps increased for Level ${newLevel}.`;
  }
  if (modal) modal.classList.add("active");
}

function closeLevelModal() {
  const modal = document.getElementById("level-modal");
  if (modal) modal.classList.remove("active");
}

function openAwakeningModal(isEdit = false) {
  const modal = document.getElementById("awakening-modal");
  const nameInput = document.getElementById("input-hunter-name");
  const rankSelect = document.getElementById("select-hunter-rank");
  const goalSelect = document.getElementById("select-hunter-goal");

  if (isEdit && gameState.awakened) {
    if (nameInput) nameInput.value = gameState.hunterName;
    if (rankSelect) rankSelect.value = gameState.fitnessRank;
    if (goalSelect) goalSelect.value = gameState.goal;
  }

  if (modal) modal.classList.add("active");
}

function closeAwakeningModal() {
  const modal = document.getElementById("awakening-modal");
  if (modal) modal.classList.remove("active");
}

function handleAwakeningSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById("input-hunter-name");
  const rankSelect = document.getElementById("select-hunter-rank");
  const goalSelect = document.getElementById("select-hunter-goal");

  if (nameInput && nameInput.value.trim()) {
    gameState.hunterName = nameInput.value.trim();
  }
  if (rankSelect) gameState.fitnessRank = rankSelect.value;
  if (goalSelect) gameState.goal = goalSelect.value;

  gameState.awakened = true;
  saveData();
  closeAwakeningModal();
  render();
}

// ========================================================
// 11. INITIALIZATION & PWA SERVICE WORKER
// ========================================================
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  switchTab(gameState.currentTab || "quests");

  if (!gameState.awakened) {
    openAwakeningModal(false);
  }

  // Register PWA Service Worker for 100% offline support
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("System: Offline Hunter Engine active."))
      .catch((err) => console.log("ServiceWorker registration skipped:", err));
  }
});
