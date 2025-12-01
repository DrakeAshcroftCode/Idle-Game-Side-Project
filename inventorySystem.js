export function normalizeItems(rawItems = []) {
    return rawItems
        .filter(Boolean)
        .map(item => {
            if (typeof item === 'string') {
                return { name: item, quantity: 1 };
            }
            return {
                name: item.name,
                quantity: item.quantity ?? 1
            };
        });
}

export function addItemsToInventory(inventory, items = []) {
    const normalizedItems = normalizeItems(items);
    normalizedItems.forEach(incoming => {
        const existing = inventory.find(i => i.name === incoming.name);
        if (existing) {
            existing.quantity = (existing.quantity ?? 1) + incoming.quantity;
        } else {
            inventory.push({ name: incoming.name, quantity: incoming.quantity });
        }
    });
    return inventory;
}

export function removeItemsFromInventory(inventory, items = []) {
    const normalizedItems = normalizeItems(items);
    normalizedItems.forEach(target => {
        const existing = inventory.find(i => i.name === target.name);
        if (!existing) return;
        existing.quantity = Math.max((existing.quantity ?? 1) - target.quantity, 0);
        if (existing.quantity === 0) {
            const index = inventory.indexOf(existing);
            if (index >= 0) {
                inventory.splice(index, 1);
            }
        }
    });
    return inventory;
}

export function hasRequiredItems(inventory, requirements = []) {
    const normalizedRequirements = normalizeItems(requirements);
    return normalizedRequirements.every(req => {
        const existing = inventory.find(i => i.name === req.name);
        return existing && (existing.quantity ?? 1) >= req.quantity;
    });
}

export const CRAFTING_INGREDIENTS = {
    "Faded Trinket": { tier: 'basic', description: 'A worn charm brimming with faint energy.' },
    "Hardened Resolve": { tier: 'standard', description: 'Stubborn grit that refuses to crack.' },
    "Focus Token": { tier: 'standard', description: 'Keeps the mind fixed on the task ahead.' },
    "Echoing Sigil": { tier: 'elite', description: 'Resonates with the tempo of your actions.' },
    "Crystalized Courage": { tier: 'elite', description: 'Solidified bravery that fuels boldness.' }
};

export function isCraftingIngredient(itemName) {
    return Boolean(CRAFTING_INGREDIENTS[itemName]);
}

export const CRAFTING_RECIPES = [
    {
        id: 'timer-reduction-badge',
        name: 'Timer Reduction Badge',
        description: 'Fuse battle trophies into a badge that trims action timers.',
        requirements: [
            { name: 'Faded Trinket', quantity: 2 },
            { name: 'Echoing Sigil', quantity: 1 }
        ],
        result: { upgrade: 'timerReductionBadge' },
        successMessage: 'You forged a Timer Reduction Badge! Actions feel lighter already.'
    },
    {
        id: 'ap-talisman',
        name: 'AP Talisman',
        description: 'Channel grit and focus into a charm that restores extra AP when resting.',
        requirements: [
            { name: 'Hardened Resolve', quantity: 2 },
            { name: 'Focus Token', quantity: 1 },
            { name: 'Crystalized Courage', quantity: 1 }
        ],
        result: { upgrade: 'apTalisman' },
        successMessage: 'You bind the talisman. Resting will now restore additional AP.'
    }
];

export const ITEM_EFFECTS = {
    Snack: {
        type: 'consumable',
        applyEffect: (player) => {
            const apRestored = 3;
            const timerReduction = 3;
            player.actionPoints += apRestored;
            player.activeActionBuff = {
                type: 'quick-snack',
                timerReduction,
                description: `Next action timer reduced by ${timerReduction}s.`
            };
            return {
                message: `Snack consumed! +${apRestored} AP and ${timerReduction}s off the next action timer.`,
                tone: 'success'
            };
        }
    }
};

export function isItemUsable(itemName) {
    return Boolean(ITEM_EFFECTS[itemName]);
}

export function useInventoryItem(player, itemName) {
    const effect = ITEM_EFFECTS[itemName];
    if (!effect) {
        return { success: false, message: 'This item cannot be used right now.', tone: 'error' };
    }

    const existing = player.inventory.find(i => i.name === itemName);
    if (!existing || (existing.quantity ?? 0) <= 0) {
        return { success: false, message: 'Item not found in your inventory.', tone: 'error' };
    }

    const result = effect.applyEffect(player) || {};
    removeItemsFromInventory(player.inventory, [{ name: itemName, quantity: 1 }]);

    return {
        success: true,
        message: result.message || 'Item used.',
        tone: result.tone || 'info'
    };
}
