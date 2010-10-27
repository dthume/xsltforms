dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFCoreElement");

(function() {
    
    var depsId = 0;

    dojo.declare(
	"xsltforms.elements.dojo.XFBind",
	xsltforms.elements.dojo.XFCoreElement,
	{
	    constructor: function(args) {
		    var XPath = this.xform.getXPath();
		    this.init(args.id, args.parent, "xforms-bind");
		    this.model = args.parent.model || args.parent;
		    this.type = args.type ?
		            this.xform.getSchemaManager().getType(args.type) : null;
		    this.nodeset = args.nodeset;
		    this.readonly = XPath.get(args.readonly);
		    this.required = XPath.get(args.required);
		    this.relevant = XPath.get(args.relevant);
		    this.calculate = XPath.get(args.calculate);
		    this.constraint = XPath.get(args.constraint);
		    this.depsNodes = [];
		    this.depsElements = [];
		    this.nodes = [];
		    this.binding = new this.xform.Binding({
		        isvalue: false,
		        xpath: this.nodeset
		    });
		    args.parent.addBind(this);
		    this.depsId = depsId++;
	    },
	    
	    addBind: function() {},

	    refresh: function(ctx, index) {
		if (!index) {
		    for (var i = 0, len = this.depsNodes.length; i < len; i++) {
			Core.setFalseBoolMeta(this.depsNodes[i], "depfor_"+this.depsId);
		    }
		    this.depsNodes.length = 0;
		    this.depsElements.length = 0;
		    this.nodes.length = 0;
		}

		ctx = ctx || (this.model ? this.model.getInstanceDocument() ? this.model.getInstanceDocument().documentElement : null : null);
		copyArray(this.binding.evaluate(ctx, this.depsNodes, this.depsId, this.depsElements), this.nodes);
		var el = this.element;

		for (var i = 0, len = this.nodes.length; i < len; i++) {
		    var node = this.nodes[i];
		    var bindid = Core.getMeta(node, "bind");
		    if (bindid && this.element.id != bindid) {
			XFProcessor.error(el, "xforms-binding-exception", "Two binds affect one node");
		    } else {
			Core.setMeta(node, "bind", this.element.id);

			if (this.type) {
			    if (Core.getMeta(node, "schemaType")) {
				XFProcessor.error(el, "xforms-binding-exception", "Type especified in xsi:type attribute");
			    } else {
				var name = this.type.name;
				var ns = this.type.nsuri;
				var Schema = this.xform.getSchemaManager();
				for (var key in Schema.prefixes) {
				    if (Schema.prefixes[key] == ns) {
					name = key + ":" + name;
					break;
				    }
				}
				Core.setMeta(node, "type", name);
			    }
			}
		    }

		    for (var j = 0, len1 = el.childNodes.length; j < len1; j++) {
			el.childNodes[j].xfElement.refresh(node, i);
		    }
		}
	    },

	    recalculate: function() {
		var el = this.element;

		if (this.calculate) {
		    for (var i = 0, len = this.nodes.length; i < len; i++) {
			var node = this.nodes[i];
			var ExprContext = this.xform.getXPath().ExprContext; 
			var ctx = new ExprContext(node, i + 1, this.nodes);
			var value = stringValue(this.calculate.evaluate(ctx));
			var Schema = this.xform.getSchemaManager()
			value = Schema.getType(Core.getMeta(node, "type") || "xsd_:string").normalize(value);
			this.xform.setValue(node, value);
			this.model.addChange(node);
			DebugConsole.write("Calculate " + node.nodeName + " " + value);
		    }
		}

		for (var j = 0, len1 = el.childNodes.length; j < len1; j++) {
		    el.childNodes[j].xfElement.recalculate();
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFBind");