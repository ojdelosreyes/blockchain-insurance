/**
 * Created by dcotton on 04/11/2016.
 */
var authEndpoint = process.env.JWT_AUTH_ENDPOINT || "https://aston-jwt-auth.eu-gb.mybluemix.net/app/";

var request = require('request');

var config =  require('config');

module.exports = {
  signJWT: function (data, options, callback) {
    var requestData = {};
    requestData.token = data;
    requestData.secret = options.secret;

    request({
      url: authEndpoint+options.name+"/token/sign",
      method: "POST",
      json: requestData
    }, function (error, response, body) {
      if(!error && response && response.statusCode == 200 && body && body.token){
        callback(body.token);
      }
      else{
        callback(false);
      }
    });
  },
  verifyJWT: function (data, options, callback) {
    var requestData = {};
    requestData.token = data;
    requestData.secret = options.secret;
    request({
      url: authEndpoint+options.name+"/token/verify",
      method: "POST",
      json: requestData
    }, function (error, response, body) {
      if(!error && response && response.statusCode == 200 && body && body.username){
      }
      else{
        callback(false);
      }
    });
  },
  middleware: function (req, response, next) {
    var header = "";
    if (req.method.toUpperCase() === "OPTIONS") return next();
    var authorization = req.get("Authorization") || "";
    var parts = authorization.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") header = parts[1];
    if (!header || !req.params || !req.params.username) {
      return response.status(401).json({reason: "Authentication required"});
    }
    var auth = config.web.auth;
    auth.secret = process.env.JWT_SECRET;
    auth.name = req.params.username;
    if (!auth.secret || auth.secret.length < 32) {
      return response.status(500).json({reason: "Authentication is not configured securely"});
    }
    module.exports.verifyJWT(header, auth, function(ok) {
      if (ok) { req.user = ok; return next(); }
      return response.status(401).json({reason: "Unauthorized"});
    });
  },
  checkAuthorized: function (req, response, next) {
    if (req.method.toUpperCase() === "OPTIONS") return next();
    if (req.user && req.params && req.params.username && req.user === req.params.username) {
      next();
    } else {
      response.setHeader('Content-Type', 'application/json');
      response.statusCode = 403;
      response.write(JSON.stringify({reason: "You are not authorized to access that resource"}));
      response.end();
      return;
    }
  },
  allowOriginsMiddleware: function(req, res, next) {
    var allowedOrigins = config.allowedOrigins;
    var origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Token');

    if(allowedOrigins.indexOf(origin) > -1){
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    return next();
  }
};
