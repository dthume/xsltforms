dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFControl");

(function() {

    var getXFElement = xsltforms.elements.dojo.XFControl.getXFElement;

    var normalChange = function(evt) {
        var xf = getXFElement(this);
        var news = [];
        var value = "";
        var old = xf.getSelected();
        var opts = this.options;
        xf.xform.openAction();
        
        for (var i = 0, len = old.length; i < len; i++) {
            if (old[i].selected) {
                news.push(old[i]);
            } else {
                xf.xform.dispatch(old[i], "xforms-deselect");
            }
        }
	
        for (var j = 0, len1 = opts.length; j < len1; j++) {
            var opt = opts[j];
            if (opt.selected) {
                value = value? value + " " + opt.value : opt.value;
            }
        }
	
        for (var j = 0, len1 = opts.length; j < len1; j++) {
            var opt = opts[j];	    
            if (opt.selected) {
                if (!inArray(opt, news)) {
                    news.push(opt);
                    xf.xform.dispatch(opt, "xforms-select");
                }
            }
        }

        xf.value = value;
        xf.selectedOptions = news;
        xf.xform.closeAction();
    };

    var incrementalChange = function(evt) {
        var xf = getXFElement(this);
        xf.xform.openAction();
        normalChange.call(this, evt);
	    xf.valueChanged(xf.value);
	    xf.xform.closeAction();
    };

    dojo.declare(
	"xsltforms.elements.dojo.XFSelect",
	xsltforms.elements.dojo.XFControl,
	{
	    constructor: function(args) {
		    this.init(args.id);
		    this.binding = args.binding;
		    this.multiple = args.multiple;
		    this.full = args.full;
		    this.incremental = args.incremental;
		    this.isClone = args.clone;
		    this.hasBinding = true;
		
		    if (!this.full) {
		        this.select = dojo.query("span.widget select", this.element)[0];
		        this.initFocus(this.select);
		        
		        this.xform.getEventManager().attach(this.select, "change",
		                this.incremental ? incrementalChange : normalChange);
		    }
	    },
	    clone: function(id) { 
	        return new xsltforms.elements.dojo.XFSelect({
	            xform: this.xform,
	            id: id,
	            multiple: this.multiple,
	            full: this.full,
	            binding: this.binding,
	            incremental: this.incremental,
	            clone: true
	        });
	    },

	    dispose: function() {
	        this.select = null;
	        this.selectedOptions = null;
	        this.inherited(arguments);
	    },

	    focusFirst: function() {
		var input = Core.getElementsByTagName(this.element, "input")[0] ;
		input.focus();

		if (Core.isOpera) {
		    input.focus();
		}
	    },

	    setValue: function(value) {
		if (!this.full && (!value || value == "")) {
		    this.selectedOptions = [];
		    if (this.select.firstChild.value != "\xA0") {
			var empty = this.select.options[0].cloneNode(true);
			empty.value = "\xA0";
			empty.text = "\xA0";
			empty.id = "";
			this.select.insertBefore(empty, this.select.options[0]);
			this.select.selectedIndex = 0;
		    }
		} else 
		{
		    if (!this.full && this.select.firstChild.value == "\xA0") {
			this.select.removeChild(this.select.firstChild);
		    }
		    var vals = value? (this.multiple? value.split(" ") : [value]) : [""];
		    var list = this.full? (Core.getElementsByTagName(this.element, "input") ) : this.select.options;
		    var well = true;
		    
		    for (var i = 0, len = vals.length; well && i < len; i++) {
			var val = vals[i];
			var finded = false;
			
			for (var j = 0, len1 = list.length; !finded && j < len1; j++) {
			    if (list[j].value == val) {
				finded = true;
			    }
			}

			well = finded;
		    }

		    if (well || (this.multiple && !value)) {
			if (this.outRange) {
			    this.outRange = false;
			    this.xform.dispatch(this, "xforms-in-range");
			}
		    } else if ((!this.multiple || value) && !this.outRange) {
			this.outRange = true;
			this.xform.dispatch(this, "xforms-out-of-range");
		    }

		    vals = this.multiple? vals : [vals[0]];
		    var readonly = this.element.node.readonly;

		    if (this.full) {
			for (var n = 0, len2 = list.length; n < len2; n++) {
			    var item = list[n];
			    item.checked = inArray(item.value, vals);
			}
		    } else {
			this.selectedOptions = [];
			for (var k = 0, len3 = list.length; k < len3; k++) {
			    var item = list[k];
			    var b = inArray(item.value, vals);
			    if (b) {
				this.selectedOptions.push(item);
			    }
			    try {
				item.selected = b;
			    } catch(e) {
			    }
			}
		    }
		}
		
		var actualValue = dojo.query("span.value", this.element);
		actualValue[0].innerHTML = value;
	    },

	    changeReadonly: function() {
		if (this.full) {
		    var list = Core.getElementsByTagName(this.element, "input") ;

		    for (var i = 0, len = list.length; i < len; i++) {
			list[i].disabled = this.readonly;
		    }
		} else {
		    if (!this.xform.getDialog().knownSelect(this.select)) {
			this.select.disabled = this.readonly;
		    }
		}
	    },

	    itemClick: function(value) {
		var inputs = Core.getElementsByTagName(this.element, "input") ;
		this.xform.openAction();

		if (this.multiple) {
		    var newValue = null;
		    
		    for (var i = 0, len = inputs.length; i < len; i++) {
			var input = inputs[i];

			if (input.value == value) {
			    this.xform.dispatch(input.parentNode, input.checked? "xforms-select" : "xforms-deselect");
			}
			
			if (input.checked) {
			    newValue = (newValue? newValue + " " : "") + input.value;
			}
		    }

		    value = newValue;
		} else {
		    var old = this.value || getValue(this.element.node);
		    var inputSelected = null;

		    if (old == value) {
		    	this.xform.closeAction();
			return;
		    }

		    for (var j = 0, len1 = inputs.length; j < len1; j++) {
			var input = inputs[j];
			input.checked = input.value == value;
			
			if (input.value == old) {
			    this.xform.dispatch(input.parentNode, "xforms-deselect");
			} else if (input.value == value) {
			    var inputSelected = input;
			}
		    }
		    
		    this.xform.dispatch(inputSelected.parentNode, "xforms-select");
		}

		if (this.incremental) {
		    this.valueChanged(value || "");
		} else {
		    this.value = value || "";
		}
		
		this.xform.closeAction();
	    },

	    blur: function(evt) {
		if (this.value != null) {
			this.xform.openAction();
		    this.valueChanged(this.value);
		    this.xform.closeAction();
		    this.value = null;
		}
	    },

	    getSelected: function() {
		var s = this.selectedOptions;

		if (!s) {
		    s = [];
		    var opts = this.select.options;

		    for (var i = 0, len = opts.length; i < len; i++) {
			if (opts[i].selected) {
			    s.push(opts[i]);
			}
		    }
		}
		
		return s;
	    }

	});
})();

dojo.provide("xsltforms.elements.dojo.XFSelect");