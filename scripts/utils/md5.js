const crypto = require('crypto');
const fs = require('fs');
const resolvePath = require('./resolvePath');

const generateMd5 = fsHash => {
  return fsHash.digest('hex');
};

/**
 * @description 异步读取文件hash值
 * http://nodejs.cn/api/fs.html#fs_fs_readfile_path_options_callback
 * @param {string} filePath - 文件路径
 */
const getHash = filePath => {
  // 这里并没有使用stream，是因为对于.zip这种压缩包的二进制文件，用流的形式获取md5和普通的通过buffer/string获取的会不一样
  return new Promise((resolve, reject) => {
    fs.readFile(resolvePath(filePath), (err, data) => {
      if (err) {
        reject(err);
      }
      const fsHash = crypto.createHash('md5');

      fsHash.update(data);
      const md5 = generateMd5(fsHash);
      resolve(md5);
    });
  });
};

/**
 * @description 同步读取文件hash值
 * http://nodejs.cn/api/fs.html#fs_fs_readfilesync_path_options
 * @param {string} filePath - 文件路径
 */
const getHashSync = filePath => {
  try {
    const buffer = fs.readFileSync(resolvePath(filePath));
    const fsHash = crypto.createHash('md5');

    fsHash.update(buffer);
    const md5 = generateMd5(fsHash);
    return md5;
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  getHash,
  getHashSync,
};
