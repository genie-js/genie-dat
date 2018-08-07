const struct = require('awestruct')
const t = struct.types

module.exports = (sizeType, elementType) =>
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
