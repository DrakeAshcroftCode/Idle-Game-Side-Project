import { startBattle, getEnemyPreview } from '/battlesystem.js';
import { addItemsToInventory, isItemUsable, normalizeItems, removeItemsFromInventory, useInventoryItem } from '/inventorySystem.js';
import { SHOP_CATALOG, purchaseItem } from '/shopSystem.js';

// Progression & pacing constants
const BASE_XP_TO_NEXT_LEVEL = 75;
const LEVEL_XP_GROWTH = 1.6;
const XP_GAIN_GROWTH = 1.1;
const ACTION_POINT_PER_LEVEL = 3;
const BASE_ACTION_TIMER = 6;
const REST_TIMER = 20;
const FAILURE_PITY_FACTOR = 0.2;

const UPGRADE_EFFECTS = {
    timerReductionBadge: {
        resetReduction: 1,
        label: '-1s action timers'
    },
    focusCharm: {
        penaltyReduction: 2,
        label: '-2s failure penalty'
    }
};

// Core action configuration for easy tuning
const ACTION_CONFIG = {
    cleanRoom: {
        xp: 8,
        money: 10,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 3,
        apCost: 1,
        successModifier: 0,
        successMessage: "Cleaned the room successfully!",
        failureMessage: "Failed to clean the room. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'clean-room'
    },
    washDishes: {
        xp: 6,
        money: 7,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 3,
        apCost: 1,
        successModifier: 0,
        successMessage: "Washed the dishes successfully!",
        failureMessage: "Failed to wash the dishes. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'wash-dishes'
    },
    cookMeal: {
        xp: 12,
        money: 15,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 4,
        apCost: 1,
        successModifier: -0.05,
        successMessage: "Cooked a meal successfully!",
        failureMessage: "Failed to cook the meal. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'cook-meal'
    },
    studyExam: {
        xp: 16,
        money: 20,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 4,
        apCost: 1,
        successModifier: -0.1,
        successMessage: "Studied for the exam successfully!",
        failureMessage: "Failed to study for the exam. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'study-exam'
    },
    practiceCoding: {
        xp: 30,
        money: 22,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 4,
        apCost: 1,
        successModifier: -0.25,
        successMessage: "Practiced coding successfully!",
        failureMessage: "Failed to practice coding. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'practice-coding'
    },
    takeWalk: {
        xp: 20,
        money: 6,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 2,
        apCost: 1,
        successModifier: -0.01,
        successMessage: "Took a walk successfully!",
        failureMessage: "Failed to take a walk. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'take-walk'
    },
    meditate: {
        xp: 28,
        money: 0,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 2,
        apCost: 1,
        successModifier: 0.25,
        successMessage: "Meditated successfully!",
        failureMessage: "Failed to meditate. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'meditate'
    },
    exercise: {
        xp: 24,
        money: 0,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 4,
        apCost: 1,
        successModifier: -0.25,
        successMessage: "Exercised successfully!",
        failureMessage: "Failed to exercise. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'exercise'
    },
    playGame: {
        xp: 5,
        money: 25,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 4,
        apCost: 1,
        successModifier: 0.4,
        successMessage: "Played a game successfully!",
        failureMessage: "Failed to play the game. Adding time to the timer.",
        idleEligible: true,
        buttonId: 'play-game'
    },
    sleep: {
        xp: 2,
        money: 0,
        timerReset: REST_TIMER,
        apRestore: 10,
        apThreshold: 3,
        successMessage: "You had a good night's rest!",
        idleEligible: false,
        buttonId: 'sleep'
    }
};

const ACTION_LABELS = {
    cleanRoom: 'Clean Room',
    washDishes: 'Wash Dishes',
    cookMeal: 'Cook Meal',
    studyExam: 'Study Exam',
    practiceCoding: 'Practice Coding',
    takeWalk: 'Take a Walk',
    meditate: 'Meditate',
    exercise: 'Exercise',
    playGame: 'Play Game',
    sleep: 'Sleep'
};

const ACTION_ICONS = {
    cleanRoom: 'fa-broom',
    washDishes: 'fa-utensils',
    cookMeal: 'fa-utensil-spoon',
    studyExam: 'fa-book-open',
    practiceCoding: 'fa-laptop-code',
    takeWalk: 'fa-walking',
    meditate: 'fa-praying-hands',
    exercise: 'fa-dumbbell',
    playGame: 'fa-gamepad',
    sleep: 'fa-bed'
};

const STORAGE_KEY = 'idle-hakiko-save';

