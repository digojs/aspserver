
var Path = require('path');
var FS = require('fs');
var HttpContext = require('./httpcontext');

/**
 * 表示一个 HTTP 应用程序。
 * @param {Object} configs 应用程序的默认配置。
 */
function HttpApplication(configs) {

	this.headers = {};
	this.modules = {};
	this.handlers = {};
	this.errorPages = {};
	this.virtualPaths = {};
	this.defaultPages = {};

	loadConfigs(require('../configs'), this);
	loadConfigs(configs, this);

}

function loadConfigs(configs, target, deepCount) {
	for (var key in configs) {
		var value = configs[key]; 
		if (typeof target[key] === "object") {
			deepCount = deepCount || 0;
			if (deepCount < 3) {
				loadConfigs(value, target[key], deepCount + 1);
			}
		} else {
			target[key] = value;
		}
	}
}

HttpApplication.prototype = {

    __proto__: require('events').EventEmitter.prototype,

    constructor: HttpApplication,

	// 配置

	/**
	 * 当前应用程序对应的域名。如 www.domain.com。
	 * @type {String}
	 * @remark * 表示任意域名。
	 */ 
	host: "*",

	/**
	 * 当前应用程序对应的 http 地址。
	 * @type {String}
	 * @remark '0.0.0.0' 表示任意地址。
	 */ 
	address: '0.0.0.0',
	
	/**
	 * 当前应用程序对应的端口。
	 * @type {Integer}
	 */ 
	port: 80,
	
	/**
	 * 当前应用程序的真实地址。
	 * @type {String}
	 */
	physicalPath: '.',
	
	/**
	 * 传输编码。
	 * @type {String}
	 */
	headerEncoding: 'utf-8',
	
	/**
	 * 源码编码。
	 * @type {String}
	 */
	contentEncoding: 'utf-8',
	
	/**
	 * 解析文件时的默认编码。
	 * @type {String}
	 */
	fileEncoding: 'utf-8',
	
	/**
	 * 当前应用程序的子虚拟地址。
	 * @type {String}
	 */
	virtualPaths: null,
	
	/**
	 * 支持的请求头信息。
	 * @type {String}
	 */
	headers: null,
	
	/**
	 * 支持的模块信息。
	 * @type {Object}
	 */
	modules: null,
	
	/**
	 * 支持的处理模块。
	 * @type {Object}
	 */
	handlers: null,
	
	/**
	 * 支持的错误页。
	 * @type {Object}
	 */
	errorPages: null,
	
	/**
	 * 支持的主页。
	 * @type {Object}
	 */
	defaultPages: null,
	
	/**
	 * 默认的 Session 过期时间。单位为分钟。
	 * @type {Integer}
	 */
	sessionTimeout: -1,
	
	/**
	 * 存储 Session 的键值。
	 * @type {Integer}
	 */
	sessionKey: 'XFLYSESSION',
	
	/**
	 * 存储 Session 的加密键。
	 * @type {Integer}
	 */
	sessionCryptoKey: 'xfly1',

	// 字段

	/**
	 * 获取当前应用程序在应用程序池的 ID 。
	 * @type {String}
	 */
	get id(){
		// 获取详细信息。
		var address = this.address;
		return (address ? address === 'localhost' ? '127.0.0.1' : address : '0.0.0.0') + ':' + this.port;
	},
	
	/**
	 * 获取当前应用程序的主机名。
	 * @type {String}
	 */
	get hostName(){
		return this.host !== "*" ? this.host + (this.port !== 80 && this.port !== 0 ? ':' + this.port : '')  : '*'
	},
	
	/**
	 * 获取当前应用程序的主页地址。
	 * @type {String}
	 */
	get url(){
		return 'http://' + (this.host !== '*' && this.host ? this.host : this.address && this.address !== '0.0.0.0' ? this.address : 'localhost') + (this.port !== 80 && this.port !== 0 ? ':' + this.port : '') + '/';
	},
	
	/**
	 * 设置当前应用程序的主页地址。
	 * @type {String}
	 */
	set url(value){
		if(!value){
			return;
		}
		value = require('url').parse(value.replace("*", "0.0.0.0"));
		if(value.port != null){
			this.port = value.port;
		}
		if(value.port != null){
			this.port = value.port;
		}
		if(value.hostname != null){
			if(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value.hostname)){
				this.address = value.hostname;
			} else {
				this.host = value.hostname;
			}
		}
	},
	
	/**
	 * 初始化应用程序需要的全部资源。
	 */
	init: function(){
		
		// 将当前地址转为绝对路径。
		this.physicalPath = Path.resolve(__dirname, '../', this.physicalPath);

		this.port = +this.port || 80;

		for(var virtualPath in this.virtualPaths) {
			this.virtualPaths[virtualPath] =  Path.resolve(this.virtualPaths[virtualPath]);
		}

		this.loadModules(this.modules);
		this.loadModules(this.handlers);
		
	},

	/**
	 * 初始化额外加载的其它模块。
	 */
	loadModules: function(moduleList) {
		for (var key in moduleList) {
			var module = moduleList[key];
			switch (typeof module) {
			    case "string":
			        moduleList[key] = module = require(/^\./.test(module) ? Path.resolve(__dirname, "../", module) : module);
					// fall through
				case "object":
					if (module.init) {
						module.init(this);
					}
					if(!module.processRequest) {
						module.processRequest = function() {};
					}
			}
		}
	},
	
	onApplicationStart: function(){
		this.emit("start", this);
	},
	
	onApplicationStop: function(){
		this.emit("stop", this);
	},
	
	onBeginRequest: function(context) { 
		this.emit("beginRequest", context);
	},
	
	onEndRequest: function(context) { 
		this.emit("endRequest", context);
	},
	
	onSessionStart: function(context){
		this.emit("sessionStart", context);
	},
	
	onSessionEnd: function(context){
		this.emit("sessionEnd", context);
	},
	
	reportError: function (context, statusCode, error) {
	    context.errorCode = statusCode;
	    context.error = error;

	    if (!context.response.headersSent) {
	        context.response.statusCode = statusCode;
			context.response.contentType = 'text/html; charst=UTF-8';

	        if (this.errorPages[statusCode]) {
	            return context.response.writeFile(this.errorPages[statusCode]);
	        }
	    }
		
		if(this.handlers.error){
			this.handlers.error.processRequest(context);
		} else {
			var desc = require('./httpworkerrequest').getStatusDescription(statusCode);
			context.response.write(statusCode + ' - ' + desc);
			
			if(error) {
				context.response.write('<pre>');
				context.response.write(error.toString());
				context.response.write('</pre>');
			}
			
			context.response.end();
		}
		
	},
	
	remapHandler: function(context){
	
		var me = this;
		
		// 当前准备输出的文件的物理位置。
		var path = context.request.physicalPath;
	
		// 使用文件方式处理请求。
		FS.stat(path, function(err, stats) {
			
			// 如果文件不存在，则调用错误报告器。
		    if (err) {

		        //// 根据指定的扩展名获取对应的 HttpHandler
		        //var handler = me.handlers[context.request.filePathExtension] || me.handlers["*"];

		        //// 如果存在对应的 Handler，则使用 Handler 继续处理请求。
		        //if (handler) {
		        //    handler.processRequest(context);
		        //} else {
		        //    context.reportError(404, err);
		        //}

		        context.reportError(404, err);
				
			// 如果目标是一个文件。
			} else if(stats.isFile()) {
			
				// 根据指定的扩展名获取对应的 HttpHandler
				var handler = me.handlers[context.request.filePathExtension] || me.handlers["*"];

				// 如果存在对应的 Handler，则使用 Handler 继续处理请求。
				if(handler){
					handler.processRequest(context);
				} else {
					context.reportError(403);
				}
				
			// 如果目标是一个文件夹。
			} else if(stats.isDirectory()) {
				
				// 如果末尾不包含 /, 自动补上。
				if(!(/\/$/).test(context.request.filePath)) {
					context.response.redirect(context.request.filePath + '/', true);
					return;
				}
				
				// 处理主页。
				for(var index in me.defaultPages){
					if(FS.existsSync(path + index)){
						context.rewritePath(context.request.filePath + index);
						return;
					}
				}

				if (me.handlers.directory) {
					me.handlers.directory.processRequest(context);
					return;
				}
				
				context.reportError(403);
			
			// 无权限访问。
			} else {
				context.reportError(403);
			}
			
		});
		
		return true;
		
	},
	
	process: function(httpWorkerRequest){
		var me = this;
		httpWorkerRequest.ready(function (){
			var context = new HttpContext(httpWorkerRequest);
			me.onBeginRequest(context);
			me.processRequest(context);
		});
	},
	
	processRequest: function(context){
	
		var me = this;
		
		// 优先使用各个模块处理请求，如果请求处理完毕，则返回 true 。
		for(var key in me.modules){
			if(me.modules[key] && me.modules[key].processRequest(context) === true){
				return true;
			}
		}
		
		// 然后使用使用各个处理程序处理请求。
		return me.remapHandler(context);
	}

};

module.exports = HttpApplication;