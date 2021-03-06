
exports.processRequest = function (context) {

	switch (context.errorCode) {
		case 404:
			context.response.write('<!doctype><html><head><meta charset="utf-8"><title>404 - Not Found: ' + context.request.path + '</title></head><body><pre>404 - Not Found: ' + context.error.path + '</pre></body></html>');
			break;
		case 403:
		    context.response.write('<!doctype><html><head><meta charset="utf-8"><title>403 - Not Allowed: ' + context.request.path + '</title></head><body><pre>403 - Not Allowed: ' + context.error.path + '</pre></body></html>');
			break;
		default:
		    context.response.write('<!doctype><html><head><meta charset="utf-8"><title>500 - Internal Server Error: ' + context.request.path + '</title></head><body>');
			context.response.write('<pre>500 - Internal Server Error:</pre>');
			context.response.write('<pre>');
			context.response.write(context.error.stack);
			context.response.write('</pre>');
			context.response.write('</body></html>');
			break;
	}
	
	context.response.end();
};
