dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFElement");

(function() {

    dojo.declare(
	"xsltforms.elements.dojo.XFGroup",
	xsltforms.elements.dojo.XFElement,
	{
	    constructor: function(args) {
		this.init(args.id);
		
		if (args.binding) {
		    this.hasBinding = true;
		    this.binding = args.binding;
		} else {
		    Core.setClass(this.element, "xforms-disabled", false);
		}
	    },

	    clone: function(id) { 
		return new xsltforms.elements.dojo.XFGroup({
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
		var element = this.element;
		var disabled = !element.node || Core.getBoolMeta(element.node, "notrelevant");
		Core.setClass(element, "xforms-disabled", disabled);

		/** Tabs */
		var ul = element.parentNode.firstChild;
		
		if (ul.nodeName.toLowerCase() == "ul") {
		    var childs = element.parentNode.childNodes;
		    var tab;

		    for (var i = 1, len = childs.length; i < len; i++) {
			if (childs[i] == element) {
			    tab = ul.childNodes[i - 1];
			}
		    }

		    Core.setClass(tab, "xforms-disabled", disabled);
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFGroup");