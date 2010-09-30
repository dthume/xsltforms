dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

dojo.provide("xsltforms.Binding");

(function() {

	dojo.declare("xsltforms.Binding", xsltforms.XFAbstractObject, {
		constructor: function(args) {
		var XPath = this.xform.getXPath();
			this.isvalue = args.isvalue;
			this.bind = args.bind ? args.bind : null;
			this.xpath = args.xpath ? XPath.get(args.xpath) : null;
			var modelelt = args.model;
			if( typeof args.model == "string" ) {
				modelelt = this.xform.getElementById(args.model);
			}
			this.model = args.model ?
				(modelelt != null ? modelelt.xfElement : args.model) : null;
		},

		evaluate: function(ctx, depsNodes, depsId, depsElements) {
			var result = null;
			if (this.bind) {
				if (typeof this.bind == "string") {
					var idel = this.xform.getElementById(this.bind);
					if (!idel) {
						return null;	// A 'null' signifies bind-ID not found.
					}
					this.bind = idel.xfElement;
				}
				result = this.bind.nodes;
				copyArray(this.bind.depsNodes, depsNodes);
				copyArray(this.bind.depsElements, depsElements);
				
			} else {
				var ExprContext = this.xform.getXPath().ExprContext;
				var exprCtx = new ExprContext(!ctx || (this.model && this.model != this.xform.getElementById(Core.getMeta(ctx.ownerDocument.documentElement, "model")).xfElement) ? this.model ? this.model.getInstanceDocument().documentElement : this.xform.defaultModel.getInstanceDocument(): ctx,
						null, null, null, null, ctx, depsNodes, depsId, depsElements);
				result = this.xpath.evaluate(exprCtx);
			}
			return this.isvalue ? stringValue(result) : result;
		}
	});
})();
