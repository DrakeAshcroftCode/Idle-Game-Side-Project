import { addItemsToInventory } from './inventorySystem.js';

export class Enemy {
    constructor({ name, health, attack, defense, staminaRegenRate, mana, difficulty, rewardTier, statusVulnerabilities = [] }) {
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.attack = attack;
        this.defense = defense;
        this.staminaRegenRate = staminaRegenRate;
        this.mana = mana;
        this.difficulty = difficulty;
        this.rewardTier = rewardTier;
        this.statusVulnerabilities = statusVulnerabilities;
        this.statusEffects = [];
    }

    performAttack() {
        return this.attack;
    }

    takeDamage(damage) {
        const actualDamage = Math.max(damage - this.defense, 0);
        this.health -= actualDamage;
        return { defeated: this.health <= 0, actualDamage };
    }
}

const enemyWaves = [
    {
        tier: "Minor Shadows",
        difficulty: 1,
        enemies: [
            {
                name: "Anger",
                health: 20,
                attack: 3,
                defense: 1,
                staminaRegenRate: 1,
                mana: 10,
                rewardTier: "basic",
                statusVulnerabilities: ["burn"]
            },
            {
                name: "Anxiety",
                health: 14,
                attack: 4,
                defense: 1,
                staminaRegenRate: 2,
                mana: 20,
                rewardTier: "basic",
                statusVulnerabilities: ["weaken"]
            }
        ]
    },
    {
        tier: "Lingering Doubts",
        difficulty: 2,
        enemies: [
            {
                name: "Depression",
                health: 26,
                attack: 5,
                defense: 2,
                staminaRegenRate: 3,
                mana: 30,
                rewardTier: "standard",
                statusVulnerabilities: ["burn", "bleed"]
            },
            {
                name: "Self-Doubt",
                health: 30,
                attack: 6,
                defense: 3,
                staminaRegenRate: 4,
                mana: 25,
                rewardTier: "standard",
                statusVulnerabilities: ["weaken"]
            }
        ]
    },
    {
        tier: "Night Terrors",
        difficulty: 3,
        enemies: [
            {
                name: "Insomnia",
                health: 40,
                attack: 7,
                defense: 4,
                staminaRegenRate: 4,
                mana: 40,
                rewardTier: "elite",
                statusVulnerabilities: ["bleed"]
            },
            {
                name: "Nightmare",
                health: 55,
                attack: 8,
                defense: 5,
                staminaRegenRate: 5,
                mana: 45,
                rewardTier: "elite",
                statusVulnerabilities: ["burn", "weaken"]
            }
        ]
    }
];

function selectWaveForPlayer(playerLevel) {
    if (playerLevel > 20) {
        return enemyWaves[2];
    }
    if (playerLevel > 10) {
        return enemyWaves[1];
    }
    return enemyWaves[0];
}

function createEnemy(playerLevel) {
    const wave = selectWaveForPlayer(playerLevel);
    const randomIndex = Math.floor(Math.random() * wave.enemies.length);
    const enemy = new Enemy({ ...wave.enemies[randomIndex], difficulty: wave.difficulty });
    return { enemy, wave };
}

function ensureStatusContainer(character) {
    if (!character.statusEffects) {
        character.statusEffects = [];
    }
}

function applyStatusTick(target) {
    ensureStatusContainer(target);
    const results = [];
    target.statusEffects = target.statusEffects.flatMap(effect => {
        let remaining = effect.duration - 1;
        if (effect.type === "burn") {
            target.health -= effect.magnitude;
            results.push(`${target.name} suffers ${effect.magnitude} burn damage.`);
        }
        if (effect.type === "bleed") {
            target.health -= effect.magnitude;
            results.push(`${target.name} bleeds for ${effect.magnitude} damage.`);
        }
        if (remaining <= 0) {
            results.push(`${target.name} is no longer affected by ${effect.label}.`);
            return [];
        }
        return [{ ...effect, duration: remaining }];
    });
    return results;
}

function maybeApplyStatus(target, type, chance, magnitude, duration) {
    ensureStatusContainer(target);
    if (Math.random() <= chance) {
        target.statusEffects.push({ type, magnitude, duration, label: type });
        return true;
    }
    return false;
}

function calculateCriticalMultiplier(baseChance = 0.15, criticalBonus = 0.5) {
    return Math.random() <= baseChance ? 1 + criticalBonus : 1;
}

