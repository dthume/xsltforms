dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

dojo.provide("xsltforms.DebugConsole");

(function() {
    dojo.declare(
	"xsltforms.DebugConsole",
	xsltforms.XFAbstractObject,
	{
	    _element : null,
	    _isInit : false,
	    _time : 0,

	    // FIXME: convert to constructor
	    init_ : function() {
		this._element = this.xform.getElementById("console");
		this._isInit = true;
		this._time = new Date().getTime();
	    },

	    write : function(text) {
		if (this.isOpen()) {
		    var time = new Date().getTime();
		    this._element.appendChild(document.createTextNode(time - this._time + " -> " + text));
		    Core.createElement("br", this._element);
		    this._time = time;
		}
	    },

	    clear : function() {
		if (this.isOpen()) {
		    while (this._element.firstChild) {
			this._element.removeChild(this._element.firstChild);
		    }

		    this._time = new Date().getTime();
		}
	    },

	    isOpen : function() {
		if (!this._isInit) {
		    this.init_();
		}
		
		return this._element != null;
	    }
	});
})();
