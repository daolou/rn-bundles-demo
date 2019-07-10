const path = require('path');

// filePath 是相对于项目根目录的路径
const resolvePath = filePath => {
  return path.resolve(__dirname, '../../', filePath);
};

module.exports = resolvePath;
