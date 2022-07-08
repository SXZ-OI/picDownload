const {
    resolve
} = require("path");

const koa = require("koa"),
    server = new koa(),
    router = require("koa-router")(),
    static = require("koa-static"),
    path = require("path"),
    fs = require("fs"),
    {
        aesDecrypt,
        aesEncrypt
    } = require("./resources/aes"),
    request = require("request"),
    exec = require("child_process").exec,
    archiver = require("archiver");

router.get('/', ctx => ctx.body = fs.readFileSync("index.html"))
    .get('/favicon.ico', ctx => ctx.body = fs.readFileSync("resources/favicon.gif"))
    .post('/getAll', async ctx => {
        await new Promise((res) => {
            var body = "";
            ctx.req.on("data", data => body += data);
            ctx.req.on("end", async () => {
                try {
                    body = JSON.parse(body);
                    ctx.body = await new Promise((resolve) => request({
                        url: `http://note.func.zykj.org/api/notes/getall`,
                        method: "GET",
                        json: true,
                        headers: {
                            "content-type": "application/json",
                            "Authorization": `Bearer ${body.token}`
                        }
                    }, (err, res, data) => {
                        if (res.statusCode == 401) {
                            resolve("Token爆炸");
                            ctx.status = 401;
                        } else resolve(JSON.stringify(JSON.parse(aesDecrypt(data.data)), null, 2));
                    }))
                } catch (e) {
                    ctx.status = 401;
                    ctx.body = "请求错误";
                    console.log(e);
                }
                res(body);
            });
        })
    })
    .post('/login', async ctx => {
        await new Promise((res) => {
            var body = "";
            ctx.req.on("data", data => body += data);
            ctx.req.on("end", async () => {
                try {
                    body = JSON.parse(body);
                    ctx.body = await new Promise((resolve) => request({
                        url: "http://note.func.zykj.org/api/Account/GuestLogin",
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: aesEncrypt(`{"Password":"${body.password}","SchoolCode":"sxz","UserName":"${body.account}","clientCode":"unknown"}`)
                    }, (err, res, data) => {
                        data = JSON.parse(data);
                        if (data.code == 2007) {
                            ctx.status = 401;
                            resolve(data.msg);
                            return;
                        }
                        data = JSON.parse(aesDecrypt(data.data));
                        resolve(data);
                    }))
                } catch (e) {
                    ctx.body = "请求错误";
                    console.log(e);
                }
                res(body);
            });
        })
    })
    .get('/download', async ctx => {
        var query = ctx.query,
            fileId = query["fileId"],
            name = query["name"],
            token = query["token"];
        await new Promise((resolve) => {
            request({
                url: `http://note.func.zykj.org/api/Resources/GetByFileId?${aesEncrypt("fileId="+fileId)}`,
                method: "GET",
                json: true,
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }, async (err, res, data) => {
                if (fs.existsSync(`picDownload/${name}`))
                    exec(`del /a/f/q picDownload/${name}`);
                else fs.mkdirSync(`picDownload/${name}`);
                var a = aesDecrypt(data.data).match(/cloudnote\/notes\/sxz[^\"]*?.jpg/g);
                for (var i in a)
                    await download("http://friday-note.oss-cn-hangzhou.aliyuncs.com/" + a[i], name, i + ".jpg");
                var zip = archiver('zip', {
                    lib: {
                        level: 9
                    }
                });
                var stream = fs.createWriteStream(`picDownload/${name}.zip`);
                zip.pipe(stream);
                zip.directory(`picDownload/${name}/`, 0);
                zip.finalize();
                stream.on("finish", () => {
                    ctx.body = fs.readFileSync(`picDownload/${name}.zip`);
                    resolve();
                })
            });
        })
    });

server.use(static(path.join(__dirname)));

server.use(async (ctx, next) => {
    await next();
    if (!ctx.body) {
        ctx.response.type = 'text/html';
        ctx.response.body = `<h1>404 Not Found</h1><pre>${JSON.stringify(ctx,null,2)}</pre>`;
    }
});
server.use(router.routes());

server.listen(3939);
console.log('Server started at port 3939...');

function download(address, name, title) {
    return new Promise((res) => {
        var req = request.get(address, null);
        var ws = fs.createWriteStream(`picDownload/${name}/${title}`);
        req.pipe(ws);
        ws.on("finish", () => res())
    });
}