// 基础打包配置
/**
 * version - js bundle版本，初始值是1，每次更新请手动加1
 * common - 公共基础包bundle
 * bundles - 业务模块基础包bundle
 * {

    "animate": true, // ios平台会使用, 当从A页面转场到B页面的时候,控制[self.navigationControllersetNavigationBarHidden: animated:];中的animate
    "statusBgColor": "#408EF5", //导航状态栏的背景色
    "type": "push", // 进入rn的形式(2种, push和present)

    "source": "Login", // 用于拆包打包是的入口entry_file
    "moduleName": "platform", // 模块名称,和 AppRegistry.registerComponent('platform', () => App);一一对应
    "bundleName": "platform.bundle" // 此模块打包出来的bundle名称, 生产环境使用
    }
 */
module.exports = {
  version: 1,
  common: {
    moduleName: 'platform',
    bundleName: 'platform.bundle',
  },
  bundles: [
    {
      animate: false,
      statusBgColor: '#408EF5',
      type: 'push',
      source: 'mine',
      moduleName: 'rbd_mine',
      bundleName: 'rbd_mine.bundle',
    },
    {
      animate: true,
      statusBgColor: '#ffffff',
      type: 'push',
      source: 'discover',
      moduleName: 'rbd_discover',
      bundleName: 'rbd_discover.bundle',
    },
  ],
};
