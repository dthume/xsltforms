dojo.require("xsltforms.elements.dojo");

dojo.require("xsltforms.elements.dojo.XFControl");

(function() {
    dojo.declare(
	"xsltforms.elements.dojo.XFOutput",
	xsltforms.elements.dojo.XFControl,
	{
	    //function XFOutput(id, binding, mediatype) {
	    constructor: function(args) {
		this.init(args.id);

		if (this.element.firstChild.firstChild) {
		    var cells = this.element.firstChild.firstChild.childNodes;
		    this.valueElement = cells[cells.length - 2];
		} else {
		    this.valueElement = this.element;
		}
		for (var i=0, len = this.valueElement.childNodes.length; i<len; i++) {
		    if( this.valueElement.childNodes[i].nodeType != NodeType.TEXT ) {
			this.valueElement = this.valueElement.childNodes[i];
			break;
		    }
		}
		
		this.hasBinding = true;
		this.binding = args.binding;
		this.mediatype = args.mediatype;
		this.isOutput = true;
		if (this.binding && this.binding.isvalue) {
		    Core.setClass(this.element, "xforms-disabled", false);
		}
	    },

	    clone: function(id) { 
		return new xsltforms.elements.dojo.XFOutput({
		    xform: this.xform,
		    id: id,
		    binding: this.binding,
		    mediatype: this.mediatype
		});
	    },

	    dispose: function() {
		this.valueElement = null;
		this.inherited(arguments);
	    },

	    setValue: function(value) {
		var node = this.element.node;
		var element = this.valueElement;

		if (element.nodeName.toLowerCase() == "span") {
		    if (this.mediatype == "application/xhtml+xml") {
			while (element.firstChild) {
			    element.removeChild(element.firstChild);
			}
			if (value != null) {
			    XDocument.parse(value, element);
			}
		    } else if (this.mediatype == "image/svg+xml") {
			while (element.firstChild) {
			    element.removeChild(element.firstChild);
			}
			if (Core.isIE) {
			    var xamlScript = Core.createElementByName(document, "script");
			    xamlScript.setAttribute("type", "text/xaml");
			    xamlScript.setAttribute("id", this.element.id+"-xaml");
			    xamlScript.text = Core.transformText(value, Core.ROOT + "svg2xaml.xsl", false, "width", element.currentStyle.width, "height", element.currentStyle.height);
			    element.appendChild(xamlScript);
			    var xamlObject = Core.createElementByName(document, "object");
			    xamlObject.setAttribute("width", element.currentStyle.width+"px");
			    xamlObject.setAttribute("height", element.currentStyle.height+"px");
			    xamlObject.setAttribute("type", "application/x-silverlight");
			    xamlObject.setAttribute("style", "min-width: " + element.currentStyle.width+"px");
			    //xamlObject.setAttribute("style", "min-width: " + xamlScript.text.substring(xamlScript.text.indexOf('<Canvas Width="')+15,xamlScript.text.indexOf('" Height="')) + "px");
			    var xamlParamSource = Core.createElementByName(document, "param") ;
			    xamlParamSource.setAttribute("name", "source");
			    xamlParamSource.setAttribute("value", "#"+this.element.id+"-xaml");
			    xamlObject.appendChild(xamlParamSource);
			    var xamlParamOnload = Core.createElementByName(document, "param") ;
			    xamlParamOnload.setAttribute("name", "onload");
			    xamlParamOnload.setAttribute("value", "onLoaded");
			    xamlObject.appendChild(xamlParamOnload);
			    var xamlParamIswindowless = Core.createElementByName(document, "param") ;
			    xamlParamIswindowless.setAttribute("name", "iswindowless");
			    xamlParamIswindowless.setAttribute("value", "true");
			    xamlObject.appendChild(xamlParamIswindowless);
			    element.appendChild(xamlObject);
			} else if (Core.isXhtml) {
			    var cs = window.getComputedStyle(element, null);
			    XDocument.parse(value, element);
			    element.firstChild.setAttribute("width", cs.getPropertyValue("min-width"));
			    element.firstChild.setAttribute("height", cs.getPropertyValue("min-height"));
			} else {
			    var svgObject = Core.createElementByName(document, "object") ;
			    svgObject.setAttribute("type", "image/svg+xml");
			    svgObject.setAttribute("data", "data:image/svg+xml,"+ value);
			    element.appendChild(svgObject);
			}
		    } else {
			setValue(element, value);
		    }
		} else {
		    element.src = value;
		}
	    },

	    getValue: function(format) {
		var node = this.element.node;
		var element = this.valueElement;

		if (element.nodeName.toLowerCase() == "span") {
		    return getValue(element, format);
		} else {
		    value = element.src;
		    if (value && format && element.type.format) {
			try { value = element.type.format(value); } catch(e) { }
		    }
		    return value;
		}
	    }
	});
})();

dojo.provide("xsltforms.elements.dojo.XFOutput");