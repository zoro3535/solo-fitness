/* ========================================================
   AURA: MASCULINE ANIME RPG FITNESS TRACKER
   Engine & Logic:
   - Solo Leveling Hunter Archetypes (Shadow Hunter & Shadow Monarch)
   - Male anime hero quotes & disciplined battle decrees
   - Icy Blue, Void Purple, and Steel Silver-Blue theme switching
   - Full Workout Split System + Difficulty Scaling + LocalStorage
   ======================================================== */

// 1. CONSTANTS & GAME RULES
const STORAGE_KEY = "solo_fitness_hunter_v5";
const XP_PER_QUEST = 25;
const XP_FOR_LEVEL_UP = 100;

// HUNTER COMBAT DECREES & DISCIPLINED QUOTES
const COMPANION_QUOTES = [
  "“Pain is temporary. Victory and physical power are eternal.” ⚔️",
  "“The only opponent that matters is the version of you from yesterday.” ⚡",
  "“Discipline beats motivation every single day. Execute your sets.” 🛡️",
  "“To protect what matters, you must become undeniably strong.” 🔥",
  "“Fatigue is weakness leaving the body. Stay locked in.” 🏹",
  "“A monarch does not negotiate with weakness. Clear the dungeon.” 👑"
];

// COLLECTIBLE HUNTER MILESTONE ACHIEVEMENTS
const BADGES_DATABASE = [
  { id: "badge_first", title: "Awakened Hunter", icon: "⚔️", reqLevel: 1, desc: "Began training protocol" },
  { id: "badge_lv3", title: "D-Rank Striker", icon: "🛡️", reqLevel: 3, desc: "Reached Hunter Level 3" },
  { id: "badge_lv5", title: "Shadow Slayer", icon: "⚡", reqLevel: 5, desc: "Reached Hunter Level 5" },
  { id: "badge_lv10", title: "Shadow Monarch", icon: "👑", reqLevel: 10, desc: "Reached Hunter Level 10" }
];

// DEFAULT GYM SPLITS TEMPLATE
const DEFAULT_SPLITS = {
  push: {
    title: "PUSH DAY (CHEST, SHOULDERS, TRICEPS)",
    exercises: [
      { id: "push_bench", name: "Barbell Bench Press", icon: "🏋️", baseSets: 3, baseReps: 8, focus: "Pectorals & Heavy Press" },
      { id: "push_ohp", name: "Overhead Military Press", icon: "⚔️", baseSets: 3, baseReps: 8, focus: "Anterior Delts & Core" },
      { id: "push_incline", name: "Incline DB Heavy Press", icon: "🛡️", baseSets: 3, baseReps: 10, focus: "Upper Chest Clavicular" },
      { id: "push_triceps", name: "Tricep Heavy Pushdowns", icon: "⚡", baseSets: 3, baseReps: 12, focus: "Triceps Lateral Head" }
    ]
  },
  pull: {
    title: "PULL DAY (BACK, BICEPS, REAR DELTS)",
    exercises: [
      { id: "pull_lat", name: "Weighted Pull-ups / Lat Pulldown", icon: "🦅", baseSets: 3, baseReps: 8, focus: "Back Lat Width" },
      { id: "pull_row", name: "Heavy Barbell Rows", icon: "⚔️", baseSets: 3, baseReps: 10, focus: "Mid-Back Thickness" },
      { id: "pull_face", name: "Face Pulls & Rear Delts", icon: "🏹", baseSets: 3, baseReps: 12, focus: "Rear Delts & Armor" },
      { id: "pull_curls", name: "Barbell Bicep Curls", icon: "💪", baseSets: 3, baseReps: 10, focus: "Biceps Peak" }
    ]
  },
  legs: {
    title: "LEG DAY (QUADS, HAMSTRINGS, CALVES)",
    exercises: [
      { id: "leg_squat", name: "Barbell Back Squats / Leg Press", icon: "🦵", baseSets: 3, baseReps: 8, focus: "Quad Explosive Power" },
      { id: "leg_rdl", name: "Romanian Deadlifts (RDL)", icon: "🛡️", baseSets: 3, baseReps: 10, focus: "Hamstrings & Glutes" },
      { id: "leg_lunge", name: "Heavy Walking Lunges", icon: "⚡", baseSets: 3, baseReps: 10, focus: "Leg Balance & Power" },
      { id: "leg_calves", name: "Standing Heavy Calf Raises", icon: "🔥", baseSets: 4, baseReps: 15, focus: "Calf Stamina" }
    ]
  },
  full: {
    title: "FULL BODY / RECOVERY DUNGEON",
    exercises: [
      { id: "full_deadlift", name: "Conventional Deadlifts", icon: "🔥", baseSets: 3, baseReps: 6, focus: "Full Posterior Chain" },
      { id: "full_dips", name: "Weighted Dips / Push-ups", icon: "⚔️", baseSets: 3, baseReps: 12, focus: "Chest & Triceps" },
      { id: "full_pullup", name: "Strict Pull-ups", icon: "🦅", baseSets: 3, baseReps: 8, focus: "Back & Grip" },
      { id: "full_core", name: "Hanging Leg Raises & Core", icon: "🛡️", baseSets: 3, baseReps: 15, focus: "Core Rigidity" }
    ]
  }
};

