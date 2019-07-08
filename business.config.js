// 业务代码
const createModuleIdFactory = require('./config/createModuleIdFactory');
const postProcessModulesFilter = require('./config/postProcessModulesFilter');


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
    // 函数传入的是你要打包的module文件的绝对路径返回的是这个module的id
    createModuleIdFactory: createModuleIdFactory,
    // A filter function to discard specific modules from the output.
    // 数传入的是module信息，返回是boolean值，如果是false就过滤不打包
    // 配置processModuleFilter过滤基础包打出业务包
    processModuleFilter: postProcessModulesFilter,
    /* serializer options */
  },
};
