dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.XFAbstractObject");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFCoreElement",
	xsltforms.XFAbstractObject,
	{
		build: function() { },
		
	    init: function(id, parent, className) {
			parent = parent? parent.element : this.xform.getHeader();
		this.element = Core.createElement("span", parent, null, className);
		this.element.id = id;
		this.element.xfElement = this;
	    },
	    
	    dispose: function() {
		this.element.xfElement = null;
		this.element.parentNode.removeChild(this.element);
		this.element = null;
		this.model = null;
	    }
	});
    
})();

dojo.provide("xsltforms.elements.dojo.XFCoreElement");