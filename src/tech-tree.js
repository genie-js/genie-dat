const struct = require("awestruct");
const t = struct.types;

const TechTreeCommon = struct([
  ["preregsCount", t.int8],
  t.skip(3), // padding
  ["preregIds", t.array(10, t.int32)],
  ["preregTypes", t.array(10, t.int32)]
]);

const TechTreeAge = struct([
  ["id", t.int32],
  ["status", t.int8],
  ["buildings", t.dynarray(t.uint8, t.int32)],
  ["units", t.dynarray(t.uint8, t.int32)],
  ["techs", t.dynarray(t.uint8, t.int32)],
  TechTreeCommon,
  ["buildingLevelCount", t.int8],
  ["buildingsPerZone", t.array(10, t.int8)],
  ["groupLengthPerZone", t.array(10, t.int8)],
  ["maxAgeLength", t.int8],
  ["nodeType", t.int32]
]);

const TechTreeBuilding = struct([
  ["id", t.int32],
  ["status", t.int8],
  ["buildings", t.dynarray(t.uint8, t.int32)],
  ["units", t.dynarray(t.uint8, t.int32)],
  ["techs", t.dynarray(t.uint8, t.int32)],
  TechTreeCommon,
  ["locationInAge", t.int8],
  ["unitsTechsTotal", t.array(5, t.int8)],
  ["unitsTechsFirst", t.array(5, t.int8)],
  ["nodeType", t.int32],
  ["enablingResearch", t.int32]
]);

const TechTreeUnit = struct([
  ["id", t.int32],
  ["status", t.int8],
  ["buildFrom", t.int32],
  TechTreeCommon,
  ["groupId", t.int32],
  ["units", t.dynarray(t.uint8, t.int32)],
  ["locationInAge", t.int32],
  ["requiredResearch", t.int32],
  ["nodeType", t.int32],
  ["enablingResearch", t.int32]
]);

const TechTreeResearch = struct([
  ["id", t.int32],
  ["status", t.int8],
  ["researchFrom", t.int32],
  ["buildings", t.dynarray(t.uint8, t.int32)],
  ["units", t.dynarray(t.uint8, t.int32)],
  ["techs", t.dynarray(t.uint8, t.int32)],
  TechTreeCommon,
  ["groupId", t.int32],
  ["locationInAge", t.int32],
  ["nodeType", t.int32]
]);

const TechTree = struct([
  ["ageCount", t.uint8],
  ["buildingCount", t.uint8],
  ["unitCount", t.uint8],
  ["researchCount", t.uint8],
  ["totalUnitTechGroups", t.int32],
  ["ages", t.array("ageCount", TechTreeAge)],
  ["buildings", t.array("buildingCount", TechTreeBuilding)],
  ["units", t.array("unitCount", TechTreeUnit)],
  ["researchs", t.array("researchCount", TechTreeResearch)]
]);

module.exports = TechTree;
