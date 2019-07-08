const path = require('path');
const fs = require('fs');
const promisify = require('util').promisify;
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const resolvePath = require('./resolvePath');
const asyncForEach = require('./asyncForEach');

const getdir = async (filePath,filedirArr = [])=>{
    const files = await readdir(resolvePath(filePath));
    // console.log('files: ',files)
    await asyncForEach(files, async (filename)=>{
        const filedir = path.join(filePath,filename);
        // console.log('filedir: ',filedir);
        const stats = await stat(filedir);
        if (stats.isFile()){
            // console.log('filedir: ',filedir);
            filedirArr.push(filedir);
        }
        if (stats.isDirectory()){
            await getdir(filedir,filedirArr);
        }
    });
    return filedirArr;
};

module.exports = getdir;
