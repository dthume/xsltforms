dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

(function() {

	function createKey(node, meta) {
		return "xsltforms_"+(node.localName ? node.localName : node.baseName)+"_"+meta;
	}
	
	dojo.declare("xsltforms.View", xsltforms.XFAbstractObject, {
		constructor: function(args) {
			
		},
		getMeta: function(node, meta) {
			var key = createKey(node, meta);
			return node.nodeType == NodeType.ELEMENT ?
					node.getAttribute("xsltforms_"+meta)
					: node.ownerElement ?
							node.ownerElement.getAttribute(key)
							: node.selectSingleNode("..").getAttribute(key);	
		},

		getBoolMeta: function(node, meta) {
			var key = createKey(node, meta);
			var result = false;
			if (node.nodeType == NodeType.ELEMENT) {
				result = node.getAttribute("xsltforms_"+meta);
			} else if (node.nodeType == NodeType.ATTRIBUTE) {
				result = node.ownerElement ?
						node.ownerElement.getAttribute(key)
						: node.selectSingleNode("..").getAttribute(key);
			}
			return Boolean(result);
		},

		setMeta: function(node, meta, value) {
			if (node) {
				var key = createKey(node, meta);
				if (node.nodeType == NodeType.ELEMENT) {
						node.setAttribute("xsltforms_"+meta, value);
				} else if (node.ownerElement) {
					node.ownerElement.setAttribute(key, value);
				} else {
					node.selectSingleNode("..").setAttribute(key, value);
				}
			}
		},

	setBoolMeta: function(node, meta, value) {
		var key = createKey(node, meta);
	    if (node) {
	    	if (value) {
	    		if (node.nodeType == NodeType.ELEMENT) {
		    		node.setAttribute("xsltforms_"+meta, value);
	    		} else if (node.ownerElement) {
	    			node.ownerElement.setAttribute(key, value);
	    		} else {
	    			node.selectSingleNode("..").setAttribute(key, value);
	    		}
	    	} else {
	    		if (node.nodeType == NodeType.ELEMENT) {
		    		node.removeAttribute("xsltforms_"+meta);
	    		} else if (node.ownerElement) {
	    			node.ownerElement.removeAttribute(key);
	    		} else {
	    			node.selectSingleNode("..").removeAttribute(key);
	    		}
	    	}
	    }
	},

	setTrueBoolMeta: function(node, meta) {
	    if (node) {
	    	var key = createKey(node, meta);
	    	if (node.nodeType == NodeType.ELEMENT) {
	    		node.setAttribute("xsltforms_"+meta, true);
	    	} else if (node.ownerElement) {
	    		node.ownerElement.setAttribute(key, true);
	    	} else {
	    		node.selectSingleNode("..").setAttribute(key, true);
	    	}
	    }
	},

	setFalseBoolMeta: function(node, meta) {
	    if (node) {
	    	var key =  createKey(node, meta);
	    	if (node.nodeType == NodeType.ELEMENT) {
	    		node.removeAttribute("xsltforms_"+meta);
	    	} else if (node.ownerElement) {
	    		node.ownerElement.removeAttribute(key);
	    	} else {
	    		node.selectSingleNode("..").removeAttribute(key);
	    	}
	    }
	}

	});
})();

dojo.provide("xsltforms.View");