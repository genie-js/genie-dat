# genie-dat

read and write age of empires .dat files

[Install](#install) - [Usage](#usage) - [Limitations](#limitations) - [API](#api) - [License: LGPL-3](#license)

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/genie-dat.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/genie-dat
[travis-image]: https://img.shields.io/travis/goto-bus-stop/genie-dat.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/genie-dat
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install genie-dat
```

## Usage

```js
var genieDat = require('genie-dat')
var buffer = require('fs').readFileSync('/path/to/empires2_x1_p1.dat')
genieDat.load(buffer, (err, dat) => {
  console.log(dat.civilizations.map(civ => civ.name))
})
```

## Limitations

Currently this does not yet read the tech tree data, and only Age of Conquerors style data files are supported. The goal is to support many more formats in the future.

Parsing a large binary file like this is quite slow, it takes about 6 seconds on my machine. This is probably not inherent and just has to do with the way this library is implemented on top of [awestruct](https://github.com/goto-bus-stop/awestruct). Hopefully awestruct's performance can be improved in the future. You should cache the result if you need it often.

## API

### `genieDat.load(buffer, cb)`

Decompress and load `buffer`, eg. a raw .dat file. `cb` is a Node-style callback receiving `(err, dat)`.
`dat` is a plain object representing the dat file contents. `console.log()` it to find out what's in it. There is a lot of junk, some of the more useful properties are:

 - `playerColors` - Player colours, mostly offsets into the main [palette](https://github.com/goto-bus-stop/jascpal) file
 - `techs` - Technology effects
 - `terrains` - Lists terrains
 - `civilizations` - Lists available civilizations
   - `civilizations[i].objects` - Lists unit statistics for each civ
 - `researches` - Lists available researches—this refers to the technology effects a lot

### `genieDat.loadRaw(buffer, cb)`

Load an already decompressed `buffer`. Use this if you manually did `zlib.inflateRaw` or got an uncompressed buffer through some other means. Otherwise it is identical to `genieDat.load`.

## License

This project is based heavily on [genieutils](https://github.com/Tapsa/genieutils) by apreiml and Tapsa, and on the [openage](https://github.com/sfttech/openage) [conversion script](https://github.com/sfttech/openage/tree/master/openage/convert/gamedata).

[LGPL-3](LICENSE)
