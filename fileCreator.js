const fs = require('fs');
let dir ='./';
let fileCreator = {
    component:function(name,as, frame){
        let folder = dir+'component/'+name;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            // version
            fs.appendFile(dir + 'component/' + name.toLowerCase() + '/version.json', fileCreator.versionJson(name), function (err) {
                if (err) throw err;
            });
            // php
            let content = fileCreator.phpFrame(name,frame,as==='api');
            if(as==='route'){
                content += "    function init(){\n        $this->uni('"+frame+"')->output();\n    }";
            }
            content += "\n}";
            fs.appendFile(dir + 'component/' + name + '/' + fileCreator.fucase(name) +'.ctrl.php', content, function (err) {
                if (err) throw err;
                console.log('Component %s created',name);
            });
        } else {
            console.log('Component %s already exists',name);
        }

    },
    phpFrame:function(name, frame, useFrame){
        let answer =  "<?php\nnamespace Neoan3\\Components;\nuse Neoan3\\Core\\Unicore;\n\n";
        if(useFrame){
            answer += "use Neoan3\\Frame\\"+fileCreator.fucase(frame)+";\n\n"
        }
        answer += "class "+fileCreator.fucase(name)+" extends Unicore{\n";
        return answer;
    },
    fucase:function(string){
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    versionJson:function(name){
        let json = {"version":"0.0.1","name":name};
        return JSON.stringify(json);
    },
};
module.exports = fileCreator;