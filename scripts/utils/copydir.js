const path = require('path');
const fs = require('fs');
const promisify = require('util').promisify;
const copyFile = promisify(fs.copyFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const access = promisify(fs.access);
const resolvePath = require('./resolvePath');
const asyncForEach = require('./asyncForEach');


const copydir = async (from, to) => {
  from = resolvePath(from);
  to = resolvePath(to);
  try {
    await access(to);
  } catch (err) {
    // console.log(err)
    fs.mkdirSync(to, {
      recursive: true,
    });
  }
  const paths = await readdir(from);

  await asyncForEach(paths, async (item) => {
    const _src = path.join(from, item);
    const _dest = path.join(to, item);

    const stats = await stat(_src);
    if (stats.isFile()) {
      await copyFile(_src, _dest);
    } else if (stats.isDirectory) {
      await copydir(_src, _dest);
    }

  });
};

module.exports = copydir;

