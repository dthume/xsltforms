dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFDelete",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    //function XFDelete(nodeset, model, bind, at, context, ifexpr, whileexpr) {
	    constructor: function(args) {
		this.binding = new this.xform.Binding({
		    isvalue: false,
		    xpath: args.nodeset,
		    model: args.model,
		    bind: args.bind
		});
		var XPath = this.xform.getXPath();
		this.at = XPath.get(args.at);
		this.context = XPath.get(args.context);
		this.init(args.ifexpr, args.whileexpr);
	    },

	    run: function(element, ctx) {
		if (this.context) {
		    ctx = this.context.evaluate(ctx)[0];
		}
		
		if (!ctx) { return; }

		var nodes = this.binding.evaluate(ctx);
		
		if(this.at) {
			var ExprContext = this.xform.getXPath().ExprContext;
		    var index = numberValue(this.at.evaluate(new ExprContext(ctx, 1, nodes)));
		    if(!nodes[index - 1]) { return; }
		    nodes = [nodes[index - 1]];
		}

		var model;
		var instance;
		if( nodes.length > 0 ) {
		    model = this.xform.getElementById(Core.getMeta(nodes[0].documentElement ? nodes[0].documentElement : nodes[0].ownerDocument.documentElement, "model")).xfElement;
		    instance = model.findInstance(nodes[0]);
		}

		for(var i = 0, len = nodes.length; i < len; i++) {
		    var node = nodes[i];

		    if (node.nodeType == NodeType.ATTRIBUTE) {
			node.parentNode.removeAttributeNS(node.namespaceURI, node.nodeName);
		    } else {
			node.parentNode.removeChild(node);
		    }
		    
		    var repeat = Core.getMeta(node, "repeat");

		    if (repeat) {
			this.xform.getElementById(repeat).xfElement.deleteNode(node);
		    }
		}

		if( nodes.length > 0 ) {
			this.xform.addChange(model);
		    model.setRebuilded(true);
		    this.xform.dispatch(instance, "xforms-delete");
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFDelete");