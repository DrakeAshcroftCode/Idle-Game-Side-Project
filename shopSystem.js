import { addItemsToInventory, hasRequiredItems, removeItemsFromInventory } from './inventorySystem.js';

export const SHOP_CATALOG = [
    {
        id: 'bandage',
        name: 'Bandage',
        description: 'Restores minor wounds after a fight.',
        cost: { gold: 35, essence: 0 },
        reward: { items: [{ name: 'Bandage', quantity: 1 }] }
    },
    {
        id: 'timer-reduction-badge',
        name: 'Timer Reduction Badge',
        description: 'Shaves a second off every action timer. Limited stock!',
        cost: { gold: 90, essence: 1 },
        reward: { upgrade: 'timerReductionBadge' }
    },
    {
        id: 'focus-charm-upgrade',
        name: 'Focus Charm',
        description: 'Keeps you calm under pressure, reducing added time on failure.',
        cost: { gold: 70, essence: 3 },
        reward: { upgrade: 'focusCharm' }
    },
    {
        id: 'stamina-tonic',
        name: 'Stamina Tonic',
        description: 'Trade essence for condensed energy.',
        cost: { gold: 25, essence: 3 },
        reward: { items: [{ name: 'Stamina Tonic', quantity: 1 }] }
    },
    {
        id: 'snack',
        name: 'Snack',
        description: 'Cheap bite that restores a little AP and quickens your next task.',
        cost: { gold: 12, essence: 0 },
        reward: { items: [{ name: 'Snack', quantity: 1 }] }
    }
];

export function canAfford(cost, wallet) {
    return Object.entries(cost).every(([currency, amount]) => (wallet[currency] ?? 0) >= amount);
}

export function purchaseItem(player, itemId) {
    const offering = SHOP_CATALOG.find(entry => entry.id === itemId);
    if (!offering) {
        return { success: false, message: 'Item not found.' };
    }

    if (offering.reward.upgrade && player.upgrades?.[offering.reward.upgrade]) {
        return { success: false, message: 'Already purchased.' };
    }

    const wallet = { gold: player.playerMoney, essence: player.shadowEssence };
    if (!canAfford(offering.cost, wallet)) {
        return { success: false, message: 'Not enough currency.' };
    }

    player.playerMoney -= offering.cost.gold || 0;
    player.shadowEssence -= offering.cost.essence || 0;

    if (offering.reward.items) {
        addItemsToInventory(player.inventory, offering.reward.items);
    }

    if (offering.reward.upgrade) {
        player.upgrades ??= {};
        player.upgrades[offering.reward.upgrade] = true;
    }

    return { success: true, message: `${offering.name} purchased!` };
}

export function craftWithItems(player, recipe) {
    if (!hasRequiredItems(player.inventory, recipe.requirements)) {
        return { success: false, message: 'Missing required materials.' };
    }

    removeItemsFromInventory(player.inventory, recipe.requirements);
    addItemsToInventory(player.inventory, recipe.output.items || []);

    return { success: true, message: recipe.successMessage || 'Crafted successfully.' };
}
