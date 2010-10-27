dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFElement");

(function() {
    dojo.declare(
	"xsltforms.elements.dojo.XFLabel",
	xsltforms.elements.dojo.XFElement,
	{
	    isXFLabel: true,
	    
	    constructor: function(args) {
		    this.init(args.id);
		
		    if (args.binding) {
		        this.hasBinding = true;
		        this.binding = args.binding;
		    }
	    },

	    clone: function(id) { 
	        return new xsltforms.elements.dojo.XFLabel({
	            xform: this.xform,
	            id: id,
	            binding: this.binding
	        });
	    },

	    build_: function(ctx) {
	        var nodes = this.evaluateBinding(this.binding, ctx);
	        this.element.node = nodes[0];
	        this.depsNodesRefresh.push(nodes[0]);
	    },

	    refresh: function() {
	        var node = this.element.node;
	        var value = node? this.xform.getValue(node, true) : "";
	        this.xform.setValue(this.element, value);
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFLabel");