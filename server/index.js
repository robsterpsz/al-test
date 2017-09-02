!function(e){function t(r){if(n[r])return n[r].exports;var a=n[r]={i:r,l:!1,exports:{}};return e[r].call(a.exports,a,a.exports,t),a.l=!0,a.exports}var n={};t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="/",t(t.s=6)}([function(e,t){e.exports=require("babel-runtime/regenerator")},function(e,t){e.exports=require("babel-runtime/helpers/asyncToGenerator")},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.eventEmitter=void 0;var a=n(0),o=r(a),s=n(1),c=r(s),i=n(7),u=r(i),f=n(8),l=r(f),d=n(3),p=n(4),h=n(5),v=n(20);n(24),n(25);var k=t.eventEmitter=new u.default.EventEmitter,m=process.env.PORT||8080;p.server.listen(m),v.sc.init(),new l.default(p.server).on("connection",function(e){v.sc.market.isOpen||(v.sc.market=(0,h.getMarketStatus)(),e.emit("stock:close",v.sc.market)),k.on("stock:close",function(t){e.emit("stock:close",t)}),k.on("stock:add",function(t){e.emit("stock:add",t)}),e.on("stock:add",function(){if(v.sc.lastUpdate){var t={lastUpdate:v.sc.lastUpdate,stocks:v.sc.stocks};e.emit("stock:add",t)}else e.emit("stock:error",{message:"There is no available data at the moment."})}),k.on("stock:error",function(t){e.emit("stock:error",t)}),e.on("stock:init",function(){if(v.sc.lastUpdate){var t={lastUpdate:v.sc.lastUpdate,stockCache:v.sc.stocks,stocks:v.sc.stocks};e.emit("stock:init",t,v.sc.market)}else e.emit("stock:error",{message:"There is no available data at the moment."})}),e.on("stock:feedStart",function(t){(0,c.default)(o.default.mark(function n(){var r,a,s,i,u,f;return o.default.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:if(r=function(){var n=(0,c.default)(o.default.mark(function n(r){var a,s;return o.default.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,(0,d.getRedisHash)(r);case 2:a=n.sent,s={stocks:a},0===a.length?e.emit("stock:error",{message:"There is no available data at the moment."}):e.emit("stock:feedCache",s,t);case 5:case"end":return n.stop()}},n,void 0)}));return function(e){return n.apply(this,arguments)}}(),a=function(){var n=(0,c.default)(o.default.mark(function n(){var r;return o.default.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=3,v.sc.getStockPreCache(t);case 3:r=n.sent,0===r.length?e.emit("stock:error",{message:"There is no more available data at the moment."}):e.emit("stock:feedEnd",r,t);case 5:case"end":return n.stop()}},n,void 0)}));return function(){return n.apply(this,arguments)}}(),n.prev=2,s=null,t.lastUpdate){n.next=8;break}return n.next=7,v.sc.getStockCacheKeys(t.stockId);case 7:t.next=n.sent;case 8:if(!(s=t.next.shift())){n.next=13;break}r(s),n.next=23;break;case 13:if(!(Math.abs(t.lastUpdate-v.sc.lastUpdate)>=86400)){n.next=22;break}return i="stock:"+t.stockId+":"+t.lastUpdate,n.next=17,v.sc.getStockCacheKeys(t.stockId);case 17:u=n.sent,f=u.reverse()[0],i!==f?(t.next=u.slice(u.indexOf(i)+1),s=t.next.shift(),r(s)):a(),n.next=23;break;case 22:a();case 23:n.next=29;break;case 25:n.prev=25,n.t0=n.catch(2),e.emit("stock:error",{message:"This service is not available at the moment."});case 29:case"end":return n.stop()}},n,void 0,[[2,25]])}))()}),e.on("disconnect",function(){})})},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.getRedisHash=t.getRedisKeys=t.scanAsync=t.hgetallAsync=t.redisClient=void 0;var a=n(0),o=r(a),s=n(9),c=r(s),i=n(1),u=r(i),f=n(10),l=r(f),d=n(11),p=r(d),h=n(12),v=r(h);p.default.promisifyAll(v.default.RedisClient.prototype);var k=process.env.REDIS_PORT||6379,m=process.env.REDIS_HOST||"127.0.0.1",g=t.redisClient=v.default.createClient(k,m);g.on("error",function(e){});var x=t.hgetallAsync=function(e){return g.hgetallAsync(e).then(function(e){return e}).catch(function(e){throw e})},C=t.scanAsync=function e(t,n,r){return g.scanAsync(t,"MATCH",n,"COUNT","100").then(function(a){return t=a[0],a[1].forEach(function(e){r.add(e)}),"0"===t?(0,l.default)(r):e(t,n,r)}).catch(function(e){throw e})};t.getRedisKeys=function(){var e=(0,u.default)(o.default.mark(function e(t){var n,r;return o.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return n=new c.default,e.next=3,C("0",t,n).then(function(e){return e}).catch(function(e){throw e});case 3:return r=e.sent,e.abrupt("return",r);case 5:case"end":return e.stop()}},e,void 0)}));return function(t){return e.apply(this,arguments)}}(),t.getRedisHash=function(){var e=(0,u.default)(o.default.mark(function e(t){var n;return o.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,x(t).then(function(e){return e}).catch(function(e){throw e});case 2:return n=e.sent,e.abrupt("return",n);case 4:case"end":return e.stop()}},e,void 0)}));return function(t){return e.apply(this,arguments)}}()},function(e,t,n){"use strict";(function(e){function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.get=t.server=void 0;var a=n(13),o=r(a),s=n(14),c=r(s),i=n(15),u=r(i),f=n(16),l=r(f);t.server=u.default.createServer(function(e,t){var n="/"==e.url?"/index.html":e.url,r=l.default.extname(n),a="public",o={".css":"text/css",".gif":"image/gif",".html":"text/html",".ico":"image/x-icon",".jpg":"image/jpeg",".js":"application/javascript",".png":"image/png",".svg":"image/svg+xml",".txt":"text/plain",".woff":"application/font-woff",".woff2":"application/font-woff2"},s=function(e,t,n){c.default.readFile(e,function(e,r){e?(t.writeHead(500),t.end()):(t.setHeader("Content-Length",r.length),void 0!=n&&t.setHeader("Content-Type",n),t.statusCode=200,t.end(r))})},i=!0,u=o[r];i=void 0!=o[r],i?(a+=n,c.default.exists(a,function(e){e?s(a,t,u):(t.setHeader("Location","/"),s("public/index.html",t,"text/html"))})):(t.setHeader("Location","/"),s("public/index.html",t,"text/html"))}),t.get=function(e){return new o.default(function(t,n){u.default.get(e,function(e){var r=e.statusCode,a=void 0;200!==r&&(a=new Error("Request Failed.\nStatus Code: "+r)),a&&(e.resume(),n(a.message));var o="";e.setEncoding("utf8"),e.on("data",function(e){o+=e}),e.on("end",function(){try{var e=o.replace(/\/\/\s/,""),r=JSON.parse(e);t(r)}catch(e){n(e)}})}).on("error",function(e){n(e.message)})})}}).call(t,"/")},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.getMarketStatus=t.getApiTimeZone=t.toMoment=t.toLocal=void 0;var a=n(17),o=r(a),s=n(18),c=r(s),i=n(19),u=r(i),f=t.toLocal=function(e,t){var n=new c.default.Date(e);return n.setTimezone(t),(0,u.default)(n,"%F %T %z",t)},l=t.toMoment=function(e,t){var n=f(e,t);return(0,o.default)(n,"YYYY-MM-DD HH:mm:ss zz")},d=t.getApiTimeZone=function(){return l(new Date,"America/New_York")};t.getMarketStatus=function(){var e=d(),t=e.day(),n=t>0&&t<6;if(n){var r=e.hour();if(n=60*r<959){n=60*r+e.minutes()>569}}return{isOpen:n,time:e.unix()}}},function(e,t,n){e.exports=n(2)},function(e,t){e.exports=require("events")},function(e,t){e.exports=require("socket.io")},function(e,t){e.exports=require("babel-runtime/core-js/set")},function(e,t){e.exports=require("babel-runtime/core-js/array/from")},function(e,t){e.exports=require("bluebird")},function(e,t){e.exports=require("redis")},function(e,t){e.exports=require("babel-runtime/core-js/promise")},function(e,t){e.exports=require("fs")},function(e,t){e.exports=require("http")},function(e,t){e.exports=require("path")},function(e,t){e.exports=require("moment")},function(e,t){e.exports=require("time")},function(e,t){e.exports=require("timezone/loaded")},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.sc=void 0;var a=n(21),o=r(a),s=n(22),c=r(s),i=n(0),u=r(i),f=n(1),l=r(f),d=n(23),p=r(d),h=n(2),v=n(4),k=n(5),m=n(3),g=t.sc={addStockCacheKeys:function(e,t){return g.stockCacheKeys&&g.stockCacheKeys[e]?g.stockCacheKeys[e].push(t):g.stockCacheKeys[e]=[t],g.lastStockCacheKey=t},errorSimulation:function(){if(Math.random(0,1)<.1)throw new Error("How unfortunate! The API Request Failed")},getStockCacheKeys:function(e){var t=this;return(0,l.default)(u.default.mark(function n(){var r,a,o;return u.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:if(r=g.stockCacheKeys&&g.stockCacheKeys[e]&&g.stockCacheKeys[e].length>0,a=null,r){t.next=10;break}return t.next=5,(0,m.getRedisKeys)("stock:"+e+":*");case 5:o=t.sent,g.stockCacheKeys[e]=o.sort(),a=g.stockCacheKeys[e],t.next=11;break;case 10:a=g.stockCacheKeys[e];case 11:return t.abrupt("return",a);case 12:case"end":return t.stop()}},n,t)}))()},getStockPreCache:function(e){return g.preCache[e.stockId].filter(function(t){return parseInt(t[0],10)>e.lastUpdate})},init:function(){var e=(0,l.default)(u.default.mark(function e(){var t;return u.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return m.redisClient.hgetall("__STOCK_CONTROL__",function(e,t){if(e)throw new Error("Redis service error:",e);t&&(g.dupeControl=t.dupeControl,g.lastUpdate=parseInt(t.lastUpdate,10),g.stocks=JSON.parse(t.stocks))}),e.next=3,g.getStockCacheKeys("*");case 3:return t=e.sent,t.forEach(function(e){var t=e.split(":")[1];g.preCache[t]=[]}),e.abrupt("return",x());case 6:case"end":return e.stop()}},e,void 0)}));return function(){return e.apply(this,arguments)}}(),refreshStockInterval:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:6e4,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:x;clearInterval(this.stockInterval),this.stockInterval=setInterval(t,e)},apiIsWorking:!1,dupeControl:null,lastStockCacheKey:null,lastUpdate:null,market:{},preCache:{},stockCacheKeys:{},stockInterval:null,stocks:{}},x=function(){var e=(0,l.default)(u.default.mark(function e(){var t,n,r,a,s,i,f,l,d,x=arguments.length>0&&void 0!==arguments[0]?arguments[0]:["AAPL","ABC","MSFT","TSLA","F"];return u.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return g.market=(0,k.getMarketStatus)(),!g.market.isOpen&&g.apiIsWorking?(g.apiIsWorking=!1,h.eventEmitter.emit("stock:close",g.market)):g.market.isOpen&&!g.apiIsWorking&&(g.apiIsWorking=!0,g.refreshStockInterval()),e.prev=2,g.errorSimulation(),t="http://finance.google.com/finance/info?client=ig&q="+x.join(","),e.next=7,(0,v.get)(t);case 7:return n=e.sent,r=(0,p.default)((0,c.default)(n)),g.dupeControl!==r&&(g.dupeControl=r,a=!1,s=new Date,g.lastUpdate&&(i=new Date(1e3*g.lastUpdate),a=i.getDate()!==s.getDate()),f=Math.floor(s/1e3),l=f.toString(),n.forEach(function(e){var t="stock:"+e.id;if(a){g.preCache[e.id]=[];var n="stock:"+e.id+":"+g.lastUpdate;g.addStockCacheKeys(e.id,n),m.redisClient.rename(t,n)}var r=(0,o.default)(e).map(function(t){return"id"===t?l:e[t]});m.redisClient.hset(t,l,(0,c.default)(r)),g.stocks[e.id]=[r],g.preCache&&g.preCache[e.id]?g.preCache[e.id].push(r):g.preCache[e.id]=[r]}),m.redisClient.hset("__STOCK_CONTROL__",["dupeControl",r,"lastUpdate",l,"stocks",(0,c.default)(g.stocks)]),g.lastUpdate=f,h.eventEmitter.emit("stock:add",{lastUpdate:f,stocks:g.stocks})),e.abrupt("return",!0);case 13:e.prev=13,e.t0=e.catch(2),/unfortunate/.test(e.t0)?(g.apiIsWorking=!g.market.isOpen,d=30,g.refreshStockInterval(1e3*d),h.eventEmitter.emit("stock:error",{active:!0,message:"API request error simulation: retrying in "+d+" seconds.",value:d})):h.eventEmitter.emit("stock:error",{message:"API connection unavailable."});case 16:case"end":return e.stop()}},e,void 0,[[2,13]])}));return function(){return e.apply(this,arguments)}}()},function(e,t){e.exports=require("babel-runtime/core-js/object/keys")},function(e,t){e.exports=require("babel-runtime/core-js/json/stringify")},function(e,t){e.exports=require("md5")},function(e,t){e.exports=require("babel-core/register")},function(e,t){e.exports=require("babel-polyfill")}]);