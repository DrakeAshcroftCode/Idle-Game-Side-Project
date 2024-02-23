import { player } from "/app.js";

export class Enemy {
    constructor(name, health, attack, defense, staminaRegenRate, mana) {
        this.name = name;
        this.health = health;
        this.attack = attack;
        this.defense = defense;
        this.staminaRegenRate = staminaRegenRate;
        this.mana = mana;
    }

    performAttack() {
        // Logic for enemy attack
        // For simplicity,'s assume the enemy always attacks with its full attack power
        return this.attack;
    }

    takeDamage(damage) {
        // Deduct health considering enemy's defense
        const actualDamage = Math.max(damage - this.defense, 0);
        this.health -= actualDamage;
        // Check if the enemy is defeated
        if (this.health <= 0) {
            console.log(`${this.name} has been defeated!`);
            return true;
        }
        return false;
    }
}

export async function handleBattle(player, enemy) {
    console.log(`You encounter ${enemy.name}!`);

    let elapsedTime = 0; // Initialize elapsed time

    while (true) {
        // Player's turn
        // let playerDamAttack = player.damage;
        const playerAttack = Math.max(0, player.damage - enemy.defense); // Corrected calculation
        enemy.takeDamage(player.damage);
        console.log(`You attack ${enemy.name} for ${playerAttack} damage!`);
        console.log("your health: " + player.health)
        console.log("enemy defense: " + enemy.defense)
        console.log("Enemy health: " + enemy.health)
        if (enemy.health <= 0) {
            console.log(`You defeated ${enemy.name}!`);
            // Reward the player
            // Add logic to give player experience points, currency, etc.
            break; // Exit the battle loop
        }

        // Wait for a short delay to simulate enemy's turn
        await new Promise(resolve => setTimeout(resolve, 1000));
        elapsedTime += 1; // Increment elapsed time by 1 second

        // Regenerate player's stamina based on stamina regeneration rate
        player.stamina += player.staminaRegenRate;
        if (player.stamina > 100) {
            player.stamina = 100; // Cap stamina at 100
        }

        // Enemy's turn
        const enemyAttack = Math.max(0, enemy.attack - player.defense); // Calculate enemy's effective attack power
        // Deduct player's health based on enemy's attack
        // For simplicity, let's assume the player's health is deducted directly without any defense mechanism
        player.takeDamage(enemy.attack);
        console.log(`${enemy.name} attacks you for ${enemyAttack} damage!`);
        console.log(enemy.health)
        if (player.health <= 0) {
            console.log(`${enemy.name} defeated you! Game over.`);
            // Add logic for gold loss
            break; // Exit the battle loop
        }
    }

    // Update UI after battle
    // Add logic to update player stats, inventory, etc.
    console.log(`Battle ended after ${elapsedTime} seconds.`);
    console.log(`Player's remaining health: ${player.health}`);
    console.log(`Player's remaining stamina: ${player.stamina}`);
}
// SPECIFICALLY SELF DOUBT IS INVINCIBLE. FIX

// playerAttacks = [
//     {
//         name: "Power Attack",
//         staminaCost: 3,
//         damage: 5
//     },
//     {
//         name: "Normal Attack",
//         staminaCost: 1,
//         damage: 2
//     },
//     {
//         name: "Special Attack",
//         staminaCost: 2,
//         damage: 3
//     }
// ];

export function generateRandomEnemy() {
    // Logic to generate random enemies based on player's progress or level
    // You can customize this based on your game's requirements
    const enemies = [
        new Enemy("Anger", 20, 1, 1, 1, 10),
        new Enemy("Anxiety", 5, 2, 1, 2, 20),
        new Enemy("Depression", 6, 3, 2, 3, 30),
        new Enemy("Self-Doubt", 7, 4, 3, 4.5, 25)
    ];
    // Randomly select an enemy from the list
    const randomIndex = Math.floor(Math.random() * enemies.length);
    return enemies[randomIndex];
}
