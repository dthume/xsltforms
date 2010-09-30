dojo.provide("xsltforms.io");

(function() {
	
	var xhr = xsltforms.io.xhr = {};
	
	xhr.xhrGet = dojo.xhrGet;
	xhr.xhrPost = dojo.xhrPost;
	xhr.xhrPut = dojo.xhrPut;
	xhr.xhrDelete = dojo.xhrDelete;
	
	var METHOD_MAP = {
	        "GET": xhr.xhrGet,
	        "POST": xhr.xhrPost,
	        "PUT": xhr.xhrPut,
	        "DELETE": xhr.xhrDelete,
	        "FORM-DATA-POST": xhr.xhrPost,
	        "URLENCODED-POST": xhr.xhrPost
	};
	
	xhr.forMethod = function(method) {
	    return METHOD_MAP[method.toUpperCase()];
	};
	
	
})();