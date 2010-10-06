dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFDispatch",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    //	    function XFDispatch(name, target, ifexpr, whileexpr, delay) {
	    constructor: function(args) {
		this.name = args.name;
		this.target = args.target;
		this.init(args.ifexpr, args.whileexpr);
		this.delay = args.delay;
	    },

	    run: function(element, ctx, evt) {
		var target;
		if (this.target == null) {
		    switch (this.name) {
		    case "xforms-submit":
			target =
			    this.xform.getElementById(Core.getMeta(ctx.ownerDocument.documentElement, "model")).xfElement.defaultSubmission;
			break;
		    case "xforms-reset":
			target =
			    this.xform.getElementById(Core.getMeta(ctx.ownerDocument.documentElement, "model")).xfElement;
			break;
		    }
		} else {
		    target = typeof this.target == "string" ?
			this.xform.getElementById(this.target) : this.target;
		}
		var delay = 0;
		if (this.delay) {
		    if (this.delay.evaluate) {
			delay = numberValue(this.delay.evaluate());
		    } else {
			delay = numberValue(this.delay);
		    }
		}
		if (delay > 0 ) {
		    window.setTimeout("this.xform.dispatch(document.getElementById('"+target.id+"'),'"+this.name+"')", delay);
		} else {
		    this.xform.dispatch(target, this.name);
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFDispatch");