const fs = require('fs')
const path = require('path')
const glob = require('glob').sync
const test = require('tape')
const { load } = require('../src')

const files = glob(path.join(__dirname, './fixtures/**/*.dat'))

files.forEach((file) => {
  test(path.relative(__dirname, file), {
    // AoK does not yet work
    skip: /\/empires2\.dat$/.test(file)
  }, (t) => {
    t.plan(3)
    fs.readFile(file, (err, buf) => {
      t.ifError(err)
      load(buf, (err, dat) => {
        t.ifError(err)
        t.ok(dat)
      })
    })
  })
})
