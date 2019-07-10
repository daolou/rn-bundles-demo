#!/usr/bin/env node

const fs = require('fs');
const execSync = require('child_process').execSync;
const program = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const config = require('../config/index');
const resolvePath = require('./utils/resolvePath');
const { zip, unzip } = require('./utils/zip');
const { getHashSync } = require('./utils/md5');
const copydir = require('./utils/copydir');
const getdir = require('./utils/getdir');
const asyncForEach = require('./utils/asyncForEach');

const PLATFORMS = ['ios', 'android'];
const TYPES = ['common', 'business'];

const checkPlatform = platform => {
  if (!PLATFORMS.includes(platform)) {
    throw new Error(`platform: ${PLATFORMS.join('or')}`);
  }
};
const checkType = type => {
  if (!TYPES.includes(type)) {
    throw new Error(`type: ${TYPES.join('or')}`);
  }
};
const checkVersion = version => {
  if (!version) {
    throw new Error('未读取到version，请检查configs/index.js文件');
  }
};
const getCMD = (platform, entry, output, current_dest, configfile) => {
  const cmd = [
    'node ./node_modules/react-native/local-cli/cli.js bundle',
    `--platform ${platform}`,
    '--dev false',
    `--entry-file ${resolvePath(entry)}`,
    `--bundle-output ${resolvePath(output)}`,
    `--assets-dest ${resolvePath(current_dest)}`,
    `--config ${resolvePath(configfile)}`,
  ];
  return cmd.join(' ');
};
const buildBundle = (platform, entry, output, current_dest, configfile) => {
  try {
    const cmd = getCMD(platform, entry, output, current_dest, configfile);
    const stdout = execSync(cmd, {
      maxBuffer: 1024 * 10000,
      encoding: 'utf8',
    });
    console.log(`\n${stdout}`);
  } catch (e) {
    throw new Error(JSON.stringify(e));
  }
};

program
  .version(require('../package.json').version, '-v, --version')
  .description('rn 打包脚手架');

// 打全量包命令
program
  .command('pack <platform> <type>')
  .description('打全量包jsbundles')
  .option('-v, --version [version]')
  .action(async (platform, type, options) => {
    // 未指定则从配置文件中获取js bundle版本号为默认值
    const version =
      typeof options.version === 'function' ? config.version : options.version;
    const spinner = ora();
    spinner.start(
      `正在执行命令 pack ${platform} ${type} -v ${version} 打包bundle...`
    );
    console.time(chalk.blue('total time'));
    try {
      checkPlatform(platform);
      checkType(type);
      checkVersion(version);
      // 打包输出目录
      const current_dest = `bundles/${version}/${platform}`;
      // 压缩包目录，上传服务器
      const prod_zip = `upload/${version}`;
      if (!fs.existsSync(current_dest)) {
        // 不存在，则新建打包目录
        fs.mkdirSync(current_dest, {
          recursive: true,
        });
      }
      if (!fs.existsSync(prod_zip)) {
        // 不存在，则新建压缩包目录
        fs.mkdirSync(prod_zip, {
          recursive: true,
        });
      }
      if (type === 'common') {
        // 打基础包
        const entry = 'common.js';
        const output = `${current_dest}/${config.common.bundleName}`;
        const configfile = 'common.config.js';
        buildBundle(platform, entry, output, current_dest, configfile);
      }
      if (type === 'business') {
        // 打业务包
        for (const item of config.bundles) {
          const entry = `src/pages/${item.source}/entry.js`;
          const output = `${current_dest}/${item.bundleName}`;
          const configfile = 'business.config.js';
          buildBundle(platform, entry, output, current_dest, configfile);
        }
      }
      // 将配置写入config.json供原生读取应用
      config.version = version; // 将命令行传入的参数写入
      fs.writeFileSync(
        resolvePath(`${current_dest}/config.json`),
        JSON.stringify(config, null, 2)
      );
      // 将bundles文件复制到原生工程目录
      const target =
        platform === 'ios'
          ? 'ios/RNBundlesDemo/webapp'
          : 'android/app/src/main/res';
      await copydir(current_dest, target);
      spinner.succeed('打包完成');
      spinner.stop();

      spinner.start('开始压缩全量包...');
      const zip_path = await zip(
        current_dest,
        `${prod_zip}/${platform}_all.zip`
      );
      console.log('\n全量压缩包路径:', zip_path);
      spinner.succeed('压缩完成');
      spinner.stop();
      console.log(
        chalk.green(
          `=== pack ${chalk.cyan(
            `${platform} ${type} -v ${version}`
          )} success ===`
        )
      );
    } catch (e) {
      spinner.fail('打包失败');
      spinner.stop();
      console.log(
        chalk.red(
          `=== pack ${chalk.cyan(`${platform} ${type} -v ${version}`)} fail ===`
        )
      );
      console.log(e);
    }

    console.timeEnd(chalk.blue('total time'));
    console.log('\n');
    process.exit(0);
  });

