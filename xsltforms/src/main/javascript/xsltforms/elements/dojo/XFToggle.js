dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    var toggle = function(caseId, ctx) {
    	this.xform.openAction();
	if (typeof caseId == 'object') {
	    if (!ctx) {
		ctx = this.xform.defaultModel.getInstanceDocument() ? this.xform.defaultModel.getInstanceDocument().documentElement : null;
	    }
	    caseId = stringValue(caseId.xpath.evaluate(ctx));
	}
	var element = this.xform.getIdManager().find(caseId);
	var childs = element.parentNode.childNodes;
	var ul;
	var index = -1;

	if (childs.length > 0 && childs[0].nodeName.toLowerCase() == "ul") {
	    ul = childs[0];
	}

	for (var i = ul != null? 1 : 0, len = childs.length; i < len; i++) {
	    var child = childs[i];

	    if (child == element) {
		index = i - 1;
	    } else {
		if (child.style && child.style.display != "none") {
		    child.style.display = "none";
		    
		    if (ul != null) {
			Core.setClass(ul.childNodes[i - 1], "ajx-tab-selected", false);
		    }
		}
		this.xform.dispatch(child, "xforms-deselect");
	    }
	}

	if (element.style.display == "none") {
	    element.style.display = "block";
	    
	    if (ul != null) {
		Core.setClass(ul.childNodes[index], "ajx-tab-selected", true);
	    }
	}
	this.xform.dispatch(element, "xforms-select");

	this.xform.closeAction();
    };

    dojo.declare(
	"xsltforms.elements.dojo.XFToggle",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    //function XFToggle(caseId, ifexpr, whileexpr) {
	    constructor: function(args) {
		this.caseId = args.caseId;
		this.init(args.ifexpr, args.whileexpr);
		this._toggle = toggle;
	    },
	    
	    run: function(element, ctx) {
	    	this._toggle(this.caseId, ctx);
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFToggle");