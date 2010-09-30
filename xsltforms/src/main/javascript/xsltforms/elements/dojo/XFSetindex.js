dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFSetindex",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    constructor: function(args) {
			this.repeat = args.repeat;
			var XPath = this.xform.getXPath();
			this.index = XPath.get(args.index);
			this.init(args.ifexpr, args.whileexpr);
	    },

	    run: function(element, ctx) {
	    	var repeat = this.xform.getIdManager().find(this.repeat);
	    	var index = numberValue(this.index.evaluate(ctx));
	    	DebugConsole.write("setIndex " + index);
	    	if (!isNaN(index)) {
	    		console.log("setting index");
	    		repeat.xfElement.setIndex(index);
	    	}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFSetindex");