dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {

	dojo.declare(
		"xsltforms.elements.dojo.XFAction",
		xsltforms.elements.dojo.XFAbstractAction, {
			constructor : function(args) {
				this.init(args.ifexpr, args.whileexpr);
				this.childs = [];
			},
			add : function(action) {
				this.childs.push(action);
				return this;
			},

			run : function(element, ctx, evt) {
				forEach(this.childs, "execute", element, ctx, evt);
			}
		});
})();

dojo.provide("xsltforms.elements.dojo.XFAction");