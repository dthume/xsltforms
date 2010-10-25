dojo.provide("xsltforms.elements.dojo.XFInput");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.Textarea");
dojo.require("dijit.form.DateTextBox");
dojo.require("dojox.widget.Calendar");
dojo.require("dijit.form.TimeTextBox");
dojo.require("dijit.form.NumberTextBox");

dojo.require("xsltforms.elements.dojo.XFControl");

(function() {

	InputMode = {
			lowerCase : function(value) { return value.toLowerCase(); },
			upperCase : function(value) { return value.toUpperCase(); },
			titleCase : function(value) {
				return value.charAt(0).toUpperCase() + value.substring(1).toLowerCase();
			},
			digits : function(value) {
				if (/^[0-9]*$/.exec(value) != null) {
					return value;
				} else {
					alert("Character not valid");
					var digits = "1234567890";
					var newValue = "";

					for (var i = 0, len = value.length; i < len; i++) {
						if (digits.indexOf(value.charAt(i)) != -1) {
							newValue += value.charAt(i);
						}
					}

					return newValue;
				}
			}
	};

	var XFControl = xsltforms.elements.dojo.XFControl;
	var getXFElement = XFControl.getXFElement;

	dojo.declare(
	    "xsltforms.elements.dojo.XFInput",
		xsltforms.elements.dojo.XFControl,
		{
	        constructor: function(args) {
                this.widget = this.xform.getWidgetRegistry().getDefaultWidget();
				this.init(args.id);
				this.controlType = args.controlType;
				this.binding = args.binding;
				this.inputmode = typeof args.inputmode == "string" ?
						InputMode[args.inputmode] : args.inputmode;
				this.incremental = args.incremental;
				this.delay = args.delay;
				this.timer = null;
				this.cell = this.getWidgetCell();
				this.isClone = args.clone;
				this.hasBinding = true;
				this.type;  // ???
				this.itype = args.itype;
				this.bolAidButton = args.aidButton;
				for (; this.cell.firstChild.nodeType == NodeType.TEXT;
				       this.cell.removeChild(this.cell.firstChild)) {}
				//this.initFocus(this.cell.firstChild, true);
				/*
				if (args.aidButton) {
					this.aidButton = cells[cells.length - 1].firstChild;
					this.initFocus(this.aidButton);
                }
                */
			},
			clone: function(id) { 
				return new xsltforms.elements.dojo.XFInput({
					xform: this.xform,
					controlType: this.controlType,
					id: id,
					itype: this.itype,
					binding: this.binding,
					inputmode: this.inputmode,
					incremental: this.incremental,
					delay: this.delay,
					aidButton: this.bolAidButton,
					clone: true
				});
			},
			dispose: function() {
			    this.widget.dispose();
				this.cell = null;
				this.inherited(arguments);
			},
			initInput: function(type) {
			    if (type != this.type) {
			        this.type = type;
			        var Schema = this.xform.getSchemaManager(), 
				        cell = this.cell,
				        clase = type["class"],
				        itype = this.itype,
				        registry = this.xform.getWidgetRegistry(),
				        widget = this.widget,
				        newWidget = registry.lookupWidget({
	                        controlType: this.controlType,
	                        schemaType: this.type
	                    });

			        if (!!widget) widget.dispose();
			        
					for (; cell.firstChild; cell.removeChild(cell.firstChild)){}
					
                    widget = newWidget({
                        xform: this.xform,
                        control: this,
                        parent: cell,
                        inputMode: this.inputMode,
                        incremental : this.incremental,
                        events: {
                            focus: XFControl.focusHandler,
                            blur: XFControl.blurHandler,
                            keyUpActivate: this.keyUpActivate,
                            keyUpIncremental: this.keyUpIncremental,
                            keyUpIncrementalActivate: this.keyUpIncrementalActivate,
                            keyUpInputMode: this.keyUpInputMode
                        }
                    });
                    
                    //this.initFocus(widget.getInputControl(), true);
                    this.widget = widget;
				}				
			},
			setValue: function(value) {
				var node = this.element.node;
				var Schema = this.xform.getSchemaManager();
				var type = node ?
						Schema.getType(Core.getMeta(node, "type") || "xsd_:string")
						: Schema.getType("xsd_:string");

				if (type != this.type) {
					this.initInput(type);
					this.changeReadonly();
				}
				
				this.widget.setValue(value);
				this.getValueCell().innerHTML = value;
			},
			
			changeReadonly: function() { this.widget.changeReadonly(); },
			click: function(target) { this.widget.click(target); },
			
			blur: function(target) {
				this.xform.focus = null;
				if (!this.incremental) {
					var value = this.widget.getValue();
					this.valueChanged(value);
				} else {
					var node = this.element.node;
					var value = this.widget.getValue();
					var Schema = this.xform.getSchemaManager();
					if (value != null && value.length > 0
							&& Schema.getType(Core.getMeta(node, "type") || "xsd_:string").format) {
						try { this.widget.setValue(getValue(node, true)); } catch(e) { }
					}
					if (this.timer) {
						window.clearTimeout(this.timer);
						this.timer = null;
					}
				}
			},
			keyUpInputMode: function() {
				var xf = getXFElement(this);
				var widget = xf.widget;
				widget.setValue(xf.inputmode(widget.getValue()));
			},
			keyUpActivate: function(a) {
				var xf = getXFElement(this);
				if (a.keyCode == 13) {
				    xf.xform.executeInAction(function(xform) {
	                    xf.valueChanged(xf.widget.getValue() || "");
	                    xf.xform.dispatch(xf, "DOMActivate");
                    });
				}
			},
			keyUpIncrementalActivate: function(a) {
				var xf = getXFElement(this);
				var value = xf.widget.getValue() || "";
				if (a.keyCode == 13) {
				    xf.xform.executeInAction(function(xform) {
				        xf.valueChanged(value);
	                    xf.xform.dispatch(xf, "DOMActivate");
                    });
				} else {
					if (xf.delay && xf.delay > 0) {
						if (xf.timer) {
							window.clearTimeout(xf.timer);
						}
						var id = xf.element.id;
						var timerfun = dojo.hitch(this, function() {
						    xf.xform.executeInAction(function(xform) {
						        var el = xform.getElementById(id).xfElement; 
	                            el.valueChanged(el.widget.getValue());
	                        });
						});
						xf.timer = window.setTimeout(timerfun, xf.delay);
					} else {
					    xf.xform.executeInAction(function(xform) {
	                        xform.valueChanged(value);
	                    });
					}
				}
			},
			keyUpIncremental: function() {
				var xf = getXFElement(this);
				
				if (xf.delay && 0 < xf.delay) {
					if (xf.timer) {
						window.clearTimeout(xf.timer);
					}
					var id = xf.element.id;
					var timerfn = dojo.hitch(this, function() {
	                    xf.xform.executeInAction(function(xform) {
	                        var el = xform.getElementById(id).xfElement; 
                            el.valueChanged(el.widget.getValue());
	                    });
					});
					xf.timer = window.setTimeout(timerfn, xf.delay);
				} else {
				    xf.xform.executeInAction(function(xform) {
				        xform.valueChanged(xf.widget.getValue() || "");
				    });
				}
			}

			});
})();
