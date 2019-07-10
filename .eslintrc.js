module.exports = {
  root: true,
  extends: ['@react-native-community'],
  rules: {
    // 解决冲突规则
    'prettier/prettier': [
      'error',
      {
        // 单引号
        singleQuote: true,
        // 多行尾逗号
        trailingComma: 'es5',
        // 字面量对象花括号输出空格
        bracketSpacing: true,
        // 在多行JSX元素最后一行的末尾添加 > 而使 > 单独一行（不适用于自闭和元素）
        jsxBracketSameLine: false,
        parser: 'flow',
      },
    ],
  }
};
