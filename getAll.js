const login = require("./resources/login"),
    {
        aesDecrypt,
        aesEncrypt
    } = require("./resources/aes"),
    request = require("request"),
    fs = require("fs");

let config;

login().then((res) => {
    config=res;
    request({
        url: `http://note.func.zykj.org/api/notes/getall`,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
            "Authorization": `Bearer ${config.token}`
        }
    }, (err, res, data) => {
       fs.writeFileSync("resources/noteList.json",JSON.stringify(JSON.parse(aesDecrypt(data.data)),null,2));
    })
})