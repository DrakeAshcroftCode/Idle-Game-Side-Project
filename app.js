import { Enemy, generateRandomEnemy, handleBattle } from '/battlesystem.js';



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

class player {
    
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
            this.xpToNextLevel = 50;
            this.baseXPMultiplier = 1;
            this.actionPoints = 10;
            this.timer = 10;
            this.currentXP = 0;
            this.playerMoney = 0;
            this.actionSuccessRate = 0.5;
            this.inventory = [];
        }
        
        // Initialize additional player properties
        this.idleEnabled = false; // Default to idle function disabled

        this.damage = 1; // Default damage
        this.defense = 1; // Default defense
        this.stamina = 100; // Default stamina
        this.staminaRegenRate = 5; // Default stamina regeneration rate per turn
        this.mana = 50; // Default mana
        this.health = 100; // Default health
    }

    toggleIdle() {
        this.idleEnabled = !this.idleEnabled;
        showMessage(`Idle function ${this.idleEnabled ? 'enabled' : 'disabled'}.`);
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
    this.xpToNextLevel = 50;
    this.baseXPMultiplier = 1;
    this.actionPoints = 10;
    this.timer = 10;
    this.currentXP = 0;
    this.playerMoney = 0;
    this.actionSuccessRate = 0.5;
    this.inventory = [];
    this.damage = 10; // Default damage
    this.defense = 5; // Default defense
    this.stamina = 100; // Default stamina
    this.staminaRegenRate = 5;
    this.mana = 50; // Default mana
    this.health = 100; // Default health
    this.updatePlayerStats();
}



    playerAction(successRate) {
        let randomValue = Math.random(); // generates a random number between 0 and 1
        return randomValue <= successRate; // returns true if action is successful
    }

    levelUp() {
        if (this.level < this.maxLevel) {
            this.level += 1;
            this.xpToNextLevel *= 2; // Double the XP needed for each subsequent level
            this.baseXPMultiplier *= 1.5; // Increase the player's XP gain by 50% for each level
            this.actionPoints += 5; // Give the player an additional action point per level
            levelName()
        }
    }

    checkLevelUp() {
        if (this.currentXP >= this.xpToNextLevel) {
            let leftOver = this.currentXP - this.xpToNextLevel;
            this.currentXP = leftOver; // Set currentXP to the leftover XP after leveling up
            leftOver = 0; // Reset the leftover XP
            this.levelUp();
            this.updatePlayerStats();
                }
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
        player.timer = 10; // Reset the timer to its default value
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







// Handle player actions
function handleAction(action) {
    switch (action) {
        case 'cleanRoom':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate);
                    if (success) {
                        player.currentXP += 5;
                        player.playerMoney += 10;
                        showMessage("Cleaned the room successfully!");
                        player.timer = 10; // reset timer to 10 seconds on success
                    } else {
                        player.timer += 11; // add 11 seconds to the timer
                        showMessage("Failed to clean the room. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('clean-room', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('clean-room').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'washDishes':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate);
                    if (success) {
                        player.currentXP += 3;
                        player.playerMoney += 5;
                        showMessage("Washed the dishes successfully!");
                        player.timer = 10; // reset timer to 10 seconds on success
                    } else {
                        player.timer += 13; // add 13 seconds to the timer
                        showMessage("Failed to wash the dishes. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('wash-dishes', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('wash-dishes').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'cookMeal':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate);
                    if (success) {
                        player.currentXP += 7;
                        player.playerMoney += 15;
                        showMessage("Cooked a meal successfully!");
                        player.timer = 10; 
                    } else {
                        player.timer += 15; 
                        showMessage("Failed to cook the meal. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('cook-meal', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('cook-meal').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'studyExam':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate - .1);
                    if (success) {
                        player.currentXP += 10;
                        player.playerMoney += 20;
                        showMessage("Studied for the exam successfully!");
                        player.timer = 10; 
                    } else {
                        player.timer += 17;
                        showMessage("Failed to study for the exam. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('study-exam', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('study-exam').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'practiceCoding':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate - .25);
                    console.log(player.actionSuccessRate);
                    if (success) {
                        player.currentXP += 25;
                        player.playerMoney += 20;
                        showMessage("Practiced coding successfully!");
                        player.timer = 10; 
                    } else {
                        player.timer += 14; 
                        showMessage("Failed to practice coding. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('practice-coding', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('practice-coding').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'takeWalk':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate - .01);
                    if (success) {
                        player.currentXP += 25;
                        player.playerMoney += 5;
                        showMessage("Took a walk successfully!");
                        player.timer = 10; 
                    } else {
                        player.timer += 11; 
                        showMessage("Failed to take a walk. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('take-walk', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('take-walk').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'meditate':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate + .25);
                    if (success) {
                        player.currentXP += 40;
                        player.playerMoney += 0;
                        showMessage("Meditated successfully!");
                        player.timer = 10; 
                    } else {
                        player.timer += 13; 
                        showMessage("Failed to meditate. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('meditate', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('meditate').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'exercise':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate - .25);
                    if (success) {
                        player.currentXP += 25;
                        player.playerMoney += 0;
                        showMessage("Exercised successfully!");
                        player.timer = 10; // reset timer to 10 seconds on success
                    } else {
                        player.timer += 16; // add 16 seconds to the timer
                        showMessage("Failed to exercise. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('exercise', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('exercise').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'playGame':
            if (player.actionPoints >= 1) {
                if (player.timer < 1) {
                    let success = player.playerAction(player.actionSuccessRate + .4);
                    if (success) {
                        player.currentXP += 1;
                        player.playerMoney += 25;
                        showMessage("Played a game successfully!");
                        player.timer = 10; // reset timer to 10 seconds on success
                    } else {
                        player.timer += 20; // add 20 seconds to the timer
                        showMessage("Failed to play the game. Adding time to the timer.");
                    }
                    graphics.updateButtonColor('play-game', success); // Update button color based on action result
                    player.actionPoints -= 1; // decrement actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('play-game').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You are out of Action Points!");
            }
            break;
        case 'sleep':
            if (player.actionPoints <= 3) {
                if (player.timer < 1) {
                    let success = true;
                    if (success) {
                        player.currentXP += 1;
                        player.playerMoney += 0;
                        showMessage("You had a good night's rest!");
                        player.timer = 20; // reset timer to 20 seconds on success
                    }
                    graphics.updateButtonColor('sleep', success); // Update button color based on action result
                    player.actionPoints = 10; // reset actionPoints
                    player.updatePlayerStats(); // Update player stats
                    graphics.updateStatsColors(player); // Update stats colors dynamically
                    player.saveDataToLocalStorage();
                    setTimeout(() => {
                        document.getElementById('sleep').classList.remove('success', 'fail');
                    }, 2000); // Remove the color class after 2 seconds
                } else {
                    showMessage("You cannot perform this action. Timer is not at zero.");
                }
            } else {
                showMessage("You aren't tired! (Must have less than 3 AP.)");
            }
            break;
        default:
            break;
    }


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
                // Perform a random action excluding "sleep"
                const actions = ['cleanRoom', 'washDishes', 'cookMeal', 'studyExam', 'practiceCoding', 'takeWalk', 'meditate', 'exercise', 'playGame'];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
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
player.addToInventory(item);
player.displayInventory();
// Update UI
player.updatePlayerStats();
graphics.updateStatsColors(player);
graphics.updateInventory(player);

// Battlebutt
document.getElementById('start-battle').addEventListener('click', () => {
    const enemy = generateRandomEnemy();
    handleBattle(player, enemy);
});


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