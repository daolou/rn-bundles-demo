const fs = require('fs');
const resolvePath = require('./resolvePath');
const util = require('util');
const pipeline = util.promisify(require('stream').pipeline);
const compressing = require('compressing');

const zip = async (filePath, out) => {
  const inputStream = new compressing.zip.Stream();
  const current_dest_children = fs.readdirSync(filePath);
  current_dest_children.forEach(file => {
    inputStream.addEntry(resolvePath(`${filePath}/${file}`));
  });
  out = resolvePath(out);
  const outStream = fs.createWriteStream(out);
  // console.log(inputStream)
  await pipeline(inputStream, outStream);
  return out;
  // console.log('管道连接成功');
};
const unzip = async (source, out) => {
  await compressing.zip.uncompress(resolvePath(source), resolvePath(out));
};

module.exports = {
  zip,
  unzip,
};
