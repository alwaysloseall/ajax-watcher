var http = require('http'),
    fs = require('fs');

http.createServer(function (req, res){
    // 主页
    if (req.url == "/") {
        fs.createReadStream(`${__dirname}/index.html`).pipe(res);
    }

    else if (req.url.match(/.html|.js|.jpg|.css/)) {
        fs.createReadStream(__dirname + req.url).pipe(res);
    }

    else if (req.url == "/getJson") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("{ a: 'a', b: 'b' }");
    }

    else if (req.url == "/getJson1") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("{ name: 'Json1', url: 'getJson1' }");
    }

    // 404错误
    else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 error! File not found.");
    }
}).listen(80, '127.0.0.1');

console.log('Server running on port 80');