// 3 DAILY DISCIPLINE PROTOCOLS
const DAILY_HABITS = [
  { id: "habit_steps", type: "walk", name: "Stamina March / Steps", icon: "👟", baseAmount: 10000, unit: "Steps", desc: "Active recovery & aerobic conditioning" },
  { id: "habit_water", type: "water", name: "Hydration Recovery", icon: "💧", baseAmount: 3.0, unit: "Liters", desc: "Cellular hydration & muscle performance" },
  { id: "habit_nutrition", type: "nutrition", name: "Monarch's Nutrition", icon: "🥩", baseAmount: 1, unit: "Clean Diet Target", desc: "High protein & anabolic nutrient density" }
];

// DEFAULT STARTING STATE
const DEFAULT_STATE = {
  awakened: false,
  hunterName: "Sung Jin-Woo",
  fitnessRank: "beginner",
  goal: "Hypertrophy",
  level: 1,
  xp: 0,
  currentStreak: 0,
  lastCompletedDate: null,
  personalRecords: {}, // { exerciseId: { name: "Bench Press", weight: 80, date: "Oct 11" } }
  currentSplit: "push",
  currentTab: "quests",
  currentTheme: "blue", // 'blue' (Monochrome Dark), 'purple' (Void Shadow), 'silver' (Titanium Slate)
  currentAesthetic: "hunter",  // 'hunter' (Shadow Hunter), 'monarch' (Shadow Monarch)
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
        currentStreak: Number(parsed.currentStreak || 0),
        lastCompletedDate: parsed.lastCompletedDate || null,
        personalRecords: parsed.personalRecords || {},
        splits: parsed.splits || JSON.parse(JSON.stringify(DEFAULT_SPLITS))
      };
    } else {
      // Migrate previous v4 or v3 saves if existing
      const oldV4 = localStorage.getItem("solo_fitness_aura_v4") || localStorage.getItem("solo_fitness_monarch_v3");
      if (oldV4) {
        const parsedOld = JSON.parse(oldV4);
        gameState = {
          ...DEFAULT_STATE,
          ...parsedOld,
          hunterName: parsedOld.hunterName || "Sung Jin-Woo",
          currentStreak: Number(parsedOld.currentStreak || 0),
          lastCompletedDate: parsedOld.lastCompletedDate || null,
          personalRecords: parsedOld.personalRecords || {},
          currentTheme: "blue",
          currentAesthetic: "hunter",
          splits: parsedOld.splits || JSON.parse(JSON.stringify(DEFAULT_SPLITS))
        };
      }
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
// 3. TAB NAVIGATION (Quests, Status, Archives)
// ========================================================

function switchTab(tabName) {
  const tabs = ["quests", "status", "history"];
  if (!tabs.includes(tabName)) return;

  gameState.currentTab = tabName;

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
// 5. HUNTER RANK PROGRESSION TITLES
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
// 6. RENDERING & UI UPDATES
// ========================================================

function render() {
  applyThemeAndAesthetic();
  updateCompanionHeader();

  // 1. Profile & Status
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
  if (splitTitleEl) splitTitleEl.textContent = `${gameState.currentSplit.toUpperCase()} PROTOCOLS`;

  const exercisesContainer = document.getElementById("exercises-list");
  if (exercisesContainer) {
    exercisesContainer.innerHTML = "";
    
    if (splitData.exercises.length === 0) {
      exercisesContainer.innerHTML = `
        <div class="history-empty">
          No protocols configured in this split. Tap "+ ADD PROTOCOL" above to create one.
        </div>
      `;
    } else {
      splitData.exercises.forEach((ex) => {
        const isDone = Boolean(gameState.completedQuests[ex.id]);
        const scaled = getScaledExercise(ex, gameState.level);
        const currentPR = gameState.personalRecords && gameState.personalRecords[ex.id] ? gameState.personalRecords[ex.id].weight : null;

        const card = document.createElement("article");
        card.className = `quest-card quest-workout ${isDone ? "completed" : ""}`;

        card.innerHTML = `
          <div class="quest-icon" onclick="toggleQuest('${ex.id}')">${ex.icon || '⚔️'}</div>
          <div class="quest-details">
            <div class="quest-title-row" onclick="toggleQuest('${ex.id}')">
              <h4 class="quest-title">${ex.name}</h4>
              <span class="target-badge">${scaled.targetText}</span>
              ${currentPR ? `<span class="pr-badge-pill" title="Personal Record">PR: ${currentPR}kg</span>` : ''}
            </div>
            <p class="quest-desc" onclick="toggleQuest('${ex.id}')">${ex.focus || 'Target Protocol'}</p>
            
            <!-- PR WEIGHT LOGGING INPUT -->
            ${!isDone ? `
              <div class="quest-weight-row">
                <input type="number" class="quest-weight-input" placeholder="${currentPR ? currentPR : 'kg'}" 
                  onchange="updateExerciseWeight('${ex.id}', '${ex.name.replace(/'/g, "\\'")}', this.value)" 
                  title="Enter weight lifted to set or break your PR" step="0.5" min="1" max="500">
                <span class="quest-weight-unit">KG (Record Weight)</span>
              </div>
            ` : ''}

            ${isDone ? '<span class="completed-locked-tag">✓ CLEARED & LOCKED</span>' : ''}
          </div>
          <div class="card-actions">
            ${!isDone ? `<button class="card-tool-btn" onclick="openExerciseModal('${ex.id}')" title="Edit Protocol">✎</button>` : ''}
            ${!isDone ? `<button class="card-tool-btn delete" onclick="deleteExercise('${ex.id}')" title="Delete Protocol">✕</button>` : ''}
            <button class="quest-check-btn" type="button" onclick="toggleQuest('${ex.id}')" aria-label="Complete ${ex.name}">
              <span>✓</span>
            </button>
          </div>
        `;
        exercisesContainer.appendChild(card);
      });
    }
  }

  // 5. Render Daily Discipline Habits
  const habitsContainer = document.getElementById("habits-list");
  if (habitsContainer) {
    habitsContainer.innerHTML = "";
    DAILY_HABITS.forEach((hb) => {
      const isDone = Boolean(gameState.completedQuests[hb.id]);
      const targetText = getScaledHabit(hb, gameState.level);

      let typeClass = "quest-walk";
      if (hb.type === "water") typeClass = "quest-water";
      if (hb.type === "nutrition") typeClass = "quest-nutrition";

      const card = document.createElement("article");
      card.className = `quest-card ${typeClass} ${isDone ? "completed" : ""}`;
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

  // 6. Calculate Completion Percentage
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
  if (counterEl) counterEl.textContent = `${completedCount} of ${totalTasks} Cleared`;
  if (dailyFillEl) dailyFillEl.style.width = `${dailyPercent}%`;

  // 7. Render Personal Records & Achievements Badges
  renderPersonalRecords();
  renderBadges();

  // 8. Render Archives
  renderHistory();
}

/**
 * Updates male anime hero image, decree, date, and streak
 */
function updateCompanionHeader() {
  const dateEl = document.getElementById("header-today-date");
  const greetingEl = document.getElementById("companion-greeting");
  const companionImg = document.getElementById("companion-img");
  const streakCountEl = document.getElementById("header-streak-count");

  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" }).toUpperCase();
  }

  if (streakCountEl) {
    const streak = gameState.currentStreak || 0;
    streakCountEl.textContent = `${streak}-DAY STREAK`;
  }

  if (greetingEl) {
    greetingEl.textContent = `HUNTER ${gameState.hunterName.toUpperCase()}`;
  }

  if (companionImg) {
    if (gameState.currentAesthetic === "monarch") {
      companionImg.src = "hunter_monarch.svg";
    } else {
      companionImg.src = "hunter_protagonist.svg";
    }
  }
}

/**
 * Tapping hero avatar outputs a determined combat decree
 */
function companionCheer() {
  const quoteEl = document.getElementById("companion-quote");
  const randomQuote = COMPANION_QUOTES[Math.floor(Math.random() * COMPANION_QUOTES.length)];
  if (quoteEl) {
    quoteEl.textContent = randomQuote;
  }
}

/**
 * Renders Personal Records (PR) showcase in Status tab
 */
function renderPersonalRecords() {
  const prContainer = document.getElementById("pr-records-container");
  const prTotalBadge = document.getElementById("pr-total-badge");
  if (!prContainer) return;

  const prs = gameState.personalRecords || {};
  const prKeys = Object.keys(prs);

  if (prTotalBadge) {
    prTotalBadge.textContent = `${prKeys.length} Records`;
  }

  if (prKeys.length === 0) {
    prContainer.innerHTML = `
      <div class="history-empty" style="grid-column: 1 / -1; padding: 16px;">
        No PR records logged yet. Enter your lifted weight (kg) on any protocol in today's quest list to establish your first record!
      </div>
    `;
    return;
  }

  prContainer.innerHTML = "";
  prKeys.forEach((key) => {
    const pr = prs[key];
    const tile = document.createElement("div");
    tile.className = "pr-tile";
    tile.innerHTML = `
      <span class="pr-tile-title">${pr.name || 'Protocol'}</span>
      <div class="pr-tile-value">
        ${pr.weight} <span class="pr-tile-unit">KG</span>
      </div>
      <span class="pr-tile-date">Recorded: ${pr.date || 'Recent'}</span>
    `;
    prContainer.appendChild(tile);
  });
}

/**
 * Updates an exercise Personal Record (PR) weight and rewards bonus XP on new PB
 */
function updateExerciseWeight(exerciseId, exerciseName, rawValue) {
  const val = parseFloat(rawValue);
  if (isNaN(val) || val <= 0) return;

  if (!gameState.personalRecords) {
    gameState.personalRecords = {};
  }

  const existingPR = gameState.personalRecords[exerciseId];
  const oldWeight = existingPR ? existingPR.weight : 0;

  if (val > oldWeight) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    gameState.personalRecords[exerciseId] = {
      name: exerciseName,
      weight: val,
      date: dateStr
    };

    saveData();
    // Grant +50 XP bonus for achieving a new PR
    gainXP(50);
    alert(`🏆 NEW PERSONAL RECORD! [${exerciseName.toUpperCase()}]: ${val} KG!\n+50 BONUS XP GRANTED! Keep pushing your limits, Hunter!`);
    render();
  } else if (!existingPR) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    gameState.personalRecords[exerciseId] = {
      name: exerciseName,
      weight: val,
      date: dateStr
    };
    saveData();
    render();
  }
}

/**
 * Renders achievement badges
 */
function renderBadges() {
  const container = document.getElementById("badges-container");
  const countText = document.getElementById("badge-count-text");
  if (!container) return;

  container.innerHTML = "";
  let unlockedCount = 0;

  BADGES_DATABASE.forEach(b => {
    const isUnlocked = gameState.level >= b.reqLevel;
    if (isUnlocked) unlockedCount++;

    const item = document.createElement("div");
    item.className = `badge-item ${isUnlocked ? "unlocked" : "locked"}`;
    item.title = `${b.title}: ${b.desc}`;
    item.innerHTML = `
      <span class="badge-icon">${b.icon}</span>
      <span class="badge-title">${b.title.toUpperCase()}</span>
    `;
    container.appendChild(item);
  });

  if (countText) {
    countText.textContent = `${unlockedCount} of ${BADGES_DATABASE.length} Unlocked`;
  }
}

/**
 * Renders Dungeon Archive records
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
        No dungeon logs recorded. Complete today's protocol to archive your first clear.
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
// 7. THEME & AESTHETIC CONTROLS
// ========================================================

function applyThemeAndAesthetic() {
  document.body.className = `theme-${gameState.currentTheme || "blue"} aesthetic-${gameState.currentAesthetic || "hunter"}`;

  const themeBtns = document.querySelectorAll(".theme-choice-btn");
  themeBtns.forEach(btn => {
    if (btn.getAttribute("data-theme") === gameState.currentTheme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const hunterBtn = document.getElementById("btn-aesthetic-hunter");
  const monarchBtn = document.getElementById("btn-aesthetic-monarch");

  if (hunterBtn && monarchBtn) {
    if (gameState.currentAesthetic === "monarch") {
      monarchBtn.classList.add("active");
      hunterBtn.classList.remove("active");
    } else {
      hunterBtn.classList.add("active");
      monarchBtn.classList.remove("active");
    }
  }
}

function setAppTheme(themeName) {
  const allowed = ["blue", "purple", "silver"];
  if (allowed.includes(themeName)) {
    gameState.currentTheme = themeName;
    saveData();
    render();
  }
}

function setAppAesthetic(aestheticName) {
  if (aestheticName === "hunter" || aestheticName === "monarch") {
    gameState.currentAesthetic = aestheticName;
    saveData();
    render();
  }
}

// ========================================================
// 8. QUEST INTERACTIONS & LOCKING
// ========================================================

function toggleQuest(questId) {
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
// 9. CUSTOM PROTOCOL MANAGEMENT
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
    const existing = currentSplit.exercises.find(e => e.id === exerciseId);
    if (existing) {
      if (modalTitle) modalTitle.textContent = "Edit Protocol";
      if (idInput) idInput.value = existing.id;
      if (nameInput) nameInput.value = existing.name;
      if (setsInput) setsInput.value = existing.baseSets;
      if (repsInput) repsInput.value = existing.baseReps;
      if (focusInput) focusInput.value = existing.focus || "";
    }
  } else {
    if (modalTitle) modalTitle.textContent = "Add Protocol";
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
  const focus = focusInput.value.trim() || "Target Protocol";
  const existingId = idInput.value;

  const currentSplitKey = gameState.currentSplit;
  const currentSplit = gameState.splits[currentSplitKey];

  if (existingId) {
    const exIndex = currentSplit.exercises.findIndex(e => e.id === existingId);
    if (exIndex !== -1) {
      currentSplit.exercises[exIndex].name = name;
      currentSplit.exercises[exIndex].baseSets = sets;
      currentSplit.exercises[exIndex].baseReps = reps;
      currentSplit.exercises[exIndex].focus = focus;
    }
  } else {
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

  const confirmed = confirm(`Delete "${ex.name}" from ${currentSplitKey.toUpperCase()} protocol?`);
  if (!confirmed) return;

  currentSplit.exercises = currentSplit.exercises.filter(e => e.id !== exerciseId);
  delete gameState.completedQuests[exerciseId];

  saveData();
  render();
}

// ========================================================
// 10. FINISH TRAINING DAY & RESET
// ========================================================

function finishWorkoutDay() {
  const splitData = gameState.splits[gameState.currentSplit];
  const currentTaskIds = [...splitData.exercises.map(e => e.id), ...DAILY_HABITS.map(h => h.id)];
  
  let clearedCount = 0;
  currentTaskIds.forEach(id => {
    if (gameState.completedQuests[id]) clearedCount++;
  });

  if (clearedCount === 0) {
    alert("System Alert: You have not cleared any protocols yet today! Complete at least one exercise before logging.");
    return;
  }

  const confirmLog = confirm(
    `Archive today's training (${splitData.title.split("(")[0].trim()})?\n` +
    `• Protocols Cleared: ${clearedCount}\n` +
    `• Hunter Level: ${gameState.level}\n\n` +
    `This will archive today's session and prepare fresh protocols for tomorrow.`
  );

  if (!confirmLog) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const todayIsoDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
  
  // Update consecutive day streak
  if (!gameState.lastCompletedDate) {
    gameState.currentStreak = 1;
    gameState.lastCompletedDate = todayIsoDate;
  } else if (gameState.lastCompletedDate !== todayIsoDate) {
    const lastDate = new Date(gameState.lastCompletedDate);
    const currentDate = new Date(todayIsoDate);
    const diffTime = Math.abs(currentDate - lastDate);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Completed on consecutive day
      gameState.currentStreak = (gameState.currentStreak || 0) + 1;
    } else {
      // Missed one or more days, reset streak to 1
      gameState.currentStreak = 1;
    }
    gameState.lastCompletedDate = todayIsoDate;
  }

  const historyEntry = {
    date: dateStr,
    splitName: splitData.title.split("(")[0].trim(),
    tasksCompleted: clearedCount,
    xpEarned: clearedCount * XP_PER_QUEST,
    level: gameState.level
  };

  if (!gameState.history) gameState.history = [];
  gameState.history.push(historyEntry);

  gameState.completedQuests = {};

  saveData();
  render();

  alert("DUNGEON ARCHIVED! Outstanding discipline, Hunter!");
  switchTab("history");
}

function resetTodayQuests() {
  if (confirm("Reset active protocols? Your Level, XP, and Archives remain safe.")) {
    gameState.completedQuests = {};
    saveData();
    render();
  }
}

function resetAllData() {
  if (confirm("Reset ALL data and re-awaken from Level 1? This will wipe custom protocols and archives.")) {
    localStorage.removeItem(STORAGE_KEY);
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    openAwakeningModal(false);
    render();
  }
}

// ========================================================
// 11. MODALS & CONTROLS
// ========================================================

function showLevelUpModal(oldLevel, newLevel) {
  const modal = document.getElementById("level-modal");
  const oldLevelEl = document.getElementById("modal-old-level");
  const newLevelEl = document.getElementById("modal-new-level");
  const noticeEl = document.getElementById("modal-difficulty-notice");

  if (oldLevelEl) oldLevelEl.textContent = `LV. ${oldLevel}`;
  if (newLevelEl) newLevelEl.textContent = `LV. ${newLevel}`;
  if (noticeEl) {
    noticeEl.textContent = `Protocol intensity escalated! Target sets and volume increased for Level ${newLevel}.`;
  }
  if (modal) modal.classList.add("active");
}

function closeLevelModal() {
  const modal = document.getElementById("level-modal");
  if (modal) modal.classList.remove("active");
}

function openSettingsModal() {
  switchTab("status");
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
// 12. INITIALIZATION & PWA SERVICE WORKER
// ========================================================
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  switchTab(gameState.currentTab || "quests");

  if (!gameState.awakened) {
    openAwakeningModal(false);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("System: Shadow Hunter Engine active."))
      .catch((err) => console.log("ServiceWorker registration skipped:", err));
  }
});
