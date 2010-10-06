dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFElement");
dojo.require("xsltforms.elements.dojo.XFControl");

(function() {
    var getXFElement = xsltforms.elements.dojo.XFControl.getXFElement;
    var focusHandler = xsltforms.elements.dojo.XFControl.focusHandler;
    var blurHandler = xsltforms.elements.dojo.XFControl.blurHandler;

    dojo.declare(
	"xsltforms.elements.dojo.XFItem",
	xsltforms.elements.dojo.XFElement,
	{
	    constructor: function(args) {
		this.init(args.id);

		if (args.bindingL || args.bindingV) {
		    this.hasBinding = true;
		    this.bindingL = args.bindingL;
		    this.bindingV = args.bindingV;
		} else {
		    Core.setClass(this.element, "xforms-disabled", false);
		}

		var element = this.element;

		if (element.nodeName.toLowerCase() != "option") {
		    this.input = Core.getElementsByTagName(element, "input")[0];
		    this.input.name = getXFElement(this.element).element.id;
		    var Event = this.xform.getEventManager();
		    Event.attach(this.input, "focus", focusHandler);
		    Event.attach(this.input, "blur", blurHandler);
		    this.label = Core.getElementsByTagName(element, "span")[0];
		}
	    },

	    clone: function(id) { 
		return new xsltforms.elements.dojo.XFItem({
		    xform: this.xform,
		    id: id,
		    bindingL: this.bindingL,
		    bindingV: this.bindingV
		});
	    },

	    dispose: function() {
		this.input = null;
		this.label = null;
		this.inherited(arguments);
	    },

	    build_: function(ctx) {
		var element = this.element;
		var xf = element.parentNode.xfElement;

		if (xf && xf.isRepeat) {
		    ctx = element.node;
		} else {
		    element.node = ctx;
		}

		if (this.bindingL) {
		    element.nodeL = this.evaluateBinding(this.bindingL, ctx)[0];
		    this.depsNodesRefresh.push(element.nodeL);
		}

		if (this.bindingV) {
		    element.nodeV = this.evaluateBinding(this.bindingV, ctx)[0];
		    this.depsNodesRefresh.push(element.nodeV);
		}
	    },

	    refresh: function() {
		var element = this.element;

		if (element.nodeName.toLowerCase() == "option") {
		    if (element.nodeL) {
			try { element.text = getValue(element.nodeL, true); } catch(e) { }
		    }

		    if (element.nodeV) {
			try { element.value = getValue(element.nodeV); } catch(e2) { }
		    }
		} else {
		    if (element.nodeL) {
			setValue(this.label, getValue(element.nodeL, true));
		    }

		    if (element.nodeV) {
			this.input.value = getValue(element.nodeV);
		    }
		}
	    },

	    click: function (target) {
		var input = this.input;

		if (input) {
		    var xf = getXFElement(this.element);
		    
		    if (!xf.element.node.readonly && target == input) {
			xf.itemClick(input.value);
		    }
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFItem");