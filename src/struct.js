const struct = require('awestruct')
const t = struct.types

const dynamicArray = (sizeType, elementType) =>
  struct([
    ['size', sizeType],
    ['elements', t.array('size', elementType)]
  ]).map(
    // When reading, return the elements only.
    r => r.elements,
    // When writing, turn an elements array into a size and elements field.
    elements => ({
      size: elements.length,
      elements
    })
  )

const dynamicString = (sizeType) =>
  struct([
    ['size', sizeType],
    ['characters', t.char('size')]
  ]).map(
    // When reading, return the string only.
    r => r.characters,
    // When writing, turn a string into a size and characters field.
    string => ({
      size: string.length,
      characters: string
    })
  )

// Struct.types.array but it adds an $index property
const indexArray = (size, elementType) => {
  const typeClass = struct.getType(elementType)
  return struct.Type({
    read (opts, parent) {
      const l = struct.getValue(opts.struct, size)
      const result = []
      for (let i = 0; i < l; i++) {
        opts.struct.$index = i
        result.push(typeClass.read(opts, parent))
      }
      delete opts.struct.$index
      return result
    },
    write (opts, value) {
      const l = struct.getValue(opts.struct, size)
      if (value.length !== l) {
        throw new Error('cannot write incorrect array length, expected ' + l + ', got ' + value.length)
      }
      for (let i = 0; i < l; i++) {
        opts.struct.$index = i
        typeClass.write(opts, value[i])
      }
      delete opts.struct.$index
    },
    size: typeof size === 'number'
      ? (value, struct) => size * typeClass.size(value[0], struct)
      : (value, struct) => value.length ? typeClass.size(value[0], struct) * value.length : 0
  })
}

// An array of size `size`, but with missing elements specified by `pointers`.
// If `pointers[i] == 0`, the element is skipped.
const holeyArray = (size, pointers, elementType) =>
  indexArray(size,
    t.if((s) => {
      const ptr = struct.getValue(s, pointers)
      if (!Array.isArray(ptr)) throw new Error(`${pointers} does not refer to a pointer array`)
      return ptr[s.$index] !== 0
    }, elementType)
  ).mapRead(
    // Filter null elements
    arr => arr.filter(Boolean)
  )

const ifVersion = (test, consequent) =>
  t.if((s) => {
    let parent = s
    while (parent.$parent) parent = parent.$parent
    const { fileVersion } = parent

    return test(fileVersion)
  }, consequent)

function getTerrainCount () {
  if (DatFile.version === 'swgb') return 55
  if (DatFile.version === 'african-kingdoms') return 100
  if (DatFile.version !== 'aoc') return 32
  return 42
}

const PlayerColor = struct([
  ['id', t.int32],
  ['base', t.int32],
  ['unitOutlineColor', t.int32],
  ['unitSelectionColor1', t.int32],
  ['unitSelectionColor2', t.int32],
  ['minimapColor1', t.int32],
  ['minimapColor2', t.int32],
  ['minimapColor3', t.int32],
  ['statisticsTextColor', t.int32]
])

const TerrainPassGraphic = struct([
  ['exitTileId', t.int32],
  ['enterTileId', t.int32],
  ['walkTileId', t.int32],
  ifVersion(v => false /* SWGB */, struct([
    ['walkRate', t.float]
  ])).else(struct([
    ['replicationAmount', t.int32]
  ]))
])

const TerrainRestriction = count => struct([
  ['accessibleDamageMultiplier', t.array(s => struct.getValue(s.$parent, count), t.float)],
  ifVersion(v => true /* AOK and up */, struct([
    ['passGraphics', t.array(s => struct.getValue(s.$parent.$parent, count), TerrainPassGraphic)]
  ]))
])

const SoundItem = struct([
  ['filename', t.char(13)],
  ['resourceId', t.int32],
  ['probability', t.int16],
  ifVersion(v => true /* AOK and up */, struct([
    ['civilization', t.int16],
    ['iconSet', t.int16]
  ]))
])

const Sound = struct([
  ['id', t.int16],
  ['playDelay', t.int16],
  ['fileCount', t.uint16],
  ['cacheTime', t.int32],
  ['items', t.array('fileCount', SoundItem)]
])

const GraphicDelta = struct([
  ['graphicId', t.int16],
  ['padding1', t.int16],
  ['spritePointer', t.int32],
  ['offsetX', t.int16],
  ['offsetY', t.int16],
  ['displayAngle', t.int16],
  ['padding2', t.int16]
])

