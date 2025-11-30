import { startBattle, getEnemyPreview } from '/battlesystem.js';

// Progression & pacing constants
const BASE_XP_TO_NEXT_LEVEL = 75;
const LEVEL_XP_GROWTH = 1.6;
const XP_GAIN_GROWTH = 1.1;
const ACTION_POINT_PER_LEVEL = 3;
const BASE_ACTION_TIMER = 10;
const REST_TIMER = 20;

// Core action configuration for easy tuning
const ACTION_CONFIG = {
    cleanRoom: {
        xp: 8,
        money: 10,
        timerReset: BASE_ACTION_TIMER,
        timerPenalty: 11,
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
        timerPenalty: 13,
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
        timerPenalty: 15,
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
        timerPenalty: 17,
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
        timerPenalty: 14,
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
        timerPenalty: 11,
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
        timerPenalty: 13,
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
        timerPenalty: 16,
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
        timerPenalty: 20,
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

export class player {
    
    constructor(graphics) {
        
        // Initialize player properties with default values or retrieve them from local storage if available
        const savedData = JSON.parse(localStorage.getItem('savedData'));
        if (savedData) {
            this.level = savedData.level;
            this.maxLevel = savedData.maxLevel;
            this.xpToNextLevel = savedData.xpToNextLevel;
            this.baseXPMultiplier = savedData.baseXPMultiplier;
            this.actionPoints = savedData.actionPoints;
            this.timer = savedData.timer;
            this.currentXP = savedData.currentXP;
            this.playerMoney = savedData.playerMoney;
            this.actionSuccessRate = savedData.actionSuccessRate;
            this.inventory = savedData.inventory ? savedData.inventory : [];
        } else {
            this.level = 1;
            this.maxLevel = 100;
            this.xpToNextLevel = BASE_XP_TO_NEXT_LEVEL;
            this.baseXPMultiplier = 1;
            this.actionPoints = 10;
            this.timer = BASE_ACTION_TIMER;
            this.currentXP = 0;
            this.playerMoney = 0;
            this.actionSuccessRate = 0.5;
            this.inventory = [];
        }
        
        // Initialize additional player properties
        this.idleEnabled = false; // Default to idle function disabled

        this.damage = 3; // Default damage
        this.defense = 1; // Default defense
        this.stamina = 10; // Default stamina
        this.staminaRegenRate = 1; // Default stamina regeneration rate per turn
        this.mana = 10; // Default mana
        this.health = 10; // Default health
    }

    toggleIdle() {
        this.idleEnabled = !this.idleEnabled;
        showMessage(`Idle function ${this.idleEnabled ? 'enabled' : 'disabled'}.`);
    }
    takeDamage(damage) {
        const actualDamage = Math.max(damage - this.defense, 0);
        this.health -= actualDamage;
        return { defeated: this.health <= 0, actualDamage };
    }

    updatePlayerStats() {
        let levelDisplayName = levelName(this.level);;

        document.getElementById('current-level').textContent = `(${this.level}) ${levelDisplayName}`;
        document.getElementById('xp-to-next-level').textContent = this.xpToNextLevel;
        document.getElementById('action-points').textContent = this.actionPoints;
        document.getElementById('countdown-timer').textContent = this.timer;
        document.getElementById('current-xp').textContent = this.currentXP;
        document.getElementById('player-money').textContent = this.playerMoney;
        document.getElementById('player-damage').textContent = this.damage;
        document.getElementById('player-defense').textContent = this.defense;
        document.getElementById('player-stamina').textContent = this.stamina;
        document.getElementById('player-mana').textContent = this.mana;
        document.getElementById('player-health').textContent = this.health;
    }

    saveDataToLocalStorage() {
        const dataToSave = {
            level: this.level,
            maxLevel: this.maxLevel,
            xpToNextLevel: this.xpToNextLevel,
            baseXPMultiplier: this.baseXPMultiplier,
            actionPoints: this.actionPoints,
            timer: this.timer,
            currentXP: this.currentXP,
            playerMoney: this.playerMoney,
            actionSuccessRate: this.actionSuccessRate,
            inventory: this.inventory,
            damage: this.damage,
            defense: this.defense,
            stamina: this.stamina,
            mana: this.mana,
            health: this.health,
            staminaRegenRate: this.staminaRegenRate
        };
        localStorage.setItem('savedData', JSON.stringify(dataToSave));
    }

    wipeLocalStorage() {
        localStorage.removeItem('savedData');
        // Reset player properties to default values
        this.level = 1;
        this.maxLevel = 100;
        this.xpToNextLevel = BASE_XP_TO_NEXT_LEVEL;
        this.baseXPMultiplier = 1;
        this.actionPoints = 10;
        this.timer = BASE_ACTION_TIMER;
        this.currentXP = 0;
        this.playerMoney = 0;
        this.actionSuccessRate = 0.5;
        this.inventory = [];
        this.damage = 1; // Default damage
        this.defense = 1; // Default defense
        this.stamina = 10; // Default stamina
        this.staminaRegenRate = 1;
        this.mana = 10; // Default mana
        this.health = 10; // Default health
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
        while (this.currentXP >= this.xpToNextLevel && this.level < this.maxLevel) {
            this.currentXP -= this.xpToNextLevel;
            this.levelUp();
        }
        this.updatePlayerStats();
    }

    addToInventory(item) {
        this.inventory.push(item);
    }

    removeFromInventory(item) {
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
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

// Add event listener for the beforeunload event
window.addEventListener('beforeunload', function(event) {
    // Call saveDataToLocalStorage() to save the player's data
    player.saveDataToLocalStorage();
});




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
        document.getElementById('current-level').style.color = levelColor;

        // Calculate color for countdown timer
        let timerColor;
        if (player.timer >= 7) {
            timerColor = 'red';
        } else if (player.timer >= 4) {
            timerColor = 'orange';
        } else {
            timerColor = 'green';
        }
        document.getElementById('countdown-timer').style.color = timerColor;
    }

    showMessage(message) {
        document.getElementById('message').textContent = message;
    }

    updateButtonColor(buttonId, success) {
        const button = document.getElementById(buttonId);
        button.classList.add(success ? 'success' : 'fail');
        setTimeout(() => {
            button.classList.remove(success ? 'success' : 'fail');
        }, 1000); // Remove the color class after 1 second
    }
    updateInventory(player) {
        const inventoryElement = document.getElementById('inventory');
        inventoryElement.innerHTML = '' + 'Your inventory items:'; // Clear previous inventory display
        player.inventory.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.textContent = item.name;
            inventoryElement.appendChild(itemElement);
        });
    }
}

