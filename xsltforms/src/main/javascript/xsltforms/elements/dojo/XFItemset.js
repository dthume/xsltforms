dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFElement");

(function() {
    dojo.declare(
	"xsltforms.elements.dojo.XFItemset",
	xsltforms.elements.dojo.XFElement,
	{
	    constructor: function(args) {
	        this.init(args.id);
	        this.nodesetBinding = args.nodesetBinding;
	        this.labelBinding = args.labelBinding;
	        this.valueBinding = args.valueBinding;
	        this.copyBinding = args.copyBinding;
	        this.hasBinding = true;
	    },

	    build_: function(ctx) {
	        if (this.element.getAttribute("cloned")) { return; }
	        this.nodes = this.evaluateBinding(this.nodesetBinding, ctx);
	        var next = this.element;
	        var parentNode = next.parentNode;
	        var length = this.nodes.length;
	        var oldNode = next;
	        var listeners = next.listeners;
	        
	        for (var cont = 1; true;) {
	            next = next.nextSibling;
	            if (next && next.getAttribute("cloned")) {
	                if (cont >= length) {
	                    next.listeners = null;
	                    parentNode.removeChild(next);
	                    next = oldNode;
	                } else {
	                    next.node = this.nodes[cont];
	                    this.refresh_(next, cont++);
	                    oldNode = next;
	                }
	            } else {
	                for (var i = cont; i < length; i++) {
	                    var node = this.element.cloneNode(true);
	                    node.setAttribute("cloned", "true");
	                    this.xform.getIdManager().cloneId(node);
	                    node.node = this.nodes[i];
	                    parentNode.appendChild(node);
	                    this.refresh_(node, i);
			    
	                    if (listeners && !Core.isIE) {
	                        for (var j = 0, len = listeners.length; j < len; j++) {
	                            listeners[j].clone(node);
	                        }
	                    }
	                }
			
	                break;
	            }
	        }
	        
	        if (length > 0) {
	            this.element.node = this.nodes[0];
	            this.refresh_(this.element, 0);
	        } else {
	            this.element.value = "\xA0";
	            this.element.text = "\xA0";
	        }
	    },
	        
	    refresh: function() {
	        var parent = this.element.parentNode;
	        var i;
	        for (i = 0; parent.childNodes[i] != this.element; i++);
	        for (var j = 0, len = this.nodes.length; j < len || j == 0; j++) {
	            Core.setClass(parent.childNodes[i+j], "xforms-disabled",
	                    this.nodes.length === 0);
	        }
	    },

	    clone: function(id) {
	        return new xsltforms.elements.dojo.XFItemset({
	            xform: this.xform,
	            id: id,
	            nodesetBinding: this.nodesetBinding,
	            labelBinding: this.labelBinding,
	            valueBinding: this.valueBinding
	        });
	    },

	    refresh_: function(element, cont) {
	        var ctx = this.nodes[cont];
	        var nodeLabel = this.evaluateBinding(this.labelBinding, ctx)[0];
	        var nodeValue = this.evaluateBinding(this.valueBinding, ctx)[0];
	        
	        if (nodeLabel) {
	            this.depsNodesRefresh.push(nodeLabel);
	            try {
	                element.text = this.xform.getValue(nodeLabel, true);
	            } catch(e) { }
	        }

	        if (nodeValue) {
	            this.depsNodesRefresh.push(nodeValue);
	            try {
	                element.value = this.xform.getValue(nodeValue);
	            } catch(e2) { }
	        }
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFItemset");