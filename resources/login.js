const fs = require("fs"),
    request = require("request"),
    {aesDecrypt,aesEncrypt}= require("./aes");
var config = {
    "account": "",
    "password": "",
    "filePath": "",
    "type": 6,
    "onlyPutFile": 0
}

function localConfig() {
    if (!fs.existsSync("resources/config.ini"))
        fs.writeFileSync("resources/config.ini", JSON.stringify(config));
    var data = fs.readFileSync("resources/config.ini").toString();
    config = JSON.parse(data);
    if (!config.token || config.relogin) return 0;
    return 1;
}

async function login() {
    if (!localConfig()) {
        await new Promise((resolve, reject) => request({
            url: "http://note.func.zykj.org/api/Account/GuestLogin",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: aesEncrypt(`{"Password":"${config.password}","SchoolCode":"sxz","UserName":"${config.account}","clientCode":"unknown"}`)
        }, (err, res, data) => {
            data = JSON.parse(data);
            if (data.code == 2007) {
                console.log(data.msg);
                return;
            }
            data = JSON.parse(aesDecrypt(data.data));
            config.token = data.token, config.id = data.userId, config.relogin = 0;
            fs.writeFileSync("resources/config.ini", JSON.stringify(config, null, 2));
            console.log("进行了登录操作");
            module.exports = config;
            resolve();
        }))
    }
    //console.log("Logined in");
    return config
}
//登录并获取信息

module.exports = login;