player = new player(); // Instantiate the player object
graphics = new graphics();

function showMessage(message) {
    document.getElementById('message').textContent = message;
}

// COMBAT SYSTEM

function canPerformAction(actionKey, config) {
    if (!config) return false;
    if (config.apThreshold !== undefined && player.actionPoints > config.apThreshold) {
        showMessage("You aren't tired! (Must have less than 3 AP.)");
        return false;
    }
    if (player.actionPoints < (config.apCost || 0)) {
        showMessage("You are out of Action Points!");
        return false;
    }
    if (player.timer >= 1) {
        showMessage("You cannot perform this action. Timer is not at zero.");
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

function applyOutcome(config, success) {
    const xpGain = Math.round((config.xp || 0) * player.baseXPMultiplier);
    if (success) {
        player.currentXP += xpGain;
        player.playerMoney += config.money || 0;
        if (config.timerReset !== undefined) {
            player.timer = config.timerReset;
        }
        showMessage(config.successMessage);
    } else {
        if (config.timerPenalty) {
            player.timer += config.timerPenalty;
        }
        showMessage(config.failureMessage);
    }

    if (config.apRestore) {
        player.actionPoints = config.apRestore;
    } else {
        player.actionPoints -= config.apCost || 0;
    }
}

function finalizeAction(actionKey, success) {
    const config = ACTION_CONFIG[actionKey];
    if (config && config.buttonId) {
        graphics.updateButtonColor(config.buttonId, success);
        setTimeout(() => {
            document.getElementById(config.buttonId).classList.remove('success', 'fail');
        }, 2000);
    }
    player.checkLevelUp();
    graphics.updateStatsColors(player);
    player.saveDataToLocalStorage();
}

function handleAction(actionKey) {
    const config = ACTION_CONFIG[actionKey];
    if (!canPerformAction(actionKey, config)) return;

    const success = calculateSuccess(config);
    applyOutcome(config, success);
    finalizeAction(actionKey, success);
}

// Countdown function
setInterval(() => {
    if (player.timer > 0) {
        player.timer--;
        graphics.updateStatsColors(player);
        player.updatePlayerStats();
        player.checkLevelUp();
    }
    if (player.timer === 0) {
        if (player.idleEnabled) {
            if (player.actionPoints > 0) {
                const idleActions = Object.entries(ACTION_CONFIG)
                    .filter(([, config]) => config.idleEligible)
                    .map(([key]) => key);
                const randomAction = idleActions[Math.floor(Math.random() * idleActions.length)];
                handleAction(randomAction);
            } else {
                // Sleep if the player runs out of action points
                handleAction('sleep');
            }
        } else {
            graphics.showMessage("Timer has reached zero. You can take an action now.");
        }
    } else if (player.timer > 1 && player.timer < 8) {
        graphics.showMessage("You need a breather before taking another action.");
    }

}, 1000);

const item = new Item('Health Potion', 'Restores health', {
    health: 10
});
player.displayInventory();
// Update UI
player.updatePlayerStats();
graphics.updateStatsColors(player);
graphics.updateInventory(player);

function renderStatusEffects(effects) {
    if (!effects || effects.length === 0) {
        return 'None';
    }
    return effects.map(effect => `${effect.label || effect.type} (${effect.duration} turns)`).join(', ');
}

function updateBattlePanel(battleState) {
    if (!battleState) return;
    const { enemy, wave, player: battlePlayer } = battleState;

    document.getElementById('battle-enemy-name').textContent = enemy.name;
    document.getElementById('battle-wave').textContent = `${wave.tier} (Difficulty ${wave.difficulty})`;
    document.getElementById('battle-enemy-health').textContent = `${Math.max(0, enemy.health).toFixed(1)} / ${enemy.maxHealth}`;
    document.getElementById('battle-enemy-attack').textContent = enemy.attack;
    document.getElementById('battle-enemy-defense').textContent = enemy.defense;
    document.getElementById('battle-enemy-status').textContent = renderStatusEffects(enemy.statusEffects);
    document.getElementById('battle-player-status').textContent = renderStatusEffects(battlePlayer.statusEffects);

    const lastLog = battleState.log[battleState.log.length - 1];
    if (lastLog) {
        const logElement = document.getElementById('battle-log');
        const line = document.createElement('div');
        line.textContent = lastLog;
        logElement.appendChild(line);
        logElement.scrollTop = logElement.scrollHeight;
    }
}

function previewNextEnemy() {
    const preview = getEnemyPreview(player);
    document.getElementById('battle-enemy-name').textContent = preview.enemy.name;
    document.getElementById('battle-wave').textContent = `${preview.wave.tier} (Difficulty ${preview.wave.difficulty})`;
    document.getElementById('battle-enemy-health').textContent = `${preview.enemy.health} / ${preview.enemy.maxHealth}`;
    document.getElementById('battle-enemy-attack').textContent = preview.enemy.attack;
    document.getElementById('battle-enemy-defense').textContent = preview.enemy.defense;
    document.getElementById('battle-enemy-status').textContent = 'None';
    document.getElementById('battle-player-status').textContent = renderStatusEffects(player.statusEffects);
    document.getElementById('battle-log').textContent = 'Waiting for battle start...';
}

function handleBattleEnd(battleState, playerWon) {
    if (playerWon && battleState.rewards) {
        document.getElementById('battle-reward-gold').textContent = battleState.rewards.gold;
        document.getElementById('battle-reward-xp').textContent = battleState.rewards.experience;
        document.getElementById('battle-reward-loot').textContent = battleState.rewards.loot || 'None';
        document.getElementById('battle-reward-tier').textContent = battleState.rewards.tier;
        graphics.updateInventory(player);
    } else {
        document.getElementById('battle-reward-gold').textContent = 0;
        document.getElementById('battle-reward-xp').textContent = 0;
        document.getElementById('battle-reward-loot').textContent = 'None';
        document.getElementById('battle-reward-tier').textContent = 'None';
    }
    player.updatePlayerStats();
    graphics.updateStatsColors(player);
    graphics.showMessage(playerWon ? 'You won the battle!' : 'You were defeated.');
    previewNextEnemy();
}

document.getElementById('start-battle').addEventListener('click', async () => {
    document.getElementById('start-battle').disabled = true;
    document.getElementById('battle-log').textContent = '';
    const battleState = await startBattle(player, {
        onBattleStart: updateBattlePanel,
        onUpdate: updateBattlePanel,
        onBattleEnd: handleBattleEnd
    });
    document.getElementById('start-battle').disabled = false;
    return battleState;
});

previewNextEnemy();


document.getElementById('clean-room').addEventListener('click', function() {
    handleAction('cleanRoom');
});
document.getElementById('wash-dishes').addEventListener('click', function() {
    handleAction('washDishes');
});
document.getElementById('cook-meal').addEventListener('click', function() {
    handleAction('cookMeal');
});
document.getElementById('study-exam').addEventListener('click', function() {
    handleAction('studyExam');
});
document.getElementById('practice-coding').addEventListener('click', function() {
    handleAction('practiceCoding');
});
document.getElementById('take-walk').addEventListener('click', function() {
    handleAction('takeWalk');
});
document.getElementById('meditate').addEventListener('click', function() {
    handleAction('meditate');
});
document.getElementById('exercise').addEventListener('click', function() {
    handleAction('exercise');
});
document.getElementById('play-game').addEventListener('click', function() {
    handleAction('playGame');
});
document.getElementById('sleep').addEventListener('click', function() {
    handleAction('sleep');
});

document.getElementById('toggle-idle').addEventListener('click', () => {
    player.toggleIdle();
});

document.getElementById('clearData').addEventListener('click', function() {
    player.wipeLocalStorage();
    location.reload(); // Reload the page after clearing the data
});