function getLevelTier(level) {
    if (level < 15) {
        return 0;
    }
    if (level < 30) {
        return 1;
    }
    if (level < 50) {
        return 2;
    }
    return 3;
}

function scaleTiming(value, tier) {
    if (!value) return 0;
    const multiplier = 1 + tier * 0.2;
    return Math.round(value * multiplier);
}

function getTimerModifiers() {
    const ownedUpgrades = player?.upgrades || {};
    return Object.entries(UPGRADE_EFFECTS).reduce((acc, [key, effect]) => {
        if (ownedUpgrades[key]) {
            acc.resetReduction += effect.resetReduction || 0;
            acc.penaltyReduction += effect.penaltyReduction || 0;
            acc.labels.push(effect.label);
        }
        return acc;
    }, { resetReduction: 0, penaltyReduction: 0, labels: [] });
}

function getActionTimers(config) {
    const tier = getLevelTier(player?.level || 1);
    const baseReset = config.timerReset ?? BASE_ACTION_TIMER;
    const basePenalty = config.timerPenalty ?? 0;
    const { resetReduction, penaltyReduction } = getTimerModifiers();
    const scaledReset = scaleTiming(baseReset, tier);
    const scaledPenalty = scaleTiming(basePenalty, tier);
    return {
        timerReset: Math.max(0, scaledReset - resetReduction),
        timerPenalty: Math.max(0, scaledPenalty - penaltyReduction)
    };
}

const DOM = {
    stats: {
        level: document.getElementById('current-level'),
        xpToNextLevel: document.getElementById('xp-to-next-level'),
        actionPoints: document.getElementById('action-points'),
        countdown: document.getElementById('countdown-timer'),
        currentXP: document.getElementById('current-xp'),
        money: document.getElementById('player-money'),
        essence: document.getElementById('shadow-essence'),
        damage: document.getElementById('player-damage'),
        defense: document.getElementById('player-defense'),
        stamina: document.getElementById('player-stamina'),
        mana: document.getElementById('player-mana'),
        health: document.getElementById('player-health'),
        timerModifiers: document.getElementById('timer-modifiers'),
    },
    message: document.getElementById('message'),
    toast: document.getElementById('action-toast'),
    asyncStatus: document.getElementById('async-status'),
    inventoryList: document.getElementById('inventory-list'),
    actionsContent: document.getElementById('actions-content'),
    shop: {
        walletGold: document.getElementById('shop-gold'),
        walletEssence: document.getElementById('shop-essence'),
        items: document.getElementById('shop-items')
    },
    battle: {
        enemyName: document.getElementById('battle-enemy-name'),
        wave: document.getElementById('battle-wave'),
        enemyHealth: document.getElementById('battle-enemy-health'),
        enemyAttack: document.getElementById('battle-enemy-attack'),
        enemyDefense: document.getElementById('battle-enemy-defense'),
        enemyStatus: document.getElementById('battle-enemy-status'),
        playerStatus: document.getElementById('battle-player-status'),
        log: document.getElementById('battle-log'),
        rewardGold: document.getElementById('battle-reward-gold'),
        rewardXP: document.getElementById('battle-reward-xp'),
        rewardEssence: document.getElementById('battle-reward-essence'),
        rewardLoot: document.getElementById('battle-reward-loot'),
        rewardItems: document.getElementById('battle-reward-items'),
        rewardTier: document.getElementById('battle-reward-tier'),
        startButton: document.getElementById('start-battle'),
    }
};



// Function to handle tab navigation
function navigate(event) {
    event.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetDiv = document.getElementById(targetId);

    // Hide all divs except the target div
    document.querySelectorAll('.window').forEach(div => {
        if (div.id === targetId) {
            div.style.display = 'block'; // Show target div
        } else {
            div.style.display = 'none'; // Hide other divs
        }
    });

    // Update the selected tab
    document.querySelectorAll('menu li').forEach(li => {
        if (li.getAttribute('role') === 'tab') {
            if (li.querySelector('a').getAttribute('href') === '#' + targetId) {
                li.setAttribute('aria-selected', 'true');
            } else {
                li.removeAttribute('aria-selected');
            }
        }
    });
}