const SoundProp = struct([
  ['delay', t.int16],
  ['id', t.int16]
])

const GraphicAttackSound = struct([
  ['soundProps', t.array(3, SoundProp)]
])

const Graphic = struct([
  ['name', t.char(21)],
  ['filename', t.char(13)],
  ['slpId', t.int32],
  ['isLoaded', t.int8],
  ['oldColorFlag', t.int8],
  ['layer', t.int8],
  ['playerColor', t.int8],
  ['adaptColor', t.int8],
  ['transparentSelection', t.uint8],
  ['coordinates', t.array(4, t.int16)],
  ['deltaCount', t.uint16],
  ['soundId', t.int16],
  ['attackSoundUsed', t.uint8],
  ['frameCount', t.uint16],
  ['angleCount', t.uint16],
  ['speedAdjust', t.float],
  ['frameRate', t.float],
  ['replayDelay', t.float],
  ['sequenceType', t.int8],
  ['id', t.int16],
  ['mirroringMode', t.int8],
  ifVersion(v => true /* AOK and up */, struct([
    ['editorFlag', t.int8]
  ])),
  ['deltas', t.array('deltaCount', GraphicDelta)],
  t.if('attackSoundUsed', struct([
    ['attackSounds', t.array('../angleCount', GraphicAttackSound)]
  ]))
])

const TileSize = struct([
  ['width', t.int16],
  ['height', t.int16],
  ['deltaZ', t.int16]
])

const TerrainAnimation = struct([
  ['isAnimated', t.bool],
  ['animationFrameCount', t.int16],
  ['pauseFrameCount', t.int16],
  ['interval', t.float],
  ['pauseBetweenLoops', t.float],
  ['frame', t.int16],
  ['drawFrame', t.int16],
  ['animateLast', t.float],
  ['frameChanged', t.bool],
  ['drawn', t.int8]
])

const FrameData = struct([
  ['frameCount', t.int16],
  ['angleCount', t.int16],
  ['shapeId', t.int16]
])

const Terrain = struct([
  ['enabled', t.bool],
  ['random', t.int8],
  ['name0', t.char(13)], // 17 in SWGB
  ['name1', t.char(13)], // 17 in SWGB
  ['slpId', t.int32],
  ['shapePointer', t.int32],
  ['soundId', t.int32],
  ifVersion(v => true /* AOK and up */, struct([
    ['blendPriority', t.int32],
    ['blendMode', t.int32]
  ])),
  ['minimap', struct([
    ['high', t.uint8],
    ['medium', t.uint8],
    ['low', t.uint8],
    ['cliffLt', t.uint8],
    ['cliffRt', t.uint8]
  ])],
  ['passableTerrain', t.int8],
  ['impassableTerrain', t.int8],
  TerrainAnimation,
  ['elevationGraphics', t.array(19, FrameData)],
  ['terrainReplacementId', t.int16],
  ['terrainToDraw0', t.int16],
  ['terrainToDraw1', t.int16],
  ['borders', t.array(getTerrainCount, t.int16)],
  ['terrainUnitId', t.array(30, t.int16)],
  ['terrainUnitDensity', t.array(30, t.int16)],
  ['terrainPlacementFlag', t.array(30, t.int8)],
  ['terrainUnitsUsedCount', t.int16],
  ifVersion(v => true /* not SWGB */, struct([
    ['phantom', t.int16]
  ]))
])

const TerrainBorder = struct([
  ['enabled', t.bool],
  ['random', t.int8],
  ['name0', t.char(13)],
  ['name1', t.char(13)],
  ['slpId', t.int32],
  ['shapePointer', t.int32],
  ['soundId', t.int32],
  ['color', t.array(3, t.uint8)],
  TerrainAnimation,
  ['frames', t.array(19 * 12, FrameData)],
  ['drawTile', t.int16],
  ['underlayTerrain', t.int16],
  ['borderStyle', t.int16]
])

const RandomMapInfo = struct([
  ['mapId', t.int32],
  ['borderLeft', t.int32],
  ['borderTop', t.int32],
  ['borderRight', t.int32],
  ['borderBottom', t.int32],
  ['borderUsage', t.int32],
  ['waterShape', t.int32],
  ['baseTerrain', t.int32],
  ['landCoverage', t.int32],
  ['unusedId', t.int32],
  ['baseZoneCount', t.uint32],
  ['baseZonePointer', t.int32],
  ['terrainCount', t.uint32],
  ['terrainPointer', t.int32],
  ['objectCount', t.uint32],
  ['objectPointer', t.int32],
  ['elevationCount', t.uint32],
  ['elevationPointer', t.int32]
])

const RandomMapLand = struct([
  ['landId', t.int32],
  ['terrain', t.int32],
  ['spacing', t.int32],
  ['baseSize', t.int32],
  ['zone', t.int8],
  ['placementType', t.int8],
  t.skip(2), // padding
  ['baseX', t.int32],
  ['baseY', t.int32],
  ['landSize', t.int8],
  ['byPlayerFlag', t.int8],
  t.skip(2), // padding
  ['startAreaRadius', t.int32],
  ['borderFuzziness', t.int32],
  ['clumpiness', t.int32]
])

const RandomMapTerrain = struct([
  ['size', t.int32],
  ['terrain', t.int32],
  ['numberOfClumps', t.int32],
  ['edgeSpacing', t.int32],
  ['placementZone', t.int32],
  ['clumpiness', t.int32]
])

const RandomMapObject = struct([
  ['objectId', t.int32],
  ['baseTerrain', t.int32],
  ['groupingType', t.int8],
  ['scalingType', t.int8],
  t.skip(2), // padding
  ['objectsPerGroup', t.int32],
  ['groupVariance', t.int32],
  ['numberOfGroups', t.int32],
  ['groupRadius', t.int32],
  ['ownAtStart', t.int32],
  ['setPlaceForAllPlayers', t.int32],
  ['minDistanceToPlayers', t.int32],
  ['maxDistanceToPlayers', t.int32]
])

const RandomMapElevation = struct([
  ['size', t.int32],
  ['terrain', t.int32],
  ['numberOfClumps', t.int32],
  ['baseTerrain', t.int32],
  ['baseElevation', t.int32],
  ['tileSpacing', t.int32]
])

const RandomMap = struct([
  ['borderLeft', t.int32],
  ['borderTop', t.int32],
  ['borderRight', t.int32],
  ['borderBottom', t.int32],
  ['borderUsage', t.int32],
  ['waterShape', t.int32],
  ['baseTerrain', t.int32],
  ['landCoverage', t.int32],
  ['unusedId', t.int32],
  ['baseZoneCount', t.uint32],
  ['baseZonePointer', t.int32],
  ['baseZones', t.array('baseZoneCount', RandomMapLand)],
  ['terrainCount', t.uint32],
  ['terrainPointer', t.int32],
  ['terrains', t.array('terrainCount', RandomMapTerrain)],
  ['objectCount', t.uint32],
  ['objectPointer', t.int32],
  ['objects', t.array('objectCount', RandomMapObject)],
  ['elevationCount', t.uint32],
  ['elevationPointer', t.int32],
  ['elevations', t.array('elevationCount', RandomMapElevation)]
])

const TechEffect = struct([
  ['type', t.int8],
  ['unit', t.int16],
  ['unitClassId', t.int16],
  ['attributeId', t.int16],
  ['amount', t.float]
])

const Tech = struct([
  ['name', t.char(31)],
  ['effects', dynamicArray(t.uint16, TechEffect)]
])

const ObjectCommand = struct([
  ['commandUsed', t.int16],
  ['id', t.int16],
  ['isDefault', t.bool],
  ['type', t.int16],
  ['classId', t.int16],
  ['objectId', t.int16],
  ['terrainId', t.int16],
  ['resourceIn', t.int16],
  ['resourceMultiplier', t.int16],
  ['resourceOut', t.int16],
  ['resourceUnused', t.int16],
  ['workValue1', t.float],
  ['workValue2', t.float],
  ['workRange', t.float],
  ['searchMode', t.int8],
  ['searchTime', t.float],
  ['enableTargeting', t.int8],
  ['combatLevelFlag', t.int8],
  ['gatherType', t.int16],
  ['workMode2', t.int16],
  ['ownerType', t.int8],
  ['carryCheck', t.int8],
  ['stateBuild', t.int8],
  ['moveSpriteId', t.int16],
  ['proceedSpriteId', t.int16],
  ['workSpriteId', t.int16],
  ['carrySpriteId', t.int16],
  ['resourceGatherSoundId', t.int16],
  ['resourceDepositSoundId', t.int16]
])

const ObjectHeader = struct([
  ['exists', t.bool],
  t.if('exists', struct([
    ['commands', dynamicArray(t.uint16, ObjectCommand)]
  ]))
])

const ResourceStorage = struct([
  ['type', t.int16],
  ['amount', t.float],
  ['usedMode', t.int8]
])

const DamageGraphic = struct([
  ['graphicId', t.int16],
  ['damagePercent', t.int8],
  ['oldApplyMode', t.int8],
  ['applyMode', t.int8]
])

const StaticObject = struct([
  ['nameLength', t.uint16],
  ['id0', t.int16],
  ['languageDllName', t.uint16],
  ['languageDllCreation', t.uint16],
  ['class', t.int16],
  ['standingGraphic0', t.int16],
  ['standingGraphic1', t.int16],
  ['dyingGraphic', t.int16],
  ['undeadGraphic', t.int16],
  ['deathMode', t.int8],
  ['hitPoints', t.int16],
  ['lineOfSight', t.float],
  ['garrisonCapacity', t.int8],
  ['radius', struct([
    ['x', t.float],
    ['y', t.float],
    ['z', t.float]
  ])],
  ['trainSound', t.int16],
  ['damageSound', t.int16], // not in AOE1
  ['deadUnitId', t.int16],
  ['placementMode', t.int8],
  ['canBeBuiltOn', t.int8],
  ['iconId', t.int16],
  ['hiddenInEditor', t.int8],
  ['oldPortraitIconId', t.int16],
  ['enabled', t.bool],
  ['disabled', t.bool],
  ['placementSideTerrain0', t.int16],
  ['placementSideTerrain1', t.int16],
  ['placementTerrain0', t.int16],
  ['placementTerrain1', t.int16],
  ['clearanceSize', struct([
    ['x', t.float],
    ['y', t.float]
  ])],
  ['buildingMode', t.int8],
  ['visibleInFog', t.int8],
  ['terrainRestriction', t.int16],
  ['flyMode', t.int8],
  ['resourceCapacity', t.int16],
  ['resourceDecay', t.float],
  ['blastDefenseLevel', t.int8],
  ['combatLevel', t.int8],
  ['interactionMode', t.int8],
  ['mapDrawLevel', t.int8],
  ['unitLevel', t.int8],
  ['attackReaction', t.float],
  ['minimapColor', t.int8],
  ['languageDllHelp', t.int32],
  ['languageDllHotkeyText', t.int32],
  ['hotkeys', t.int32],
  ['recycleable', t.int8],
  ['enableAutoGather', t.int8],
  ['doppelgangerOnDeath', t.int8],
  ['resourceGatherDrop', t.int8],
  ['occlusionMask', t.int8],
  ['obstructionType', t.int8],
  ['selectionShape', t.int8],
  ['trait', t.uint8],
  ['civilization', t.int8],
  ['attributePiece', t.int16],
  ['selectionEffect', t.int8],
  ['editorSelectionColor', t.uint8],
  ['selectionShapePos', struct([
    ['x', t.float],
    ['y', t.float],
    ['z', t.float]
  ])],
  ['resourceStorage', t.array(3, ResourceStorage)],
  ['damageGraphics', dynamicArray(t.int8, DamageGraphic)],
  ['selectionSound', t.int16],
  ['dyingSound', t.int16],
  ['oldAttackMode', t.int8],
  ['convertTerrain', t.int8],
  ['name', t.char('nameLength')],
  ['id1', t.int16],
  ['id2', t.int16]
])

const AnimatedObject = struct([
  StaticObject,
  ['speed', t.float]
])

const DoppelgangerObject = struct([
  AnimatedObject
])

const MovingObject = struct([
  DoppelgangerObject,
  ['walkingGraphics0', t.int16],
  ['walkingGraphics1', t.int16],
  ['turnSpeed', t.float],
  ['oldSizeClass', t.int8],
  ['trailObjectId', t.int16],
  ['trailOptions', t.uint8],
  ['trailSpacing', t.float],
  ['oldMoveAlgorithm', t.int8],
  ['turnRadius', t.float],
  ['turnRadiusSpeed', t.float],
  ['maxYawPerSecondMoving', t.float],
  ['stationaryYawRevolutionTime', t.float],
  ['maxYawPerSecondStationary', t.float]
])

const ActionObject = struct([
  MovingObject,
  ['defaultTaskId', t.int16],
  ['searchRadius', t.float],
  ['workRate', t.float],
  ['dropSite0', t.int16],
  ['dropSite1', t.int16],
  ['taskByGroup', t.int8],
  ['commandSoundId', t.int16],
  ['stopSoundId', t.int16],
  ['runPattern', t.int8]
  // ObjectCommands here for AOE1
])

