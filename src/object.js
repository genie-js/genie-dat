const struct = require("awestruct");
const DebugString = require("./string");
const t = struct.types;

const ResourceStorage = struct([
  ["type", t.int16],
  ["amount", t.float],
  ["usedMode", t.int8]
]);

const DamageGraphic = struct([
  ["graphicId", t.int16],
  ["damagePercent", t.int16],
  ["flag", t.int8]
]);

const StaticObject = struct([
  ["id", t.int16],
  ["languageDllName", t.uint16],
  ["languageDllCreation", t.uint16],
  ["class", t.int16],
  ["standingGraphic0", t.int16],
  ["standingGraphic1", t.int16],
  ["dyingGraphic", t.int16],
  ["undeadGraphic", t.int16],
  ["deathMode", t.int8],
  ["hitPoints", t.int16],
  ["lineOfSight", t.float],
  ["garrisonCapacity", t.int8],
  [
    "radius",
    struct([
      ["x", t.float],
      ["y", t.float],
      ["z", t.float]
    ])
  ],
  ["trainSound", t.int16],
  ["damageSound", t.int16], // not in AOE1
  ["deadUnitId", t.int16],
  ["bloodUnitId", t.int16],
  ["placementMode", t.int8],
  ["canBeBuiltOn", t.int8],
  ["iconId", t.int16],
  ["hiddenInEditor", t.int8],
  ["oldPortraitIconId", t.int16],
  ["enabled", t.bool],
  ["disabled", t.bool],
  ["placementSideTerrain0", t.int16],
  ["placementSideTerrain1", t.int16],
  ["placementTerrain0", t.int16],
  ["placementTerrain1", t.int16],
  [
    "clearanceSize",
    struct([
      ["x", t.float],
      ["y", t.float]
    ])
  ],
  ["buildingMode", t.int8],
  ["visibleInFog", t.int8],
  ["terrainRestriction", t.int16],
  ["flyMode", t.int8],
  ["resourceCapacity", t.int16],
  ["resourceDecay", t.float],
  ["blastDefenseLevel", t.int8],
  ["combatLevel", t.int8],
  ["interactionMode", t.int8],
  ["mapDrawLevel", t.int8],
  ["unitLevel", t.int8],
  ["attackReaction", t.float],
  ["minimapColor", t.int8],
  ["languageDllHelp", t.int32],
  ["languageDllHotkeyText", t.int32],
  ["hotkeyId", t.int32],
  ["recycleable", t.int8],
  ["enableAutoGather", t.int8],
  ["doppelgangerOnDeath", t.int8],
  ["resourceGatherDrop", t.int8],
  ["occlusionMask", t.int8],
  ["obstructionType", t.int8],
  ["obstructionClass", t.int8],
  ["flags", t.uint32],
  ["drawFlag", t.int8],
  ["drawColor", t.uint8],
  [
    "outlineRadius",
    struct([
      ["x", t.float],
      ["y", t.float],
      ["z", t.float]
    ])
  ],
  ["scenarioTrigger1", t.uint32],
  ["scenarioTrigger2", t.uint32],
  ["resourceStorage", t.array(3, ResourceStorage)],
  ["damageGraphics", t.dynarray(t.int8, DamageGraphic)],
  ["selectionSound", t.int16],
  ["dyingSound", t.int16],
  ["wwiseTrainSoundId", t.uint32],
  ["wwiseDamageSoundId", t.uint32],
  ["wwiseSelectionSoundId", t.uint32],
  ["wwiseDyingSoundId", t.uint32],
  ["oldAttackMode", t.int8],
  ["convertTerrain", t.int8],
  ["name", DebugString],
  ["copyId", t.int16],
  ["baseId", t.int16]
]);

const AnimatedObject = struct([StaticObject, ["speed", t.float]]);

const DoppelgangerObject = struct([AnimatedObject]);

const MovingObject = struct([
  AnimatedObject,
  ["walkingGraphics0", t.int16],
  ["walkingGraphics1", t.int16],
  ["turnSpeed", t.float],
  ["oldSizeClass", t.int8],
  ["trailObjectId", t.int16],
  ["trailOptions", t.uint8],
  ["trailSpacing", t.float],
  ["oldMoveAlgorithm", t.int8],
  ["turnRadius", t.float],
  ["turnRadiusSpeed", t.float],
  ["maxYawPerSecondMoving", t.float],
  ["stationaryYawRevolutionTime", t.float],
  ["maxYawPerSecondStationary", t.float],
  ["minCollisionSizeMultiplier", t.float]
]);

const ActionObject = struct([
  MovingObject,
  ["defaultTaskId", t.int16],
  ["searchRadius", t.float],
  ["workRate", t.float],
  ["dropSite0", t.int16],
  ["dropSite1", t.int16],
  ["taskByGroup", t.int8],
  ["commandSoundId", t.int16],
  ["stopSoundId", t.int16],
  ["wwiseCommandSoundId", t.uint32],
  ["wwiseStopSoundId", t.uint32],
  ["runPattern", t.int8]
  // ObjectCommands here for AOE1
]);

const HitType = struct([
  ["type", t.int16],
  ["amount", t.int16]
]);

const BaseCombatObject = struct([
  ActionObject,
  ["defaultArmor", t.int16],
  ["attacks", t.dynarray(t.uint16, HitType)],
  ["armors", t.dynarray(t.uint16, HitType)],
  ["boundaryId", t.int16],
  ["weaponRangeMax", t.float],
  ["blastRange", t.float],
  ["attackSpeed", t.float],
  ["projectileObjectId", t.int16],
  ["baseHitChance", t.int16],
  ["breakOffCombat", t.int8],
  ["frameDelay", t.int16],
  [
    "weaponOffset",
    struct([
      ["x", t.float],
      ["y", t.float],
      ["z", t.float]
    ])
  ],
  ["blastLevelOffense", t.int8],
  ["weaponRangeMin", t.float],
  ["accuracyDispersion", t.float],
  ["fightSpriteId", t.int16],
  ["meleeArmorDisplayed", t.int16],
  ["attackDisplayed", t.int16],
  ["rangeDisplayed", t.float],
  ["reloadTimeDisplayed", t.float]
]);

const MissileObject = struct([
  BaseCombatObject,
  ["projectileType", t.int8],
  ["smartMode", t.int8],
  ["dropAnimationMode", t.int8],
  ["penetrationMode", t.int8],
  ["areaOfEffectSpecial", t.int8],
  ["projectileArc", t.float]
]);

const ResourceCost = struct([
  ["type", t.int16],
  ["amount", t.int16],
  ["enabled", t.int16]
]);

const CombatObject = struct([
  BaseCombatObject,
  ["resourceCost", t.array(3, ResourceCost)],
  ["creationTime", t.int16],
  ["creationLocationId", t.int16],
  ["creationButtonId", t.int8],
  ["rearAttackModifier", t.float],
  ["flankAttackModifier", t.float],
  ["creatableType", t.int8],
  ["heroMode", t.int8],
  ["garrisonGraphic", t.int32],
  ["spawningGraphic", t.int16],
  ["upgradeGraphic", t.int16],
  ["volleyFireAmount", t.float],
  ["maxAttacksInVolley", t.int8],
  ["volleyXSpread", t.float],
  ["volleyYSpread", t.float],
  ["volleyStartSpreadAdjustment", t.float],
  ["volleyMissileId", t.int32],
  ["specialGraphicid", t.int32],
  ["specialActivation", t.int8],
  ["pierceArmorDisplayed", t.int16]
]);

const BuildingAnnex = struct([
  ["objectId", t.int16],
  ["misplaced0", t.float],
  ["misplaced1", t.float]
]);

const BuildingObject = struct([
  CombatObject,
  ["constructionGraphicId", t.int16],
  ["snowGraphicId", t.int16],
  ["destructionGraphicId", t.int16],
  ["destructionRubbleGraphicId", t.int16],
  ["researchingGraphicId", t.int16],
  ["researchCompletedGraphicId", t.int16],
  ["adjacentMode", t.int8],
  ["graphicsAngle", t.int16],
  ["disappearsWhenBuilt", t.int8],
  ["stackUnitId", t.int16],
  ["foundationTerrainId", t.int16],
  ["oldOverlayId", t.int16],
  ["researchId", t.int16],
  ["canBurn", t.bool],
  ["annexes", t.array(4, BuildingAnnex)],
  ["headObjectId", t.int16],
  ["transformObjectId", t.int16],
  ["transformSoundId", t.int16],
  ["constructionSoundId", t.int16],
  ["wwiseTransformSoundId", t.uint32],
  ["wwiseConstructionSoundId", t.uint32],
  ["garrisonType", t.int8],
  ["garrisonHealRate", t.float],
  ["garrisonRepairRate", t.float],
  ["salvageObjectId", t.int16],
  ["salvageAttributes", t.array(6, t.int8)]
]);

const TreeObject = struct([StaticObject]);

const TriageObject = struct([
  ["type", t.int8],
  t.if(s => s.type === 10, StaticObject),
  t.if(s => s.type === 20, AnimatedObject),
  t.if(s => s.type === 25, DoppelgangerObject),
  t.if(s => s.type === 30, MovingObject),
  t.if(s => s.type === 40, ActionObject),
  t.if(s => s.type === 50, BaseCombatObject),
  t.if(s => s.type === 60, MissileObject),
  t.if(s => s.type === 70, CombatObject),
  t.if(s => s.type === 80, BuildingObject),
  t.if(s => s.type === 90, TreeObject)
]);

module.exports = {
  ResourceStorage,
  DamageGraphic,
  StaticObject,
  AnimatedObject,
  DoppelgangerObject,
  MovingObject,
  ActionObject,
  HitType,
  BaseCombatObject,
  MissileObject,
  ResourceCost,
  CombatObject,
  BuildingAnnex,
  BuildingObject,
  TreeObject,
  TriageObject
};
