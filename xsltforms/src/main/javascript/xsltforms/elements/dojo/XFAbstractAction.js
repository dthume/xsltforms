dojo.provide("xsltforms.elements.dojo.XFAbstractAction");

dojo.require("xsltforms.XFAbstractObject");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFAbstractAction",
	xsltforms.XFAbstractObject,
	{
	    init: function(ifexpr, whileexpr) {
		var XPath = this.xform.getXPath();
		this.ifexpr = XPath.get(ifexpr);
		this.whileexpr = XPath.get(whileexpr);
	    },

	    execute: function(element, ctx, evt) {
		if (evt.stopped) { return; }
		
		if (!ctx) {
		    ctx = element.node || (this.xform.defaultModel.getInstanceDocument() ? this.xform.defaultModel.getInstanceDocument().documentElement : null);
		}

		if (this.whileexpr) {
		    while(booleanValue(this.whileexpr.evaluate(ctx))) {
			if(!this.exec_(element, ctx, evt)) {
			    break;
			}
		    }
		} else {
		    this.exec_(element, ctx, evt);
		}
	    },

	    exec_: function(element, ctx, evt) {
		if (this.ifexpr) {
		    if (booleanValue(this.ifexpr.evaluate(ctx))) {
			this.run(element, ctx, evt);
		    } else {
			return false;
		    }
		} else {
		    this.run(element, ctx, evt);
		}
		return true;
	    },

	    run: function(element, ctx, evt) { }
	});

})();