const HitType = struct([
  ['type', t.int16],
  ['amount', t.int16]
])

const ProjectileObject = struct([
  ActionObject,
  ['defaultArmor', t.int16],
  ['attacks', dynamicArray(t.uint16, HitType)],
  ['armors', dynamicArray(t.uint16, HitType)],
  ['boundaryId', t.int16],
  ['weaponRangeMax', t.float],
  ['blastRange', t.float],
  ['attackSpeed', t.float],
  ['projectileObjectId', t.int16],
  ['baseHitChance', t.int16],
  ['breakOffCombat', t.int8],
  ['frameDelay', t.int16],
  ['weaponOffset', struct([
    ['x', t.float],
    ['y', t.float],
    ['z', t.float]
  ])],
  ['blastLevelOffense', t.int8],
  ['weaponRangeMin', t.float],
  ['accuracyDispersion', t.float],
  ['fightSpriteId', t.int16],
  ['meleeArmorDisplayed', t.int16],
  ['attackDisplayed', t.int16],
  ['rangeDisplayed', t.float],
  ['reloadTimeDisplayed', t.float]
])

const MissileObject = struct([
  ProjectileObject,
  ['projectileType', t.int8],
  ['smartMode', t.int8],
  ['dropAnimationMode', t.int8],
  ['penetrationMode', t.int8],
  ['areaOfEffectSpecial', t.int8],
  ['projectileArc', t.float]
])

const ResourceCost = struct([
  ['type', t.int16],
  ['amount', t.int16],
  ['enabled', t.int16]
])

const LivingObject = struct([
  ProjectileObject,
  ['resourceCost', t.array(3, ResourceCost)],
  ['creationTime', t.int16],
  ['creationLocationId', t.int16],
  ['creationButtonId', t.int8],
  ['rearAttackModifier', t.float],
  ['flankAttackModifier', t.float],
  ['creatableType', t.int8],
  ['heroMode', t.int8],
  ['garrisonGraphic', t.int32],
  ['attackProjectileCount', t.float],
  ['attackProjectileMaxCount', t.int8],
  ['attackProjectileSpawningAreaWidth', t.float],
  ['attackProjectileSpawningAreaLength', t.float],
  ['attackProjectileSpawningAreaRandomness', t.float],
  ['attackProjectileSecondaryObjectId', t.int32],
  ['specialGraphicid', t.int32],
  ['specialActivation', t.int8],
  ['pierceArmorDisplayed', t.int16]
])

const BuildingAnnex = struct([
  ['objectId', t.int16],
  ['misplaced0', t.float],
  ['misplaced1', t.float]
])

const BuildingObject = struct([
  LivingObject,
  ['constructionGraphicId', t.int16],
  ['snowGraphicId', t.int16],
  ['adjacentMode', t.int8],
  ['graphicsAngle', t.int16],
  ['disappearsWhenBuilt', t.int8],
  ['stackUnitId', t.int16],
  ['foundationTerrainId', t.int16],
  ['oldOverlayId', t.int16],
  ['researchId', t.int16],
  ['canBurn', t.bool],
  ['annexes', t.array(4, BuildingAnnex)],
  ['headObjectId', t.int16],
  ['transformObjectId', t.int16],
  ['transformSoundId', t.int16],
  ['constructionSoundId', t.int16],
  ['garrisonType', t.int8],
  ['garrisonHealRate', t.float],
  ['garrisonRepairRate', t.float],
  ['salvageObjectId', t.int16],
  ['salvageAttributes', t.array(6, t.int8)]
])

const TreeObject = struct([
  StaticObject
])

const TriageObject = struct([
  ['type', t.int8],
  t.if(s => s.type === 10, StaticObject),
  t.if(s => s.type === 20, AnimatedObject),
  t.if(s => s.type === 25, DoppelgangerObject),
  t.if(s => s.type === 30, MovingObject),
  t.if(s => s.type === 40, ActionObject),
  t.if(s => s.type === 50, ProjectileObject),
  t.if(s => s.type === 60, MissileObject),
  t.if(s => s.type === 70, LivingObject),
  t.if(s => s.type === 80, BuildingObject),
  t.if(s => s.type === 90, TreeObject)
])

const Civilization = struct([
  ['playerType', t.int8],
  ['name', t.char(20)],
  ['resourcesCount', t.uint16],
  ['techTreeId', t.int16],
  ['teamBonusId', t.int16], // not in AOE1
  ['resources', t.array('resourcesCount', t.float)],
  ['iconSet', t.int8],
  ['objectCount', t.uint16],
  ['objectOffsets', t.array('objectCount', t.int32)],
  ['objects', holeyArray('objectCount', 'objectOffsets', TriageObject)]
])

const ResearchResourceCost = struct([
  ['resourceId', t.int16],
  ['amount', t.int16],
  ['enabled', t.bool]
])

const Research = struct([
  ['requiredTechIds', t.array(6, t.int16)],
  ['resourceCosts', t.array(3, ResearchResourceCost)],
  ['requiredTechCount', t.int16],
  ['civilizationId', t.int16],
  ['fullTechMode', t.int16],
  ['researchLocationId', t.int16],
  ['languageDllName', t.uint16],
  ['languageDllDescription', t.uint16],
  ['researchTime', t.int16],
  ['techEffectId', t.int16],
  ['techType', t.int16],
  ['iconId', t.int16],
  ['buttonId', t.int8],
  ['languageDllHelp', t.int32],
  ['languageDllTechTree', t.int32],
  ['hotkey', t.int32],
  ['name', dynamicString(t.uint16)]
  // SWGB
  // ['name2', dynamicString(t.uint16)]
])

const DatFile = struct([
  ['fileVersion', t.char(8)],
  ['terrainRestrictionCount', t.uint16],
  ['terrainCount', t.uint16],
  ['terrainTables', t.array('terrainRestrictionCount', t.int32)],
  ['terrainPassGraphicPointers', t.array('terrainRestrictionCount', t.int32)],
  ['terrainRestrictions', t.array('terrainRestrictionCount', TerrainRestriction('terrainCount'))],
  ['playerColors', dynamicArray(t.uint16, PlayerColor)],
  ['sounds', dynamicArray(t.uint16, Sound)],
  ['graphicCount', t.uint16],
  ['graphicPtrs', t.array('graphicCount', t.uint32)],
  ['graphics', holeyArray('graphicCount', 'graphicPtrs', Graphic)],
  ['virtPointer', t.int32],
  ['mapPointer', t.int32],
  ['mapWidth', t.int32],
  ['mapHeight', t.int32],
  ['worldWidth', t.int32],
  ['worldHeight', t.int32],
  ['tileSizes', t.array(19, TileSize)],
  ['padding1', t.int16],
  ['terrains', t.array(getTerrainCount, Terrain)],
  ['terrainBorders', t.array(16, TerrainBorder)],
  ['mapRowOffset', t.int32],
  ['mapMinX', t.float],
  ['mapMinY', t.float],
  ['mapMaxX', t.float],
  ['mapMaxY', t.float],
  ['mapMaxX+1', t.float],
  ['mapMaxY+1', t.float],
  ['additionalTerrainCount', t.uint16],
  ['bordersUsed', t.uint16],
  ['maxTerrain', t.int16],
  ['tileWidth', t.int16],
  ['tileHeight', t.int16],
  ['tileHalfWidth', t.int16],
  ['tileHalfHeight', t.int16],
  ['elevHeight', t.int16],
  ['currentRow', t.int16],
  ['currentColumn', t.int16],
  ['blockBeginRow', t.int16],
  ['blockEndRow', t.int16],
  ['blockBeginColumn', t.int16],
  ['blockEndColumn', t.int16],
  ['searchMapPointer', t.int32],
  ['searchMapRowsPointer', t.int32],
  ['anyFrameChange', t.int8],
  ['mapVisibleFlag', t.int8],
  ['fogFlag', t.int8],
  ['terrainBlob0', t.array(21, t.uint8)], // 25 in SWGB
  ['terrainBlob1', t.array(157, t.uint32)],
  ['randomMapCount', t.uint32],
  ['randomMapPointer', t.uint32],
  ['randomMapInfo', t.array('randomMapCount', RandomMapInfo)],
  ['randomMaps', t.array('randomMapCount', RandomMap)],
  ['techs', dynamicArray(t.uint32, Tech)],
  // TODO Unit lines for SWGB
  ['objectHeaders', dynamicArray(t.uint32, ObjectHeader)],
  ['civilizations', dynamicArray(t.uint16, Civilization)],
  ['researches', dynamicArray(t.uint16, Research)]
])

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
}
