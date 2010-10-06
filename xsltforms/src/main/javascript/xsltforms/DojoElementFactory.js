dojo.require("xsltforms");

dojo.require("xsltforms.elements.dojo.XFAction");
dojo.require("xsltforms.elements.dojo.XFBind");
dojo.require("xsltforms.elements.dojo.XFDelete");
dojo.require("xsltforms.elements.dojo.XFDispatch");
dojo.require("xsltforms.elements.dojo.XFGroup");
dojo.require("xsltforms.elements.dojo.XFInput");
dojo.require("xsltforms.elements.dojo.XFInsert");
dojo.require("xsltforms.elements.dojo.XFInstance");
dojo.require("xsltforms.elements.dojo.XFItem");
dojo.require("xsltforms.elements.dojo.XFItemset");
dojo.require("xsltforms.elements.dojo.XFLabel");
dojo.require("xsltforms.elements.dojo.XFLoad");
dojo.require("xsltforms.elements.dojo.XFMessage");
dojo.require("xsltforms.elements.dojo.XFModel");
dojo.require("xsltforms.elements.dojo.XFOutput");
dojo.require("xsltforms.elements.dojo.XFRepeat");
dojo.require("xsltforms.elements.dojo.XFSelect");
dojo.require("xsltforms.elements.dojo.XFSetindex");
dojo.require("xsltforms.elements.dojo.XFSetvalue");
dojo.require("xsltforms.elements.dojo.XFSubmission");
dojo.require("xsltforms.elements.dojo.XFToggle");
dojo.require("xsltforms.elements.dojo.XFTrigger");

(function() {

	dojo.declare("xsltforms.DojoElementFactory", null, {
		constructor: function(xform) {

		function factory(ElementType) {
			return function(args) {
				args["xform"] = xform;
				return new ElementType(args);
			};
		}

		dojo.safeMixin(this, {
			XFAction: factory(xsltforms.elements.dojo.XFAction),
			XFBind: factory(xsltforms.elements.dojo.XFBind),
			XFDelete: factory(xsltforms.elements.dojo.XFDelete),
			XFDispatch: factory(xsltforms.elements.dojo.XFDispatch),
			XFGroup: factory(xsltforms.elements.dojo.XFGroup),
			XFInput: factory(xsltforms.elements.dojo.XFInput),
			XFInsert: factory(xsltforms.elements.dojo.XFInsert),
			XFInstance: factory(xsltforms.elements.dojo.XFInstance),
			XFItem: factory(xsltforms.elements.dojo.XFItem),
			XFItemset: factory(xsltforms.elements.dojo.XFItemset),
			XFLabel: factory(xsltforms.elements.dojo.XFLabel),
			XFLoad: factory(xsltforms.elements.dojo.XFLoad),
			XFMessage: factory(xsltforms.elements.dojo.XFMessage),
			XFModel: factory(xsltforms.elements.dojo.XFModel),
			XFOutput: factory(xsltforms.elements.dojo.XFOutput),
			XFRepeat: factory(xsltforms.elements.dojo.XFRepeat),
			XFSelect: factory(xsltforms.elements.dojo.XFSelect),
			XFSetindex: factory(xsltforms.elements.dojo.XFSetindex),
			XFSetvalue: factory(xsltforms.elements.dojo.XFSetvalue),
			XFSubmission: factory(xsltforms.elements.dojo.XFSubmission),
			XFToggle: factory(xsltforms.elements.dojo.XFToggle),
			XFTrigger: factory(xsltforms.elements.dojo.XFTrigger)
		});
	}
	});
})();

dojo.provide("xsltforms.DojoElementFactory");