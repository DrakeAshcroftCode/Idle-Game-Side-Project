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
        id: 'focus-charm',
        name: 'Focus Charm',
        description: 'Aids concentration; worth crafting later.',
        cost: { gold: 60, essence: 2 },
        reward: { items: [{ name: 'Focus Charm', quantity: 1 }] }
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

    const wallet = { gold: player.playerMoney, essence: player.shadowEssence };
    if (!canAfford(offering.cost, wallet)) {
        return { success: false, message: 'Not enough currency.' };
    }

    player.playerMoney -= offering.cost.gold || 0;
    player.shadowEssence -= offering.cost.essence || 0;

    if (offering.reward.items) {
        addItemsToInventory(player.inventory, offering.reward.items);
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
