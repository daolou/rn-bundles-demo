// 业务代码
const path = require('path');
const pathSep = path.posix.sep;
// 这里简单暴力地吧preclude和node_modules目录下的文件全部过滤掉，只打自己写的代码。
// 只有自己写的才算是业务代码
function postProcessModulesFilter(module) {
  //返回false则过滤不编译

  if (module.path.indexOf('__prelude__') >= 0) {
    return false;
  }
  if (module.path.indexOf(pathSep + 'node_modules' + pathSep) > 0) {
    if (`js${pathSep}script${pathSep}virtual` === module.output[0].type) {
      return true;
    }
    if (
      module.path.indexOf(
        `${pathSep}node_modules${pathSep}@babel${pathSep}runtime${pathSep}helpers`
      ) > 0
    ) {
      //添加这个判断，让@babel/runtime打进包去
      return true;
    }
    return false;
  }
  return true;
}

module.exports = postProcessModulesFilter;
