const login = require("./resources/login"),
    {
        aesDecrypt,
        aesEncrypt
    } = require("./resources/aes"),
    request = require("request"),
    fs = require("fs");

let config,
    fileId=process.argv[2]?process.argv[2]:"1e5f725818f8429b81ef8edc1e5a516c",
    name="📖Physics运动的描述";
//文件id i.g: 42ba6a192067477ab1546736ff1a3caf

login().then((res) => {
    config=res;
    request({
        url: `http://note.func.zykj.org/api/Resources/GetByFileId?${aesEncrypt("fileId="+fileId)}`,
        method: "GET",
        json: true,
        headers: {
            "content-type": "application/json",
            "Authorization": `Bearer ${config.token}`
        }
    }, (err, res, data) => {
        if(fs.existsSync(`picDownload/${name}`)){
            console.warn("已存在文件夹，请删除后重试");
            return;
        }
        fs.mkdirSync(`picDownload/${name}`);
        var a=aesDecrypt(data.data).match(/cloudnote\/notes\/sxz[^\"]*?.jpg/g);
        for(var i in a)
            download("http://friday-note.oss-cn-hangzhou.aliyuncs.com/"+a[i],i+".jpg");
    })
})

async function download(address, title) {
    var req = request.get(address,null);
    var ws = fs.createWriteStream(`picDownload/${name}/${title}`);
    req.pipe(ws);
}
