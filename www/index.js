var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
// var multer = require('multer');
var app = express();
var http = require('http');
var https = require('https');
var util = require('util');

function json2s(s) {
	return JSON.stringify(s);
}

// app.options('*', cors()); // include before other routes
app.use(cors({
	origin : true,
}));

// for parsing application/json
app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended : true
}));
// for parsing multipart/form-data
// app.use(multer());

function httpGet(url, asJson, success, error) {
	https.get(url, function(res) {
		// statusCode
		var data = '';
		res.on('data', function(d) {
			data += d;
		});
		res.on('end', function() {
			if (success) {
//				console.log('[success]', data, url);
				if (asJson)
					success(JSON.parse(data));
				else
					success(data);
			}
		});
	}).on('error', function(e) {
//		console.log('[error]', e, url);
		if (error)
			error(e);
	});
}

function httpGetJson(url, success, error) {
	httpGet(url, true, success, error);
}

// http://mp.weixin.qq.com/wiki/17/c0f37d5704f0b64713d5d2c37b468d75.html
app.post('/weixinUserInfo', function(req, res) {
	var url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
			+ '?appid=%s&secret=%s&code=%s&grant_type=authorization_code';
	url = util.format(url, req.body.appId, req.body.secret, req.body.code);
//	console.log('wx', req.body, url);
	httpGetJson(url, function(a) {
		if (a.errcode) {
			res.json(a);
			return;
		}
		url = 'https://api.weixin.qq.com/sns/userinfo?access_token=%s'
				+ '&openid=%s&lang=zh_CN';
		url = util.format(url, a.access_token, a.openid);
		httpGetJson(url, function(u) {
			res.json(u);
		}, function(e) {
//			console.log('error wx 2', e);
			res.send("error weixin step 2: " + json2s(e));
		});
	}, function(e) {
//		console.log('error wx 1', e);
		res.send("error weixin step 1: " + json2s(e));
	});
});

var server = app.listen(3600, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Service listening at http://%s:%s', host, port);
});