export function calculateBattleRewards(enemy) {
    const currencies = {
        gold: Math.floor(12 * enemy.difficulty + Math.random() * 6 * enemy.difficulty),
        essence: Math.max(1, Math.ceil(enemy.difficulty * 0.6))
    };
    const experience = Math.floor(9 * enemy.difficulty + Math.random() * 3 * enemy.difficulty);
    const lootTable = {
        basic: [{ name: "Faded Trinket", quantity: 1 }],
        standard: [
            { name: "Hardened Resolve", quantity: 1 },
            { name: "Focus Token", quantity: 1 }
        ],
        elite: [
            { name: "Echoing Sigil", quantity: 1 },
            { name: "Crystalized Courage", quantity: 1 }
        ]
    };
    const lootOptions = lootTable[enemy.rewardTier] || [];
    const items = lootOptions.length
        ? [lootOptions[Math.floor(Math.random() * lootOptions.length)]]
        : [];

    return {
        currencies,
        xp: experience,
        items,
        tier: enemy.rewardTier
    };
}

export function attackEnemy(battleState, callbacks = {}) {
    const { enemy, player } = battleState;
    ensureStatusContainer(player);
    ensureStatusContainer(enemy);

    const criticalMultiplier = calculateCriticalMultiplier(0.2, 0.75);
    const damage = player.damage * criticalMultiplier;
    const damageResult = enemy.takeDamage(damage);
    battleState.log.push(`You attack ${enemy.name} for ${damageResult.actualDamage.toFixed(1)} damage${criticalMultiplier > 1 ? " (critical!)" : ""}.`);

    if (maybeApplyStatus(enemy, "burn", enemy.statusVulnerabilities.includes("burn") ? 0.4 : 0.15, 2 + battleState.wave.difficulty, 3)) {
        battleState.log.push(`${enemy.name} is burning!`);
    }

    const statusLogs = applyStatusTick(enemy);
    battleState.log.push(...statusLogs);

    if (enemy.health <= 0) {
        finishBattle(battleState, callbacks, true);
        return;
    }

    callbacks.onUpdate?.(battleState);
}

export function enemyAttack(battleState, callbacks = {}) {
    const { enemy, player } = battleState;
    ensureStatusContainer(player);
    ensureStatusContainer(enemy);

    const weakened = player.statusEffects.some(effect => effect.type === "weaken");
    const attackModifier = weakened ? 0.8 : 1;
    const criticalMultiplier = calculateCriticalMultiplier(0.1, 0.5);
    const damage = enemy.performAttack() * attackModifier * criticalMultiplier;
    const damageResult = player.takeDamage(damage);
    battleState.log.push(`${enemy.name} attacks you for ${damageResult.actualDamage.toFixed(1)} damage${criticalMultiplier > 1 ? " (critical!)" : ""}.`);

    if (maybeApplyStatus(player, "weaken", 0.2, 0, 2)) {
        battleState.log.push("Your strength is sapped! Attack reduced temporarily.");
    }
    if (maybeApplyStatus(player, "bleed", 0.15, battleState.wave.difficulty + 1, 2)) {
        battleState.log.push("You are bleeding!");
    }

    const statusLogs = applyStatusTick(player);
    battleState.log.push(...statusLogs);

    if (player.health <= 0) {
        finishBattle(battleState, callbacks, false);
        return;
    }

    callbacks.onUpdate?.(battleState);
}

export async function startBattle(player, callbacks = {}) {
    const { enemy, wave } = createEnemy(player.level || 1);
    const battleState = {
        player,
        enemy,
        wave,
        rewards: null,
        active: true,
        log: []
    };

    callbacks.onBattleStart?.(battleState);
    callbacks.onUpdate?.(battleState);

    while (battleState.active) {
        attackEnemy(battleState, callbacks);
        if (!battleState.active) break;
        await new Promise(resolve => setTimeout(resolve, 600));
        enemyAttack(battleState, callbacks);
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    return battleState;
}

function finishBattle(battleState, callbacks, playerWon) {
    battleState.active = false;
    if (playerWon) {
        battleState.rewards = calculateBattleRewards(battleState.enemy);
        battleState.player.currentXP += battleState.rewards.xp;
        battleState.player.playerMoney += battleState.rewards.currencies.gold;
        battleState.player.shadowEssence += battleState.rewards.currencies.essence;
        addItemsToInventory(battleState.player.inventory, battleState.rewards.items);
    }
    callbacks.onBattleEnd?.(battleState, playerWon);
}

export function getEnemyPreview(player) {
    const { enemy, wave } = createEnemy(player.level || 1);
    return { enemy, wave };
}
