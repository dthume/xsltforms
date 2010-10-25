dojo.require("xsltforms");

(function() {
    dojo.declare("xsltforms.XFAbstractObject", null,
    {
        constructor: function(args) {
            this.xform = args.xform;
        }
    });

})();

dojo.provide("xsltforms.XFAbstractObject");