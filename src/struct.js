const struct = require("awestruct");
const {
  ResourceStorage,
  DamageGraphic,
  StaticObject,
  AnimatedObject,
  DoppelgangerObject,
  MovingObject,
  ActionObject,
  HitType,
  ProjectileObject,
  MissileObject,
  ResourceCost,
  LivingObject,
  BuildingAnnex,
  BuildingObject,
  TreeObject,
  TriageObject
} = require("./object");
const TechTree = require("./tech-tree");
const DebugString = require("./string");
const t = struct.types;

// Struct.types.array but it adds an $index property
const indexArray = (size, elementType) => {
  const typeClass = struct.getType(elementType);
  return struct.Type({
    read(opts, parent) {
      const l = struct.getValue(opts.struct, size);
      const result = [];
      for (let i = 0; i < l; i++) {
        opts.struct.$index = i;
        result.push(typeClass.read(opts, parent));
      }
      delete opts.struct.$index;
      return result;
    },
    write(opts, value) {
      const l = struct.getValue(opts.struct, size);
      if (value.length !== l) {
        throw new Error("cannot write incorrect array length, expected " + l + ", got " + value.length);
      }
      for (let i = 0; i < l; i++) {
        opts.struct.$index = i;
        typeClass.write(opts, value[i]);
      }
      delete opts.struct.$index;
    },
    size: typeof size === "number" ? (value, struct) => size * typeClass.size(value[0], struct) : (value, struct) => (value.length ? typeClass.size(value[0], struct) * value.length : 0)
  });
};

// An array of size `size`, but with missing elements specified by `pointers`.
// If `pointers[i] == 0`, the element is skipped.
const holeyArray = (size, pointers, elementType) =>
  indexArray(
    size,
    t.if(s => {
      const ptr = struct.getValue(s, pointers);
      if (!Array.isArray(ptr)) throw new Error(`${pointers} does not refer to a pointer array`);
      return ptr[s.$index] !== 0;
    }, elementType)
  ).mapRead(
    // Filter null elements
    arr => arr.filter(Boolean)
  );

const ifVersion = (test, consequent) =>
  t.if(s => {
    let parent = s;
    while (parent.$parent) parent = parent.$parent;
    const { fileVersion } = parent;

    return test(fileVersion);
  }, consequent);

function getTerrainCount() {
  if (DatFile.version === "swgb") return 55;
  if (DatFile.version === "african-kingdoms") return 100;
  if (DatFile.version === "aoe2de") return 200;
  if (DatFile.version !== "aoc") return 32;
  return 42;
}

const PlayerColor = struct([
  ["id", t.int32],
  ["base", t.int32],
  ["unitOutlineColor", t.int32],
  ["unitSelectionColor1", t.int32],
  ["unitSelectionColor2", t.int32],
  ["minimapColor1", t.int32],
  ["minimapColor2", t.int32],
  ["minimapColor3", t.int32],
  ["statisticsTextColor", t.int32]
]);

const TerrainPassGraphic = struct([
  ["exitTileId", t.int32],
  ["enterTileId", t.int32],
  ["walkTileId", t.int32],
  ifVersion(v => false /* SWGB */, struct([["walkRate", t.float]])).else(struct([["replicationAmount", t.int32]]))
]);

const TerrainRestriction = count =>
  struct([
    ["accessibleDamageMultiplier", t.array(s => struct.getValue(s.$parent, count), t.float)],
    ifVersion(v => true /* AOK and up */, struct([["passGraphics", t.array(s => struct.getValue(s.$parent.$parent, count), TerrainPassGraphic)]]))
  ]);

const SoundItem = struct([
  ["filename", DebugString],
  ["resourceId", t.int32],
  ["probability", t.int16],
  ifVersion(
    v => true /* AOK and up */,
    struct([
      ["civilization", t.int16],
      ["iconSet", t.int16]
    ])
  )
]);

const Sound = struct([
  ["id", t.int16],
  ["playDelay", t.int16],
  ["fileCount", t.uint16],
  ["cacheTime", t.int32],
  ["totalProbability", t.int16],
  ["items", t.array("fileCount", SoundItem)]
]);

const GraphicDelta = struct([
  ["graphicId", t.int16],
  ["padding1", t.int16],
  ["spritePointer", t.int32],
  ["offsetX", t.int16],
  ["offsetY", t.int16],
  ["displayAngle", t.int16],
  ["padding2", t.int16]
]);

const SoundProp = struct([
  ["delay", t.int16],
  ["id", t.int16],
  ["wwiseSoundId", t.uint32]
]);

const GraphicAttackSound = struct([["soundProps", t.array(3, SoundProp)]]);

const Graphic = struct([
  ["name", DebugString],
  ["filename", DebugString],
  ["particleEffectName", DebugString],
  ["slpId", t.int32],
  ["isLoaded", t.int8],
  ["oldColorFlag", t.int8],
  ["layer", t.int8],
  ["playerColor", t.int8],
  ["adaptColor", t.int8],
  ["transparentSelection", t.int8],
  ["coordinates", t.array(4, t.int16)],
  ["deltaCount", t.uint16],
  ["soundId", t.int16],
  ["wwiseSoundId", t.uint32],
  ["attackSoundUsed", t.int8],
  ["frameCount", t.uint16],
  ["angleCount", t.uint16],
  ["speedAdjust", t.float],
  ["frameRate", t.float],
  ["replayDelay", t.float],
  ["sequenceType", t.int8],
  ["id", t.int16],
  ["mirroringMode", t.int8],
  ifVersion(v => true /* AOK and up */, struct([["editorFlag", t.int8]])),
  ["deltas", t.array("deltaCount", GraphicDelta)],
  t.if("attackSoundUsed", struct([["attackSounds", t.array("../angleCount", GraphicAttackSound)]]))
]);

const TileSize = struct([
  ["width", t.int16],
  ["height", t.int16],
  ["deltaZ", t.int16]
]);

const TerrainAnimation = struct([
  ["isAnimated", t.bool],
  ["animationFrameCount", t.int16],
  ["pauseFrameCount", t.int16],
  ["interval", t.float],
  ["pauseBetweenLoops", t.float],
  ["frame", t.int16],
  ["drawFrame", t.int16],
  ["animateLast", t.float],
  ["frameChanged", t.bool],
  ["drawn", t.int8]
]);

const FrameData = struct([
  ["frameCount", t.int16],
  ["angleCount", t.int16],
  ["shapeId", t.int16]
]);

const Terrain = struct([
  ["enabled", t.bool],
  ["random", t.int8],
  ["isWater", t.int8],
  ["hideInEditor", t.int8],
  ["stringId", t.int32],
  ["name0", DebugString],
  ["name1", DebugString],
  ["slpId", t.int32],
  ["shapePointer", t.int32],
  ["soundId", t.int32],
  ["wwiseSoundId", t.uint32],
  ["wwiseSoundStopId", t.uint32],
  ifVersion(
    v => true /* AOK and up */,
    struct([
      ["blendPriority", t.int32],
      ["blendMode", t.int32]
    ])
  ),
  ["overlayMaskName", DebugString],
  [
    "minimap",
    struct([
      ["high", t.uint8],
      ["medium", t.uint8],
      ["low", t.uint8],
      ["cliffLt", t.uint8],
      ["cliffRt", t.uint8]
    ])
  ],
  ["passableTerrain", t.int8],
  ["impassableTerrain", t.int8],
  TerrainAnimation,
  ["elevationGraphics", t.array(19, FrameData)],
  ["terrainReplacementId", t.int16],
  ["rows", t.int16],
  ["columns", t.int16],
  ["terrainUnitMaskedDensity", t.array(30, t.int16)],
  ["terrainUnitId", t.array(30, t.int16)],
  ["terrainUnitDensity", t.array(30, t.int16)],
  ["terrainPlacementFlag", t.array(30, t.int8)],
  ["terrainUnitsUsedCount", t.int16],
  ifVersion(v => true /* not SWGB */, struct([["phantom", t.int16]]))
]);

const TerrainBorder = struct([
  ["enabled", t.bool],
  ["random", t.int8],
  ["name0", t.char(13)],
  ["name1", t.char(13)],
  ["slpId", t.int32],
  ["shapePointer", t.int32],
  ["soundId", t.int32],
  ["color", t.array(3, t.uint8)],
  TerrainAnimation,
  ["frames", t.array(19 * 12, FrameData)],
  ["drawTile", t.int16],
  ["underlayTerrain", t.int16],
  ["borderStyle", t.int16]
]);

const RandomMapInfo = struct([
  ["mapId", t.int32],
  ["borderLeft", t.int32],
  ["borderTop", t.int32],
  ["borderRight", t.int32],
  ["borderBottom", t.int32],
  ["borderUsage", t.int32],
  ["waterShape", t.int32],
  ["baseTerrain", t.int32],
  ["landCoverage", t.int32],
  ["unusedId", t.int32],
  ["baseZoneCount", t.uint32],
  ["baseZonePointer", t.int32],
  ["terrainCount", t.uint32],
  ["terrainPointer", t.int32],
  ["objectCount", t.uint32],
  ["objectPointer", t.int32],
  ["elevationCount", t.uint32],
  ["elevationPointer", t.int32]
]);

const RandomMapLand = struct([
  ["landId", t.int32],
  ["terrain", t.int32],
  ["spacing", t.int32],
  ["baseSize", t.int32],
  ["zone", t.int8],
  ["placementType", t.int8],
  t.skip(2), // padding
  ["baseX", t.int32],
  ["baseY", t.int32],
  ["landSize", t.int8],
  ["byPlayerFlag", t.int8],
  t.skip(2), // padding
  ["startAreaRadius", t.int32],
  ["borderFuzziness", t.int32],
  ["clumpiness", t.int32]
]);

const RandomMapTerrain = struct([
  ["size", t.int32],
  ["terrain", t.int32],
  ["numberOfClumps", t.int32],
  ["edgeSpacing", t.int32],
  ["placementZone", t.int32],
  ["clumpiness", t.int32]
]);

const RandomMapObject = struct([
  ["objectId", t.int32],
  ["baseTerrain", t.int32],
  ["groupingType", t.int8],
  ["scalingType", t.int8],
  t.skip(2), // padding
  ["objectsPerGroup", t.int32],
  ["groupVariance", t.int32],
  ["numberOfGroups", t.int32],
  ["groupRadius", t.int32],
  ["ownAtStart", t.int32],
  ["setPlaceForAllPlayers", t.int32],
  ["minDistanceToPlayers", t.int32],
  ["maxDistanceToPlayers", t.int32]
]);

const RandomMapElevation = struct([
  ["size", t.int32],
  ["terrain", t.int32],
  ["numberOfClumps", t.int32],
  ["baseTerrain", t.int32],
  ["baseElevation", t.int32],
  ["tileSpacing", t.int32]
]);

const RandomMap = struct([
  ["borderLeft", t.int32],
  ["borderTop", t.int32],
  ["borderRight", t.int32],
  ["borderBottom", t.int32],
  ["borderUsage", t.int32],
  ["waterShape", t.int32],
  ["baseTerrain", t.int32],
  ["landCoverage", t.int32],
  ["unusedId", t.int32],
  ["baseZoneCount", t.uint32],
  ["baseZonePointer", t.int32],
  ["baseZones", t.array("baseZoneCount", RandomMapLand)],
  ["terrainCount", t.uint32],
  ["terrainPointer", t.int32],
  ["terrains", t.array("terrainCount", RandomMapTerrain)],
  ["objectCount", t.uint32],
  ["objectPointer", t.int32],
  ["objects", t.array("objectCount", RandomMapObject)],
  ["elevationCount", t.uint32],
  ["elevationPointer", t.int32],
  ["elevations", t.array("elevationCount", RandomMapElevation)]
]);

const TechEffect = struct([
  ["type", t.int8],
  ["unit", t.int16],
  ["unitClassId", t.int16],
  ["attributeId", t.int16],
  ["amount", t.float]
]);

const Tech = struct([
  ["name", DebugString],
  ["effects", t.dynarray(t.uint16, TechEffect)]
]);

const ObjectCommand = struct([
  ["commandUsed", t.int16],
  ["id", t.int16],
  ["isDefault", t.bool],
  ["type", t.int16],
  ["classId", t.int16],
  ["objectId", t.int16],
  ["terrainId", t.int16],
  ["resourceIn", t.int16],
  ["resourceMultiplier", t.int16],
  ["resourceOut", t.int16],
  ["resourceUnused", t.int16],
  ["workValue1", t.float],
  ["workValue2", t.float],
  ["workRange", t.float],
  ["searchMode", t.int8],
  ["searchTime", t.float],
  ["enableTargeting", t.int8],
  ["combatLevelFlag", t.int8],
  ["gatherType", t.int16],
  ["workMode2", t.int16],
  ["ownerType", t.int8],
  ["carryCheck", t.int8],
  ["stateBuild", t.int8],
  ["moveSpriteId", t.int16],
  ["proceedSpriteId", t.int16],
  ["workSpriteId", t.int16],
  ["carrySpriteId", t.int16],
  ["resourceGatherSoundId", t.int16],
  ["resourceDepositSoundId", t.int16],
  ["wwiseResourceGatherSoundId", t.uint32],
  ["wwiseResourceDepositSoundId", t.uint32]
]);

const ObjectHeader = struct([["exists", t.bool], t.if("exists", struct([["commands", t.dynarray(t.uint16, ObjectCommand)]]))]);

const Civilization = struct([
  ["playerType", t.int8],
  ["name", DebugString],
  ["resourcesCount", t.uint16],
  ["techTreeId", t.int16],
  ["teamBonusId", t.int16], // not in AOE1
  ["resources", t.array("resourcesCount", t.float)],
  ["iconSet", t.int8],
  ["objectCount", t.uint16],
  ["objectOffsets", t.array("objectCount", t.int32)],
  ["objects", holeyArray("objectCount", "objectOffsets", TriageObject)]
]);

const ResearchResourceCost = struct([
  ["resourceId", t.int16],
  ["amount", t.int16],
  ["enabled", t.bool]
]);

const Research = struct([
  ["requiredTechIds", t.array(6, t.int16)],
  ["resourceCosts", t.array(3, ResearchResourceCost)],
  ["requiredTechCount", t.int16],
  ["civilizationId", t.int16],
  ["fullTechMode", t.int16],
  ["researchLocationId", t.int16],
  ["languageDllName", t.uint16],
  ["languageDllDescription", t.uint16],
  ["researchTime", t.int16],
  ["techEffectId", t.int16],
  ["techType", t.int16],
  ["iconId", t.int16],
  ["buttonId", t.int8],
  ["languageDllHelp", t.int32],
  ["languageDllTechTree", t.int32],
  ["hotkey", t.int32],
  ["name", DebugString]
  // SWGB
  // ['name2', t.dynstring(t.uint16)]
]);

const DatFile = struct([
  ["fileVersion", t.char(8)],
  ["terrainRestrictionCount", t.uint16],
  ["terrainCount", t.uint16],
  ["terrainTables", t.array("terrainRestrictionCount", t.int32)],
  ["terrainPassGraphicPointers", t.array("terrainRestrictionCount", t.int32)],
  ["terrainRestrictions", t.array("terrainRestrictionCount", TerrainRestriction("terrainCount"))],
  ["playerColors", t.dynarray(t.uint16, PlayerColor)],
  ["sounds", t.dynarray(t.uint16, Sound)],
  ["graphicCount", t.uint16],
  ["graphicPtrs", t.array("graphicCount", t.int32)],
  ["graphics", holeyArray("graphicCount", "graphicPtrs", Graphic)],
  ["RGE_Map::vfptr", t.int32],
  ["mapPointer", t.int32],
  ["mapWidth", t.int32],
  ["mapHeight", t.int32],
  ["worldWidth", t.int32],
  ["worldHeight", t.int32],
  ["tileSizes", t.array(19, TileSize)],
  ["padding1", t.int16],
  ["terrains", t.array(getTerrainCount, Terrain)],
  ["mapMinX", t.float],
  ["mapMinY", t.float],
  ["mapMaxX", t.float],
  ["mapMaxY", t.float],
  ["mapMaxX+1", t.float],
  ["mapMaxY+1", t.float],
  ["additionalTerrainCount", t.uint16],
  ["bordersUsed", t.uint16],
  ["maxTerrain", t.int16],
  ["tileWidth", t.int16],
  ["tileHeight", t.int16],
  ["tileHalfWidth", t.int16],
  ["tileHalfHeight", t.int16],
  ["elevHeight", t.int16],
  ["currentRow", t.int16],
  ["currentColumn", t.int16],
  ["blockBeginRow", t.int16],
  ["blockEndRow", t.int16],
  ["blockBeginColumn", t.int16],
  ["blockEndColumn", t.int16],
  ["searchMapPointer", t.int32],
  ["searchMapRowsPointer", t.int32],
  ["anyFrameChange", t.int8],
  ["mapVisibleFlag", t.int8],
  ["fogFlag", t.int8],
  ["randomMapCount", t.uint32],
  ["randomMapPointer", t.int32],
  ["randomMapInfo", t.array("randomMapCount", RandomMapInfo)],
  ["randomMaps", t.array("randomMapCount", RandomMap)],
  ["techs", t.dynarray(t.uint32, Tech)],
  // TODO Unit lines for SWGB
  ["objectHeaders", t.dynarray(t.uint32, ObjectHeader)],
  ["civilizations", t.dynarray(t.uint16, Civilization)],
  ["researches", t.dynarray(t.uint16, Research)],
  ["timeSlice", t.int32],
  ["unitKillRate", t.int32],
  ["unitKillTotal", t.int32],
  ["unitHitPointRate", t.int32],
  ["unitHitPointTotal", t.int32],
  ["razingKillRate", t.int32],
  ["razingKillTotal", t.int32],
  ["techTree", TechTree]
]);

module.exports = {
  PlayerColor,
  TerrainPassGraphic,
  SoundItem,
  Sound,
  GraphicDelta,
  SoundProp,
  GraphicAttackSound,
  Graphic,
  TileSize,
  TerrainAnimation,
  FrameData,
  Terrain,
  TerrainBorder,
  RandomMapInfo,
  RandomMapLand,
  RandomMapTerrain,
  RandomMapObject,
  RandomMapElevation,
  RandomMap,
  TechEffect,
  Tech,
  ObjectCommand,
  ObjectHeader,
  ResourceStorage,
  DamageGraphic,
  StaticObject,
  AnimatedObject,
  DoppelgangerObject,
  MovingObject,
  ActionObject,
  HitType,
  ProjectileObject,
  MissileObject,
  ResourceCost,
  LivingObject,
  BuildingAnnex,
  BuildingObject,
  TreeObject,
  TriageObject,
  Civilization,
  ResearchResourceCost,
  Research,
  DatFile
};
