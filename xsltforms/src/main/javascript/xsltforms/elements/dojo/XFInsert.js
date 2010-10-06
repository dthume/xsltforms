dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFInsert",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    constructor: function(args) {
		this.binding = new this.xform.Binding({
		    isvalue: false,
		    xpath: args.nodeset,
		    model: args.model,
		    bind: args.bind
		});
		var XPath = this.xform.getXPath();
		this.origin = XPath.get(args.origin);
		this.context = XPath.get(args.context);
		this.at = XPath.get(args.at);
		this.position = args.position;
		this.init(args.ifexpr, args.whileexpr);
	    },

	    run: function(element, ctx) {
		if (this.context) {
		    ctx = this.context.evaluate(ctx)[0];
		}
		
		if (!ctx) { return; }

		var nodes = [];
		if( this.binding.bind || this.binding.xpath ) {
		    nodes = this.binding.evaluate(ctx);
		}
		var index = 0;
		var node = null;
		var originNodes = [];
		var parent = null;
		var pos = this.position == "after"? 1 : 0;
		var res = 0;

		if (this.origin) {
		    originNodes = this.origin.evaluate(ctx);
		}

		if (originNodes.length === 0) {
		    if (nodes.length === 0) {
			return;
		    }
		    
		    originNodes.push(nodes[nodes.length - 1]);
		}

		for(var i = 0, len = originNodes.length; i < len; i += 1) {
		    node = originNodes[i];

		    if (nodes.length === 0) {
			parent = ctx;
		    } else {
			parent = nodes[0].nodeType == NodeType.DOCUMENT? nodes[0] : nodes[0].parentNode;
			
			if (parent.nodeType != NodeType.DOCUMENT && node.nodeType != NodeType.ATTRIBUTE) {
				var ExprContext = this.xform.getXPath().ExprContext;
			    res = this.at? Math.round(numberValue(this.at.evaluate(new ExprContext(ctx, 1, nodes)))) - 1: nodes.length - 1;
			    index = isNaN(res)? nodes.length : res + pos;
			}
		    }

		    DebugConsole.write("insert " + node.nodeName + " in " + parent.nodeName
				       + " at " + index + " - " + ctx.nodeName);
		    
		    if (node.nodeType == NodeType.ATTRIBUTE) {
			parent.setAttributeNS(node.namespaceURI, node.prefix, node.nodeName, node.nodeValue);
		    } else {
			var clone = node.cloneNode(true);

			if (parent.nodeType == NodeType.DOCUMENT) {
			    var first = parent.firstChild;
			    parent.removeChild(first);
			    this.xform.getXPath().XNode.recycle(first);
			    parent.appendChild(clone);
			} else {
			    var nodeAfter;

			    if (index >= nodes.length && nodes.length != 0) {
				nodeAfter = nodes[nodes.length - 1].nextSibling;
			    } else {
				nodeAfter = nodes[index];
			    }
			    if (nodeAfter) {
				nodeAfter.parentNode.insertBefore(clone, nodeAfter);
			    } else {
				parent.appendChild(clone);
			    }

			    var repeat = nodes.length > 0? Core.getMeta(nodes[0], "repeat") : null;

			    if (repeat) {
				this.xform.getElementById(repeat).xfElement.insertNode(clone, nodeAfter);
			    }
			}
		    }
		}

		var model = this.xform.getElementById(Core.getMeta(parent.documentElement ? parent.documentElement : parent.ownerDocument.documentElement, "model")).xfElement;
		this.xform.addChange(model);
		model.setRebuilded(true);
		this.xform.dispatch(model.findInstance(parent), "xforms-insert");
	    }

	});
})();

dojo.provide("xsltforms.elements.dojo.XFInsert");