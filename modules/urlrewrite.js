/**
 * 用于支持 URL 重写。
 * @author xuld@vip.qq.com
 */

var Url = require('url');
var Http = require('http');

exports.init = function (application) {
    application.urlRewritesResolved = {};
};

exports.processRequest = function (context) {
    var urlRewrites = context.applicationInstance.urlRewrites;
    var urlRewritesResolved = context.applicationInstance.urlRewritesResolved;

    for (var rule in urlRewrites) {
        var regexp = urlRewritesResolved[rule] || (urlRewritesResolved[rule] = createRegExp(rule));
        var path = context.request.path.substr(1);
        if (regexp.test(path)) {
            var newPath = path.replace(regexp, urlRewrites[rule]);

            if (/^https?:\/\//.test(newPath)) {
                httpProxy(newPath, context);
            } else {
                context.rewritePath('/' + newPath);
            }
            return true;
        }
    }
    return false;
};

function createRegExp(text) {
    return new RegExp(text);
}

function httpProxy(url, context) {

    url = Url.parse(url, false);
    url.method = context.request.httpMethod;
    url.headers = {};

    for (var h in context.request.headers) {
        url.headers[h] = context.request.headers[h];
    }

    url.headers.host = url.host;
    
    var req = (url.protocol === "https" ? require('https') : require('http')).request(url, function (srcRes) {
        var destRes = context.response;
        srcRes.on('data', function (chunk) {
            destRes.binaryWrite(chunk);
        });
        srcRes.on('end', function () {
            destRes.end();
        });
        destRes.writeHead(srcRes.statusCode, srcRes.headers);
    });

    var content = context.request.content;

    if (content) {
        req.write(content);
    }

    req.end();
}
