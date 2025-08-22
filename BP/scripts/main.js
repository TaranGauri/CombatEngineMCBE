import { world, system, Player, ItemStack, EquipmentSlot } from "@minecraft/server";

const config = {
  horizontalKB: 0.2889,
  verticalKB: 0.14,
  sprintMultiplier: 1.05,
  kbDelay: 2 //ticks
};

const weaponDamage = {
  "minecraft:wooden_sword": 3,
  "minecraft:stone_sword": 4,
  "minecraft:golden_sword": 5,
  "minecraft:iron_sword": 6,
  "minecraft:diamond_sword": 7,
  "minecraft:wooden_axe": 3,
  "minecraft:stone_axe": 4,
  "minecraft:golden_axe": 5,
  "minecraft:iron_axe": 6,
  "minecraft:diamond_axe": 7,
  "minecraft:trident": 20
};

const armorReduction = {
  "minecraft:leather_helmet": 0.04,
  "minecraft:leather_chestplate": 0.12,
  "minecraft:leather_leggings": 0.08,
  "minecraft:leather_boots": 0.04,

  "minecraft:iron_helmet": 0.08,
  "minecraft:iron_chestplate": 0.24,
  "minecraft:iron_leggings": 0.20,
  "minecraft:iron_boots": 0.08,

  "minecraft:diamond_helmet": 0.12,
  "minecraft:diamond_chestplate": 0.32,
  "minecraft:diamond_leggings": 0.24,
  "minecraft:diamond_boots": 0.12
};

const kbCooldown = new Map();

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
  if (damagingEntity.getEffect("minecraft:weakness")) return; //can be removed safely to allow pvp while u have weakness effect

  const mainHand = damagingEntity
    .getComponent("minecraft:equippable")
    ?.getEquipment(EquipmentSlot.Mainhand);

  let baseDamage = weaponDamage[mainHand.typeId] || 1;

  const armor = hitEntity.getComponent("minecraft:equippable");
  let reduction = 0;

  if (armor) {
    const slots = [
      EquipmentSlot.Head,
      EquipmentSlot.Chest,
      EquipmentSlot.Legs,
      EquipmentSlot.Feet
    ];

    for (const slot of slots) {
      const item = armor.getEquipment(slot);
      if (!item || !(item.typeId in armorReduction)) continue;
      reduction += armorReduction[item.typeId];
    }
  }

  const finalDamage = baseDamage * (1 - reduction);
  hitEntity.applyDamage(finalDamage);

  const now = system.currentTick;
  const lastKB = kbCooldown.get(hitEntity.id) || 0;
  if (now - lastKB < config.kbDelay) return;
  kbCooldown.set(hitEntity.id, now);

  let victimLocation = hitEntity.location;
  let attackerLocation = damagingEntity.location;
  let horizontalKB = config.horizontalKB;
  let verticalKB = config.verticalKB;

  let knockbackX = victimLocation.x - attackerLocation.x;
  let knockbackZ = victimLocation.z - attackerLocation.z;

  const magnitude = Math.sqrt(knockbackX * knockbackX + knockbackZ * knockbackZ);
  if (magnitude !== 0) {
    knockbackX /= magnitude;
    knockbackZ /= magnitude;
  }

  const horizontalForce = {
    x: knockbackX * horizontalKB,
    z: knockbackZ * horizontalKB
  };

  hitEntity.applyKnockback(horizontalForce, verticalKB * 1.023);
});

world.beforeEvents.playerLeave.subscribe(({ player }) => {
    kbCooldown.delete(player.id)
});
