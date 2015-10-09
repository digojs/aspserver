

var FS = require('fs');
var Path = require('path');

exports.processRequest = function(context){

	FS.readFile(context.request.physicalPath, context.applicationInstance.fileEncoding, function(e, data){
		if (e) {
			context.reportError(500, e);
			return;
		}

		context.response.contentEncoding = context.applicationInstance.contentEncoding;
		context.response.contentType = 'text/html; charset=' + context.response.contentEncoding;
		
		var vmContext = initContext(context);
		
		var VM = require('vm');
		
		try{
			VM.runInNewContext(data, vmContext, context.request.physicalPath);
				
			if(!context.response.async){
				context.response.end();
			}
			
		} catch(e) {
			context.reportError(500, e);
			return;
		}
		
	});
	
};

function initContext(context){
    return {

        __proto__: require('../lib/index.js'),
		
		request: context.request,
		
		response: context.response,

		application: context.application,
		
		applicationInstance: context.applicationInstance,
		
		require: function (module) {
			if(module.indexOf('.') !== -1){
				module = Path.resolve(Path.dirname(context.request.physicalPath), module);
			}
			
			return require.call(this, module);
		},
		
		context: context,

		console: console,

		setTimeout: setTimeout,

		setInterval: setInterval,

		process: process,

		__filename: context.request.physicalPath,

		__dirname: Path.dirname(context.request.physicalPath)
		
	};
	
}
