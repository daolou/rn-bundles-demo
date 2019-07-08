/**
 * 生成模块Id
 * 基础打包配置
 */
const path = require('path');
const pathSep = path.posix.sep;

function createModuleIdFactory() {
    const projectRootPath = process.cwd();//获取命令行执行的目录

    return modulePath => {

        // console.log(modulePath)
        let moduleName = '';
        if (modulePath.indexOf(`node_modules${pathSep}react-native${pathSep}Libraries${pathSep}`) > 0) {
            //这里是去除路径中的'node_modules/react-native/Libraries/‘之前（包括）的字符串，可以减少包大小，可有可无
            moduleName = modulePath.substr(modulePath.lastIndexOf(pathSep) + 1);
        } else if (modulePath.indexOf(projectRootPath) === 0) {
            //这里是取相对路径，不这么弄的话就会打出_user_smallnew_works_....这么长的路径，还会把计算机名打进去
            moduleName = modulePath.substr(projectRootPath.length + 1);
        }
        moduleName = moduleName.replace('.js', '');//js png字符串没必要打进去
        moduleName = moduleName.replace('.png', '');
        let regExp = pathSep === '\\' ? new RegExp('\\\\', 'gm') : new RegExp(pathSep, 'gm');
        moduleName = moduleName.replace(regExp, '_');//把path中的/换成下划线(适配Windows平台路径问题)

        // console.log(moduleName);

        return moduleName;
    };
}

module.exports = createModuleIdFactory;