// 打增量包命令
program
  .command('patch <platform>')
  .description('生成增量包jsbundles')
  .option('-v, --version [version]')
  .action(async (platform, options) => {
    // v2: 将要发布的js版本，即本次修改的版本
    // v1: 上次发布的js版本，从远程服务器/cdn下载zip包
    // 未指定则从配置文件中获取js bundle版本号为默认值
    const v2 =
      typeof options.version === 'function' ? config.version : options.version;
    const spinner = ora();
    spinner.start(
      `正在执行命令 patch ${platform} -v ${v2} 生成增量包bundle...`
    );
    console.time(chalk.blue('total time'));
    try {
      checkPlatform(platform);
      checkVersion(v2);
      if (v2 === 1) {
        throw new Error('第一个版本，无增量包');
      }
      const v1 = v2 - 1;
      const bundles_v2 = `bundles/${v2}/${platform}`;
      const bundles_v1 = `bundles/${v1}/${platform}`;
      const zip_v1 = resolvePath(`upload/${v1}`);
      if (!fs.existsSync(zip_v1)) {
        fs.mkdirSync(zip_v1, {
          recursive: true,
        });
      }
      // 从cdn或服务器download 上一版本即v1的全量包
      const cmd = [
        'curl',
        `-o ${zip_v1}/${platform}_all.zip https://cdn.xxx/zip/${v1}/${platform}_all.zip`,
      ];
      execSync(cmd.join(' '), {
        stdio: 'inherit',
      });
      // 解压zip
      await unzip(`${zip_v1}/${platform}_all.zip`, bundles_v1);

      // 设置增量包目录
      const patch_v2 = `.patch/${v2}/${platform}`;

      // 将v2复制到.patch目录，对未改动的文件做减法，最终得到改动的文件，进行压缩
      await copydir(bundles_v2, patch_v2);

      const files_v2 = await getdir(patch_v2);
      const files_v1 = await getdir(bundles_v1);

      // 比较文件，得到更改过的增量文件
      await asyncForEach(files_v2, async item_v2 => {
        // 根据v2文件目录映射出（假设的）v1文件目录
        const ifitem_v2to1 = item_v2.replace(patch_v2, bundles_v1);
        // console.log(item_v2)
        // console.log(ifitem_v2to1)
        // 验证假设,是否成立：v1中是否真的有和v2相同的目录
        const hasSamePath = files_v1.includes(ifitem_v2to1);

        // v1,v2文件目录相同，进一步比较他们的hash
        if (hasSamePath) {
          const item_v2_md5 = getHashSync(item_v2);
          const item_v1_md5 = getHashSync(ifitem_v2to1);
          console.log('\n');
          console.log(item_v2, item_v2_md5);
          console.log(ifitem_v2to1, item_v1_md5);

          if (String(item_v2_md5) === String(item_v1_md5)) {
            // 文件md5 hash一致，说明文件未改动，删除即可
            console.log(chalk.green('==='), item_v2);
            fs.unlinkSync(item_v2);
          } else {
            console.log(chalk.red('!=='), item_v2);
          }
        }
      });
      // 删除空目录
      execSync(`find ${resolvePath(patch_v2)} -type d -empty -delete`, {
        stdio: 'inherit',
      });
      spinner.succeed('生成完成');
      spinner.stop();

      // 压缩增量文件
      spinner.start('开始压缩增量包...');
      // 上传服务器的压缩包
      const prod_zip = `./prod_zip/${v2}/`;
      const zipout = await zip(patch_v2, `${prod_zip}${platform}_patch.zip`);
      console.log('\n增量压缩包路径:', zipout);
      spinner.succeed('压缩完成');
      spinner.stop();
      console.log(
        chalk.green(`=== patch ${chalk.cyan(`${platform} -v ${v2}`)} fail ===`)
      );
    } catch (e) {
      spinner.fail('生成失败');
      spinner.stop();
      console.log(
        chalk.red(`=== patch ${chalk.cyan(`${platform} -v ${v2}`)} fail ===`)
      );
      console.log(e);
    }

    console.timeEnd(chalk.blue('total time'));
    console.log('\n');
    process.exit(0);
  });

program
  .command('hash <target>')
  .description('获取文件指纹（md5）')
  .option('-v, --version [version]')
  .action((target, options) => {
    // 未指定则从配置文件中获取js bundle版本号为默认值
    const version =
      typeof options.version === 'function' ? config.version : options.version;
    const spinner = ora();
    spinner.start(`正在执行命令 hash ${target} 打包bundle...`);
    console.time(chalk.blue('total time'));
    try {
      if (PLATFORMS.includes(target)) {
        const all = `upload/${version}/${target}_all.zip`;
        const all_md5 = getHashSync(all);
        console.log(chalk.green('\n全量压缩包路径：'), resolvePath(all));
        console.log(chalk.green('全量压缩包md5：'), all_md5);
        if (version > 1) {
          const patch = `upload/${version}/${target}_patch.zip`;
          const patch_md5 = getHashSync(patch);
          console.log(chalk.green('\n增量压缩包路径：'), resolvePath(patch));
          console.log(chalk.green('增量压缩包md5：'), patch_md5);
        }
      } else {
        const md5 = getHashSync(target);
        console.log(chalk.green(`\n${target}:`), md5);
      }
      spinner.succeed('获取完成');
      spinner.stop();
    } catch (e) {
      spinner.fail('获取失败');
      spinner.stop();
      console.log(chalk.red(`=== hash ${chalk.cyan(`${target}`)} fail ===`));
      console.log(e);
    }
    console.timeEnd(chalk.blue('total time'));
    console.log('\n');
    process.exit(0);
  });

program.on('--help', () => {
  console.log('');
  console.log(chalk.green('Examples:'));
});

program.parse(process.argv);
