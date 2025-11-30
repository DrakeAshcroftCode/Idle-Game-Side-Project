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
