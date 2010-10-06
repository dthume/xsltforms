dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFElement");

(function() {

    dojo.declare(
	"xsltforms.elements.dojo.XFRepeat",
	xsltforms.elements.dojo.XFElement,
	{
	    constructor: function(args) {
		this.init(args.id);
		this.binding = args.binding;
		this.isClone = args.clone;
		this.index = 1;
		var el = this.element;
		this.isRepeat = true;
		this.hasBinding = true;
		this.root = Core.hasClass(el, "xforms-control")? el.lastChild : el;
		this.isItemset = Core.hasClass(el, "xforms-itemset");
	    },

	    dispose: function() {
		this.root = null;
		this.inherited(arguments);
	    },

	    setIndex: function(index) {
		if (this.index != index) {
		    var node = this.nodes[index - 1];
		    
		    if (node) {    
		    	this.xform.openAction();
			this.index = index;
			this.element.node = node;
			this.xform.addChange(this);
			this.xform.addChange(this.xform.getElementById(Core.getMeta(node.ownerDocument.documentElement, "model")).xfElement);
			this.xform.closeAction();
		    }
		}
	    },

	    deleteNode: function(node) {
		var newNodes = [];
		var nodes = this.nodes;
		
		for (var i = 0, len = nodes.length; i < len; i++) {
		    if (node != nodes[i]) {
			newNodes.push(nodes[i]);
		    }
		}

		this.nodes = newNodes;
		this.setIndex(this.index == nodes.length? this.index - 1 : this.index);
	    },

	    insertNode: function(node, nodeAfter) {
		var nodes = this.nodes;

		if (nodeAfter) {
		    var newNodes = [];
		    var index = 1;

		    for (var i = 0, len = nodes.length; i < len; i++) {
			if (nodeAfter == nodes[i]) {
			    newNodes.push(node);
			    index = i + 1;
			}
			
			newNodes.push(nodes[i]);
		    }

		    this.nodes = newNodes;
		    this.setIndex(index);
		} else {
		    nodes.push(node);
		    this.setIndex(nodes.length);
		}
	    },

	    build_: function(ctx) {
		var nodes = this.evaluateBinding(this.binding, ctx);
		var r = this.root;
		var l = r.childNodes.length;
		this.nodes = nodes;
		var n = nodes.length;

		for (var i = l; i < n; i++) {
		    var child = r.firstChild.cloneNode(true);
		    r.appendChild(child);
		    this.xform.initClone(child);
		}

		for (var j = n; j < l && r.childNodes.length > 1; j++) {
			this.xform.dispose(r.lastChild);
		    r.removeChild(r.lastChild);
		}

		for (var k = 0; k < n; k++) {
		    Core.setMeta(nodes[k], "repeat", this.element.id);
		    r.childNodes[k].node = nodes[k];
		}

		if (this.index > n) {
		    this.index = 1;
		}
		
		this.element.node = nodes[this.index - 1];
	    },

	    refresh: function(selected) {
		var empty = this.nodes.length === 0;
		Core.setClass(this.element, "xforms-disabled", empty);

		if (!empty && !this.isItemset) {
		    var childs = this.root.childNodes;

		    for (var i = 0, len = childs.length; i < len; i++) {
			var sel = selected && (this.index == i + 1);
			childs[i].selected = sel;
			Core.setClass(childs[i], "xforms-repeat-item-selected", sel);
		    }
		}
	    },

	    clone: function(id) { 
		return new xsltforms.elements.dojo.XFRepeat({
		    xform: this.xform,
		    id: id,
		    binding: this.binding,
		    clone: true
		});
	    }

	});

})();

dojo.provide("xsltforms.elements.dojo.XFRepeat");