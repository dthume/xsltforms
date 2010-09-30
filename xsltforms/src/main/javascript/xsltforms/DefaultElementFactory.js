dojo.require("xsltforms");

dojo.provide("xsltforms.DefaultElementFactory");

dojo.declare("xsltforms.DefaultElementFactory", null, {
    constructor: function() {
	dojo.safeMixin(this, {
	    XFAction: XFAction,
	    XFBind: XFBind,
	    XFDelete: XFDelete,
	    XFDispatch: XFDispatch,
	    XFGroup: XFGroup,
	    XFInput: XFInput,
	    XFInsert: XFInsert,
	    XFInstance: XFInstance,
	    XFItem: XFItem,
	    XFItemset: XFItemset,
	    XFLabel: XFLabel,
	    XFLoad: XFLoad,
	    XFMessage: XFMessage,
	    XFModel: XFModel,
	    XFOutput: XFOutput,
	    XFRepeat: XFRepeat,
	    XFSelect: XFSelect,
	    XFSetindex: XFSetindex,
	    XFSetvalue: XFSetvalue,
	    XFSubmission: XFSubmission,
	    XFToggle: XFToggle,
	    XFTrigger: XFTrigger,
	    XFGroup: XFGroup
	});
    }
});
