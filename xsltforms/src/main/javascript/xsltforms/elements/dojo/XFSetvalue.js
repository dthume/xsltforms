dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
            "xsltforms.elements.dojo.XFSetvalue",
            xsltforms.elements.dojo.XFAbstractAction,
	{
	    constructor: function(args) {
		    var XPath = this.xform.getXPath();
		    this.binding = args.binding;
		    this.value = args.value? XPath.get(args.value) : null;
		    this.literal = args.literal;
		    this.init(args.ifexpr, args.whileexpr);
	    },

	    run: function(element, ctx) {
	        var node = this.binding.evaluate(ctx)[0];

	        if (node) {
	            var value = this.value? stringValue(this.value.evaluate(node))
	                    : this.literal;
	            this.xform.openAction();
	            this.xform.setValue(node, value || "");
	            this.xform.getElementById(Core.getMeta(node.ownerDocument.documentElement, "model")).xfElement.addChange(node);
	            DebugConsole.write("Setvalue " + node.nodeName + " = " + value); 
	            this.xform.closeAction();
	        }
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFSetvalue");