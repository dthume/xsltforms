dojo.require("xsltforms");

(function() {

    dojo.declare("xsltforms.IdManager", null, {
	constructor: function() {
	    this.data = [];
	    this.index = 0;
	},
	cloneId : function(element) {
            assert(element && element.id);
            var id = element.getAttribute("oldid") || element.id;
            var list = this.data[id];

            if (!list) {
		list = [];
		this.data[id] = list;
            }
            
            var newId = "clonedId" + this.index++;
            list.push(newId);
            element.setAttribute("oldid", id);
            element.id = newId;
	},
	find : function(id) {
	    var ids = this.data[id];
	    if (ids) {
		for (var i = 0, len = ids.length; i < len; i++) {
		    var element = document.getElementById(ids[i]);
		    if (element) {
			var parent = element.parentNode;
			while (parent.nodeType == NodeType.ELEMENT) {
			    if (Core.hasClass(parent, "xforms-repeat-item")) {
				if (Core.hasClass(parent, "xforms-repeat-item-selected")) {
				    return element;
				} else {
				    break;
				}
			    }
			    parent = parent.parentNode;
			}
		    }
		}
	    }
	    var res = document.getElementById(id);
	    //if (!res) {
	    //alert("element " + id + " not found");
	    //}
	    return res;
	},
	clear : function() {
            for (var i in this.data) {
		this.data[i] = null;
            }
            
            this.data = [];
	    index = 0;
	}
    });

})();

dojo.provide("xsltforms.IdManager");