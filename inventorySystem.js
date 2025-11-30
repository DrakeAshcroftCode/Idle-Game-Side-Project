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