function levelName(level) {
    if (level < 10) {
        return "Noob";
    } else if (level < 20) {
        return "Neophyte";
    } else if (level < 30) {
        return "Novice";
    } else if (level < 40) {
        return "Apprentice";
    } else if (level < 50) {
        return "Adept";
    } else if (level < 60) {
        return "Journeyman";
    } else if (level < 65) {
        return "Expert";
    } else if (level < 70) {
        return "Master";
    } else if (level < 75) {
        return "Veteran";
    } else if (level < 80) {
        return "Elite";
    } else if (level < 85) {
        return "Champion";
    } else if (level < 90) {
        return "Legendary";
    } else if (level < 95 || level > 100) {
        return "Mythical";
    } else {
        return "Transcendent"; // Default level name for levels higher than 99
    }
}

function showToast(message, tone = 'info') {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${tone} show`;
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 1700);
}

function showMessage(message, tone = 'info') {
    if (!DOM.message) return;
    DOM.message.textContent = message;
    DOM.message.classList.remove('info', 'success', 'error');
    DOM.message.classList.add(tone);
}

function setAsyncStatus(text, state = 'idle') {
    if (!DOM.asyncStatus) return;
    DOM.asyncStatus.textContent = text;
    DOM.asyncStatus.dataset.state = state;
}

export class player {

    constructor(graphics) {

        this.resetToDefaults();
        this.loadDataFromLocalStorage();
        this.idleEnabled = false; // Default to idle function disabled
    }

    resetToDefaults() {
        this.level = 1;
        this.maxLevel = 100;
        this.xpToNextLevel = BASE_XP_TO_NEXT_LEVEL;
        this.baseXPMultiplier = 1;
        this.actionPoints = 10;
        this.timer = BASE_ACTION_TIMER;
        this.currentXP = 0;
        this.playerMoney = 0;
        this.shadowEssence = 0;
        this.actionSuccessRate = 0.5;
        this.inventory = [];
        this.activeActionBuff = null;
        this.upgrades = {
            timerReductionBadge: false,
            focusCharm: false
        };

        this.damage = 3; // Default damage
        this.defense = 1; // Default defense
        this.stamina = 10; // Default stamina
        this.staminaRegenRate = 1; // Default stamina regeneration rate per turn
        this.mana = 10; // Default mana
        this.health = 10; // Default health
    }

    loadDataFromLocalStorage() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const savedData = JSON.parse(raw);
            this.level = savedData.level ?? this.level;
            this.maxLevel = savedData.maxLevel ?? this.maxLevel;
            this.xpToNextLevel = savedData.xpToNextLevel ?? this.xpToNextLevel;
            this.baseXPMultiplier = savedData.baseXPMultiplier ?? this.baseXPMultiplier;
            this.actionPoints = savedData.actionPoints ?? this.actionPoints;
            this.timer = savedData.timer ?? this.timer;
            this.currentXP = savedData.currentXP ?? this.currentXP;
            this.playerMoney = savedData.playerMoney ?? this.playerMoney;
            this.shadowEssence = savedData.shadowEssence ?? this.shadowEssence;
            this.actionSuccessRate = savedData.actionSuccessRate ?? this.actionSuccessRate;
            this.inventory = normalizeItems(savedData.inventory || []);
            this.damage = savedData.damage ?? this.damage;
            this.defense = savedData.defense ?? this.defense;
            this.stamina = savedData.stamina ?? this.stamina;
            this.staminaRegenRate = savedData.staminaRegenRate ?? this.staminaRegenRate;
            this.mana = savedData.mana ?? this.mana;
            this.health = savedData.health ?? this.health;
            this.activeActionBuff = null;
            this.upgrades = {
                ...this.upgrades,
                ...(savedData.upgrades || {})
            };
        } catch (error) {
            console.warn('Could not parse save data; resetting to defaults.', error);
            this.resetToDefaults();
        }
    }

    toggleIdle() {
        this.idleEnabled = !this.idleEnabled;
        const statusText = `Idle function ${this.idleEnabled ? 'enabled' : 'disabled'}.`;
        showMessage(statusText, 'info');
        showToast(statusText, 'info');
    }
    takeDamage(damage) {
        const actualDamage = Math.max(damage - this.defense, 0);
        this.health -= actualDamage;
        return { defeated: this.health <= 0, actualDamage };
    }

    updatePlayerStats() {
        const levelDisplayName = levelName(this.level);

        DOM.stats.level.textContent = `(${this.level}) ${levelDisplayName}`;
        DOM.stats.xpToNextLevel.textContent = this.xpToNextLevel;
        DOM.stats.actionPoints.textContent = this.actionPoints;
        DOM.stats.countdown.textContent = this.timer;
        DOM.stats.currentXP.textContent = this.currentXP;
        DOM.stats.money.textContent = this.playerMoney;
        DOM.stats.essence.textContent = this.shadowEssence;
        DOM.stats.damage.textContent = this.damage;
        DOM.stats.defense.textContent = this.defense;
        DOM.stats.stamina.textContent = this.stamina;
        DOM.stats.mana.textContent = this.mana;
        DOM.stats.health.textContent = this.health;
        if (DOM.stats.timerModifiers) {
            const { resetReduction, penaltyReduction } = getTimerModifiers();
            const parts = [];
            if (resetReduction) parts.push(`-${resetReduction}s action timers`);
            if (penaltyReduction) parts.push(`-${penaltyReduction}s failure penalty`);
            DOM.stats.timerModifiers.textContent = parts.length ? parts.join(' | ') : 'None';
        }
    }

    saveDataToLocalStorage() {
        this.inventory = normalizeItems(this.inventory);
        const dataToSave = {
            level: this.level,
            maxLevel: this.maxLevel,
            xpToNextLevel: this.xpToNextLevel,
            baseXPMultiplier: this.baseXPMultiplier,
            actionPoints: this.actionPoints,
            timer: this.timer,
            currentXP: this.currentXP,
            playerMoney: this.playerMoney,
            shadowEssence: this.shadowEssence,
            actionSuccessRate: this.actionSuccessRate,
            inventory: this.inventory,
            damage: this.damage,
            defense: this.defense,
            stamina: this.stamina,
            mana: this.mana,
            health: this.health,
            staminaRegenRate: this.staminaRegenRate,
            upgrades: this.upgrades
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }

    wipeLocalStorage() {
        localStorage.removeItem(STORAGE_KEY);
        this.resetToDefaults();
        this.updatePlayerStats();
    }



    playerAction(successRate) {
        let randomValue = Math.random(); // generates a random number between 0 and 1
        return randomValue <= successRate; // returns true if action is successful
    }

    levelUp() {
        if (this.level < this.maxLevel) {
            this.level += 1;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * LEVEL_XP_GROWTH);
            this.baseXPMultiplier = parseFloat((this.baseXPMultiplier * XP_GAIN_GROWTH).toFixed(2));
            this.actionPoints += ACTION_POINT_PER_LEVEL;
            levelName(this.level);
        }
    }

    checkLevelUp() {
        let leveled = false;
        while (this.currentXP >= this.xpToNextLevel && this.level < this.maxLevel) {
            this.currentXP -= this.xpToNextLevel;
            this.levelUp();
            leveled = true;
        }
        return leveled;
    }

    addToInventory(item) {
        addItemsToInventory(this.inventory, [item]);
    }

    removeFromInventory(item) {
        removeItemsFromInventory(this.inventory, [item]);
    }

    displayInventory() {
        console.log("Inventory:");
        this.inventory.forEach(item => {
            console.log(item.name);
        });
    }
}



// Function to show the content of the first tab
function showFirstTabContent() {
    const firstTabLink = document.querySelector('menu li:first-child a');
    if (firstTabLink) {
        firstTabLink.click(); // Simulate a click event on the first tab link
        if (typeof player !== 'undefined') {
            player.timer = BASE_ACTION_TIMER; // Reset the timer to its default value
        }
    }
}

// Add event listeners to navigation links
document.querySelectorAll('menu a').forEach(link => {
    link.addEventListener('click', navigate);
});



// Call the function to show the content of the first tab on page load
showFirstTabContent();

class Item {
    constructor(name, description, effects) {
        this.name = name;
        this.description = description;
        this.effects = effects; // Effects on player stats
    }

    applyEffect(player) {
        // Apply item effects to the player
    }
}

class graphics {
    updateStatsColors(player) {
        // Calculate color for current level
        const levelColor = `rgb(0, ${Math.round(255 * (player.level / player.maxLevel))}, ${Math.round(255 * (player.level / player.maxLevel))})`;
        DOM.stats.level.style.color = levelColor;

        // Calculate color for countdown timer
        let timerColor;
        if (player.timer >= 7) {
            timerColor = 'red';
        } else if (player.timer >= 4) {
            timerColor = 'orange';
        } else {
            timerColor = 'green';
        }
        DOM.stats.countdown.style.color = timerColor;
    }

    updateButtonColor(buttonId, success) {
        const button = document.getElementById(buttonId);
        button.classList.add(success ? 'success' : 'fail');
        setTimeout(() => {
            button.classList.remove(success ? 'success' : 'fail');
        }, 1000); // Remove the color class after 1 second
    }
    updateInventory(player) {
        const inventoryElement = DOM.inventoryList;
        inventoryElement.innerHTML = '';
        if (!player.inventory.length) {
            const emptyState = document.createElement('div');
            emptyState.textContent = 'No items yet.';
            inventoryElement.appendChild(emptyState);
            return;
        }
        const header = document.createElement('div');
        header.textContent = 'Your inventory items:';
        inventoryElement.appendChild(header);

        if (player.activeActionBuff) {
            const buffBanner = document.createElement('div');
            buffBanner.textContent = `Active buff: ${player.activeActionBuff.description || 'Timer reduction ready for the next action.'}`;
            buffBanner.classList.add('message', 'info');
            inventoryElement.appendChild(buffBanner);
        }

        player.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('inventory-row');
            const qty = item.quantity ?? 1;

            const label = document.createElement('span');
            label.textContent = qty > 1 ? `${item.name} x${qty}` : item.name;
            itemElement.appendChild(label);

            if (isItemUsable(item.name)) {
                const useButton = document.createElement('button');
                useButton.textContent = 'Use';
                useButton.addEventListener('click', () => handleItemUse(item.name));
                itemElement.appendChild(useButton);
            }

            inventoryElement.appendChild(itemElement);
        });
    }
}

player = new player(); // Instantiate the player object
graphics = new graphics();
const actionCardElements = {};

function successChancePercent(config) {
    if (!config.failureMessage) {
        return 100;
    }
    const modifier = config.successModifier || 0;
    const rate = Math.min(1, Math.max(0, player.actionSuccessRate + modifier));
    return Math.round(rate * 100);
}

function createActionCard(key, config) {
    if (!DOM.actionsContent) return;

    const card = document.createElement('div');
    card.classList.add('action-card');

    const header = document.createElement('div');
    header.classList.add('action-card__header');
    const title = document.createElement('span');
    title.innerHTML = `<i class="fas ${ACTION_ICONS[key] || ''}"></i> ${ACTION_LABELS[key] || key}`;
    header.appendChild(title);

    const rewards = document.createElement('div');
    rewards.classList.add('action-card__rewards');
    const xpReward = document.createElement('span');
    xpReward.classList.add('pill');
    xpReward.textContent = `${config.xp || 0} XP`;
    const goldReward = document.createElement('span');
    goldReward.classList.add('pill');
    goldReward.textContent = `${config.money || 0} Gold`;
    rewards.appendChild(xpReward);
    rewards.appendChild(goldReward);

    const meta = document.createElement('div');
    meta.classList.add('action-card__meta');
    const apCost = document.createElement('span');
    apCost.classList.add('pill');
    apCost.textContent = `AP Cost: ${config.apCost ?? 0}`;
    const timerInfo = document.createElement('span');
    timerInfo.classList.add('pill');
    timerInfo.dataset.meta = 'timer';
    const successInfo = document.createElement('span');
    successInfo.classList.add('pill');
    successInfo.dataset.meta = 'success';
    meta.appendChild(apCost);
    meta.appendChild(timerInfo);
    meta.appendChild(successInfo);

    const progressLabel = document.createElement('div');
    progressLabel.classList.add('action-progress__label');
    const progress = document.createElement('div');
    progress.classList.add('action-progress');
    const progressBar = document.createElement('div');
    progressBar.classList.add('action-progress__bar');
    progress.appendChild(progressBar);

    const button = document.createElement('button');
    button.id = config.buttonId;
    button.innerHTML = `<i class="fas ${ACTION_ICONS[key] || ''}"></i> ${ACTION_LABELS[key] || key}`;
    button.addEventListener('click', () => handleAction(key));

    card.appendChild(header);
    card.appendChild(rewards);
    card.appendChild(meta);
    card.appendChild(progressLabel);
    card.appendChild(progress);
    card.appendChild(button);

    DOM.actionsContent.appendChild(card);

    actionCardElements[key] = {
        progressBar,
        progressLabel,
        timerInfo,
        successInfo
    };
}

function renderActionCards() {
    if (!DOM.actionsContent) return;
    DOM.actionsContent.innerHTML = '';
    Object.entries(ACTION_CONFIG).forEach(([key, config]) => {
        createActionCard(key, config);
    });
    updateActionCards();
}

function updateActionCards() {
    Object.entries(actionCardElements).forEach(([key, elements]) => {
        const config = ACTION_CONFIG[key];
        if (!config) return;
        const { timerReset } = getActionTimers(config);
        const resetTime = timerReset || 1;
        const remaining = player.timer;
        const progressPercent = Math.min(100, Math.max(0, ((resetTime - remaining) / resetTime) * 100));

        elements.progressBar.style.width = `${progressPercent}%`;
        elements.progressLabel.textContent = remaining > 0 ? `${remaining}s until ready` : 'Ready to perform';
        elements.timerInfo.textContent = `Timer: ${timerReset ?? 0}s`;
        elements.successInfo.textContent = `Success: ${successChancePercent(config)}%`;
    });
}

function handleItemUse(itemName) {
    const result = useInventoryItem(player, itemName);
    const tone = result.tone || (result.success ? 'success' : 'error');
    showMessage(result.message, tone);
    showToast(result.message, result.success ? 'success' : 'error');
    refreshUI();
    player.saveDataToLocalStorage();
}

function renderShopWallet() {
    if (!DOM.shop.walletGold || !DOM.shop.walletEssence) return;
    DOM.shop.walletGold.textContent = player.playerMoney;
    DOM.shop.walletEssence.textContent = player.shadowEssence;
}

function renderShopItems() {
    if (!DOM.shop.items) return;
    DOM.shop.items.innerHTML = '';

    SHOP_CATALOG.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.classList.add('shop-item');

        const title = document.createElement('strong');
        title.textContent = item.name;

        const description = document.createElement('div');
        description.textContent = item.description;

        const cost = document.createElement('div');
        cost.textContent = `Cost: ${item.cost.gold} gold + ${item.cost.essence} essence`;

        const button = document.createElement('button');
        const isUpgradeOwned = item.reward.upgrade && player.upgrades[item.reward.upgrade];
        button.textContent = isUpgradeOwned ? 'Owned' : 'Buy';
        button.disabled = Boolean(isUpgradeOwned);
        button.addEventListener('click', () => {
            const result = purchaseItem(player, item.id);
            showMessage(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                refreshUI();
                player.saveDataToLocalStorage();
                renderShopItems();
            }
            renderShopWallet();
        });

        itemCard.appendChild(title);
        itemCard.appendChild(description);
        itemCard.appendChild(cost);
        itemCard.appendChild(button);
        DOM.shop.items.appendChild(itemCard);
    });
}

function refreshUI(message, tone = 'info') {
    player.updatePlayerStats();
    graphics.updateStatsColors(player);
    graphics.updateInventory(player);
    renderShopWallet();
    updateActionCards();
    if (message) {
        showMessage(message, tone);
    }
}

window.addEventListener('beforeunload', () => {
    player.saveDataToLocalStorage();
});

// COMBAT SYSTEM

function canPerformAction(actionKey, config) {
    if (!config) return false;
    if (config.apThreshold !== undefined && player.actionPoints > config.apThreshold) {
        showMessage("You aren't tired! (Must have less than 3 AP.)", 'error');
        return false;
    }
    if (player.actionPoints < (config.apCost || 0)) {
        showMessage("You are out of Action Points!", 'error');
        return false;
    }
    if (player.timer >= 1) {
        showMessage("You cannot perform this action. Timer is not at zero.", 'error');
        return false;
    }
    return true;
}

function calculateSuccess(config) {
    if (!config.failureMessage) {
        return true;
    }
    const modifier = config.successModifier || 0;
    const successRate = Math.min(1, Math.max(0, player.actionSuccessRate + modifier));
    return player.playerAction(successRate);
}

function pullActiveBuff() {
    const buff = player.activeActionBuff;
    player.activeActionBuff = null;
    return buff;
}

function applyOutcome(config, success) {
    const { timerReset, timerPenalty } = getActionTimers(config);
    const xpGain = Math.round((config.xp || 0) * player.baseXPMultiplier);
    const pityXP = Math.max(0, Math.floor(xpGain * FAILURE_PITY_FACTOR));
    const pityGold = Math.max(0, Math.floor((config.money || 0) * FAILURE_PITY_FACTOR));
    const tone = success ? 'success' : 'error';
    const consumedBuff = pullActiveBuff();
    const timerReduction = consumedBuff?.timerReduction || 0;
    const buffNote = consumedBuff?.description;
    if (success) {
        player.currentXP += xpGain;
        player.playerMoney += config.money || 0;
        if (config.timerReset !== undefined) {
            const adjustedTimer = Math.max(0, timerReset - timerReduction);
            player.timer = adjustedTimer;
        }
        showMessage(config.successMessage, tone);
        showToast(config.successMessage, tone);
    } else {
        if (timerPenalty) {
            const penalizedTimer = player.timer + timerPenalty;
            const cappedTimer = config.timerReset !== undefined
                ? Math.min(timerReset, penalizedTimer)
                : penalizedTimer;
            player.timer = Math.max(0, cappedTimer - timerReduction);
        } else if (timerReduction) {
            player.timer = Math.max(0, player.timer - timerReduction);
        }
        if (pityXP) {
            player.currentXP += pityXP;
        }
        if (pityGold) {
            player.playerMoney += pityGold;
        }

        const pityParts = [];
        if (pityXP) pityParts.push(`${pityXP} XP`);
        if (pityGold) pityParts.push(`${pityGold} gold`);
        const pityText = pityParts.length ? ` You still earned ${pityParts.join(' and ')}.` : '';
        const failureMessage = `${config.failureMessage}${pityText}`;
        showMessage(failureMessage, tone);
        showToast(failureMessage, tone);
    }

    if (config.apRestore) {
        player.actionPoints = config.apRestore;
    } else {
        player.actionPoints -= config.apCost || 0;
    }

    return { buffNote };
}

function finalizeAction(actionKey, success, buffNote) {
    const config = ACTION_CONFIG[actionKey];
    if (config && config.buttonId) {
        graphics.updateButtonColor(config.buttonId, success);
        setTimeout(() => {
            document.getElementById(config.buttonId).classList.remove('success', 'fail');
        }, 2000);
    }
    player.checkLevelUp();
    refreshUI();
    if (buffNote) {
        showToast(buffNote, 'info');
    }
    player.saveDataToLocalStorage();
}

function handleAction(actionKey) {
    const config = ACTION_CONFIG[actionKey];
    if (!canPerformAction(actionKey, config)) return;

    const success = calculateSuccess(config);
    const { buffNote } = applyOutcome(config, success);
    finalizeAction(actionKey, success, buffNote);
}

// Countdown function
setInterval(() => {
    if (player.timer > 0) {
        player.timer--;
        player.checkLevelUp();
        refreshUI();
    }
    if (player.timer === 0) {
        if (player.idleEnabled) {
            const sleepThreshold = ACTION_CONFIG.sleep?.apThreshold ?? 2;
            if (player.actionPoints <= sleepThreshold) {
                handleAction('sleep');
                return;
            }

            const highValueActions = Object.entries(ACTION_CONFIG)
                .filter(([, config]) => config.idleEligible && player.actionPoints >= (config.apCost ?? 0))
                .map(([key, config]) => {
                    const { timerReset } = getActionTimers(config);
                    const xpPerSecond = (config.xp || 0) / Math.max(1, timerReset || BASE_ACTION_TIMER);
                    const weight = Math.max(0.1, xpPerSecond / Math.max(1, config.apCost || 1));
                    return { key, weight };
                });

            const totalWeight = highValueActions.reduce((sum, entry) => sum + entry.weight, 0);

            if (totalWeight === 0 || highValueActions.length === 0) {
                handleAction('sleep');
                return;
            }

            let roll = Math.random() * totalWeight;
            const selected = highValueActions.find(entry => {
                roll -= entry.weight;
                return roll <= 0;
            }) || highValueActions[highValueActions.length - 1];

            handleAction(selected.key);
        } else {
            showMessage("Timer has reached zero. You can take an action now.", 'info');
        }
    } else if (player.timer > 1 && player.timer < 8) {
        showMessage("You need a breather before taking another action.", 'info');
    }

}, 1000);

const item = new Item('Health Potion', 'Restores health', {
    health: 10
});
player.displayInventory();
renderShopItems();
renderShopWallet();
renderActionCards();
refreshUI('Welcome back!', 'info');
setAsyncStatus('Ready', 'idle');

function renderStatusEffects(effects) {
    if (!effects || effects.length === 0) {
        return 'None';
    }
    return effects.map(effect => `${effect.label || effect.type} (${effect.duration} turns)`).join(', ');
}

function renderRewardItems(items = []) {
    if (!DOM.battle.rewardItems) return;
    DOM.battle.rewardItems.innerHTML = '';
    const normalizedItems = normalizeItems(items);
    if (!normalizedItems.length) {
        DOM.battle.rewardItems.textContent = 'None';
        return;
    }
    normalizedItems.forEach(item => {
        const entry = document.createElement('div');
        const qty = item.quantity ?? 1;
        entry.textContent = qty > 1 ? `${item.name} x${qty}` : item.name;
        DOM.battle.rewardItems.appendChild(entry);
    });
}

function updateBattlePanel(battleState) {
    if (!battleState) return;
    const { enemy, wave, player: battlePlayer } = battleState;

    DOM.battle.enemyName.textContent = enemy.name;
    DOM.battle.wave.textContent = `${wave.tier} (Difficulty ${wave.difficulty})`;
    DOM.battle.enemyHealth.textContent = `${Math.max(0, enemy.health).toFixed(1)} / ${enemy.maxHealth}`;
    DOM.battle.enemyAttack.textContent = enemy.attack;
    DOM.battle.enemyDefense.textContent = enemy.defense;
    DOM.battle.enemyStatus.textContent = renderStatusEffects(enemy.statusEffects);
    DOM.battle.playerStatus.textContent = renderStatusEffects(battlePlayer.statusEffects);

    const lastLog = battleState.log[battleState.log.length - 1];
    if (lastLog) {
        const line = document.createElement('div');
        line.textContent = lastLog;
        DOM.battle.log.appendChild(line);
        DOM.battle.log.scrollTop = DOM.battle.log.scrollHeight;
    }
}

function previewNextEnemy() {
    const preview = getEnemyPreview(player);
    DOM.battle.enemyName.textContent = preview.enemy.name;
    DOM.battle.wave.textContent = `${preview.wave.tier} (Difficulty ${preview.wave.difficulty})`;
    DOM.battle.enemyHealth.textContent = `${preview.enemy.health} / ${preview.enemy.maxHealth}`;
    DOM.battle.enemyAttack.textContent = preview.enemy.attack;
    DOM.battle.enemyDefense.textContent = preview.enemy.defense;
    DOM.battle.enemyStatus.textContent = 'None';
    DOM.battle.playerStatus.textContent = renderStatusEffects(player.statusEffects);
    DOM.battle.log.textContent = 'Waiting for battle start...';
}

function handleBattleEnd(battleState, playerWon) {
    if (playerWon && battleState.rewards) {
        const { currencies, xp, items, tier } = battleState.rewards;
        DOM.battle.rewardGold.textContent = currencies.gold;
        DOM.battle.rewardEssence.textContent = currencies.essence;
        DOM.battle.rewardXP.textContent = xp;
        DOM.battle.rewardLoot.textContent = items?.[0]?.name || 'None';
        DOM.battle.rewardTier.textContent = tier;
        renderRewardItems(items);
        graphics.updateInventory(player);
    } else {
        DOM.battle.rewardGold.textContent = 0;
        DOM.battle.rewardEssence.textContent = 0;
        DOM.battle.rewardXP.textContent = 0;
        DOM.battle.rewardLoot.textContent = 'None';
        DOM.battle.rewardItems.textContent = 'None';
        DOM.battle.rewardTier.textContent = 'None';
    }
    refreshUI();
    showMessage(playerWon ? 'You won the battle!' : 'You were defeated.', playerWon ? 'success' : 'error');
    showToast(playerWon ? 'You won the battle!' : 'You were defeated.', playerWon ? 'success' : 'error');
    renderShopWallet();
    previewNextEnemy();
}

DOM.battle.startButton.addEventListener('click', async () => {
    DOM.battle.startButton.disabled = true;
    DOM.battle.log.textContent = '';
    setAsyncStatus('Preparing battle...', 'loading');
    try {
        const battleState = await startBattle(player, {
            onBattleStart: (state) => {
                setAsyncStatus('Battle in progress...', 'loading');
                updateBattlePanel(state);
            },
            onUpdate: updateBattlePanel,
            onBattleEnd: (state, playerWon) => {
                handleBattleEnd(state, playerWon);
                setAsyncStatus('Ready', 'idle');
                player.saveDataToLocalStorage();
            }
        });
        return battleState;
    } catch (error) {
        console.error('Battle failed to start', error);
        setAsyncStatus('Battle failed to start', 'error');
        showMessage('Battle failed to start. Please try again.', 'error');
        showToast('Battle failed to start. Please try again.', 'error');
        return null;
    } finally {
        DOM.battle.startButton.disabled = false;
    }
});

previewNextEnemy();


document.getElementById('toggle-idle').addEventListener('click', () => {
    player.toggleIdle();
});

document.getElementById('clearData').addEventListener('click', function() {
    player.wipeLocalStorage();
    location.reload(); // Reload the page after clearing the data
});