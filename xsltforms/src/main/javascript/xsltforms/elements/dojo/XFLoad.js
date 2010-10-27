dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFLoad",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    constructor: function(args) {
		    this.binding = args.binding;
		    this.resource = args.resource;
		    this.show = args.show;
		    this.init(args.ifexpr, args.whileexpr);
	    },

	    run: function(element, ctx) {
	        console.log("HREF: ");
	        var href = this.resource;
	        if (this.binding) {
	            var node = this.binding.evaluate(ctx)[0];
	            
	            if (node) {
	                href = this.xform.getValue(node);
	            }
	        } else {
	            if (typeof href == 'object') {
	                href = stringValue(this.resource.xpath.evaluate(ctx));
	            }
	        }

	        if (href) {
	            if(href.substr(0, 11) == "javascript:") {
	                eval("{XSLTFormsContext={elementId:\""+element.getAttribute("id")+"\"};"+href.substr(11)+"}");
	            } else if (this.show == "new") {
	                window.open(href);
	            } else {
	                this.xform.setLocation(href);
	            }
	        }
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFLoad");