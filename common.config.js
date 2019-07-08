/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
// 基础打包配置
const createModuleIdFactory = require('./config/createModuleIdFactory');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: false,
      },
    }),
  },
  serializer: {
    // 所有模块一经转换就会被序列化，Serialization会组合这些模块来生成一个或多个包，包就是将模块组合成一个JavaScript文件的包。
    // 函数传入的是你要打包的module文件的绝对路径返回的是这个module的id
    // 配置createModuleIdFactory让其每次打包都module们使用固定的id(路径相关)
    createModuleIdFactory: createModuleIdFactory,
    /* serializer options */
  },
};
