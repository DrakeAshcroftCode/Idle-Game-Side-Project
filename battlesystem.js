export class Enemy {
    constructor(name, health, attackPower, defense, staminaRegenRate, mana) {
        this.name = name;
        this.health = health;
        this.attackPower = attackPower;
        this.defense = defense;
        this.staminaRegenRate = staminaRegenRate;
        this.mana = mana;
    }

    attack() {
        // Logic for enemy attack
        // For simplicity, let's assume the enemy always attacks with its full attack power
        return this.attackPower;
    }

    takeDamage(damage) {
        // Deduct health considering enemy's defense
        const actualDamage = Math.max(damage - this.defense, 0);
        this.health -= actualDamage;
        if (this.health <= 0) {
            // Enemy defeated
            return true;
        }
        return false;
    }
}

export function generateRandomEnemy() {
    // Logic to generate random enemies based on player's progress or level
    // You can customize this based on your game's requirements
    const enemies = [
        new Enemy("Anxiety", 5, 2, 1, 2, 20),
        new Enemy("Depression", 6, 3, 2, 3, 30),
        new Enemy("Self-Doubt", 7, 4, 3, 4.5, 25)
    ];
    // Randomly select an enemy from the list
    const randomIndex = Math.floor(Math.random() * enemies.length);
    return enemies[randomIndex];
}

export async function handleBattle(player, enemy) {
    console.log(`You encounter ${enemy.name}!`);

    let elapsedTime = 0; // Initialize elapsed time

    while (true) {
        // Player's turn
        const playerAttack = Math.max(0, player.damage - enemy.defense); // Calculate player's effective attack power
        enemy.takeDamage(playerAttack);
        console.log(`You attack ${enemy.name} for ${playerAttack} damage!`);

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
        const enemyAttack = Math.max(0, enemy.attackPower - player.defense); // Calculate enemy's effective attack power
        // Deduct player's health based on enemy's attack
        // For simplicity, let's assume the player's health is deducted directly without any defense mechanism
        player.health -= enemyAttack;
        console.log(`${enemy.name} attacks you for ${enemyAttack} damage!`);

        if (player.health <= 0) {
            console.log(`${enemy.name} defeated you! Game over.`);
            // Add logic for game over
            break; // Exit the battle loop
        }
    }

    // Update UI after battle
    // Add logic to update player stats, inventory, etc.
    console.log(`Battle ended after ${elapsedTime} seconds.`);
    console.log(`Player's remaining health: ${player.health}`);
    console.log(`Player's remaining stamina: ${player.stamina}`);
}