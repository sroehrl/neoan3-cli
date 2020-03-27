const downloader = require('github-download');
const fs = require('fs-extra');
const path = require('path');

module.exports = {download:download, deleteRecursive:deleteFolderRecursive};

function deleteFolderRecursive(folder) {
    if (fs.existsSync(folder)) {
        fs.readdirSync(folder).forEach((file, index) => {
            const curPath = path.join(folder, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folder);
    }
}

async function download(urlOrObj, dest) {

    return new Promise((resolve, reject)=>{
        const tmp = dest + 'tmp';
        fs.mkdirSync(tmp, { recursive: true });
        let dld = downloader(urlOrObj, tmp, process.cwd());
        dld.on('end', async res => {
            fs.copy(tmp,dest,{mkdir:true},function(err){
                if(err) throw new Error(err);
                deleteFolderRecursive(tmp);
                resolve(dld)
            })

        });
    })
}