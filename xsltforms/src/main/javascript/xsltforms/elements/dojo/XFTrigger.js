dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFControl");
dojo.require("dijit.form.Button");

(function() {

    dojo.declare(
	"xsltforms.elements.dojo.XFTrigger",
	xsltforms.elements.dojo.XFControl,
	{
	    constructor: function(args) {
		    this.init(args.id);
		    this.binding = args.binding;
		    this.hasBinding = !!args.binding;
		    if(!this.hasBinding) {
		        Core.setClass(this.element, "xforms-disabled", false);
		    }
		    this.isTrigger = true;
		    var button = Core.getElementsByTagName(this.element, "a")[0]
		        || Core.getElementsByTagName(this.element, "button")[0];
		
		    this.initFocus(button);
		    this.isClone = args.clone;
	    },

	    setValue: function () { },

	    clone: function (id) {
	        return new xsltforms.elements.dojo.XFTrigger({
	            xform: this.xform,
	            id: id,
	            binding: this.binding,
	            clone: true
	        });
	    },

	    click: function () {
	    	this.xform.openAction();
	    	this.xform.dispatch(this, "DOMActivate");
	    	this.xform.closeAction();
	    },

	    blur: function () { }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFTrigger");