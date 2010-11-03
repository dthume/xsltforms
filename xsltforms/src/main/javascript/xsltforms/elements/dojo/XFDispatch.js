dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFDispatch",
	xsltforms.elements.dojo.XFAbstractAction,
	{
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
		
	        // HACK: why do we have to do this now? is target subtly different
	        // from xsltforms trunk?
	        if (target.element) target = target.element;
		
	        var delay = 0;
	        if (this.delay) {
	            if (this.delay.evaluate) {
	                delay = numberValue(this.delay.evaluate());
	            } else {
	                delay = numberValue(this.delay);
	            }
	        }
	        if (delay > 0 ) {
	            var self = this;
	            var fn = function() {
	                var xform = self.xform;
	                xform.dispatch(xform.getElementById(target.id), self.name);
	            };
	            window.setTimeout(fn, delay);
	        } else {
	            this.xform.dispatch(target, this.name);
	        }
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFDispatch");