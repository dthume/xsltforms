dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFAbstractAction");

(function() {
    
    dojo.declare(
	"xsltforms.elements.dojo.XFMessage",
	xsltforms.elements.dojo.XFAbstractAction,
	{
	    constructor: function(args) {
		this.binding = args.binding;
		this.id = args.id;
		this.level = args.level;
		this.init(args.ifexpr, args.whileexpr);
	    },

	    run: function(element, ctx) {
		var text;

		if (this.binding) {
		    var node = this.binding.evaluate(ctx)[0];

		    if (node) {
			text = this.xform.getValue(node);
		    }
		} else {
		    var e = this.xform.getIdManager().find(this.id);
		    var building = this.xform.building;
		    this.xform.building = true;
		    this.xform.build(e, ctx);
		    this.xform.building = building;
		    text = e.textContent || e.innerText;
		}

		if (text) {
		    alert(text.trim());
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFMessage");