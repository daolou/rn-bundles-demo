// 基础包
// 将项目中所有的第三方引用包都放在基础包里面

import 'react';
import 'react-native';
import 'react-native-fast-image';

if (!__DEV__) {
  console = {
    info: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
    time: () => {},
    timeEnd: () => {},
  };
}
