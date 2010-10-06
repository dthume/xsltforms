dojo.require("xsltforms");

dojo.require("dijit.form.ComboBox");

dojo.provide("xsltforms.ComboDataStore");

dojo.declare("xsltforms.ComboDataStore", [dijit._Widget, dijit._Templated], {
    templateString: '<div style="display:none;" dojoAttachPoint="containerNode"></div>',

    postCreate: function(args, frag) {
        this.inherited(arguments);
	this.store = new dijit.form._ComboBoxDataStore(this.containerNode);
	dojo.mixin(this, this.store);
    }
});
