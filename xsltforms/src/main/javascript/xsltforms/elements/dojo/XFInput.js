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

	function setInputWidget(input, widget) {
		var cell = input.cell;
		while (cell.firstChild) {
			cell.removeChild(cell.firstChild);
		}
		if (input.widget) {
			input.widget.destroy();
		}
		input.widget = widget;
		widget.placeAt(input.cell);
	}

	var getXFElement = xsltforms.elements.dojo.XFControl.getXFElement;

	dojo.declare(
			"xsltforms.elements.dojo.XFInput",
			xsltforms.elements.dojo.XFControl,
			{
				constructor: function(args) {
				this.init(args.id);
				this.widget = null;
				this.binding = args.binding;
				this.inputmode = typeof args.inputmode == "string" ?
						InputMode[args.inputmode] : args.inputmode;
				this.incremental = args.incremental;
				this.delay = args.delay;
				this.timer = null;
				var cells = dojo.query("span.widget", this.element);//.firstChild.firstChild.childNodes;
				this.cell = cells[0];//cells.length - 2];
				this.isClone = args.clone;
				this.hasBinding = true;
				this.type;  // ???
				this.itype = args.itype;
				this.bolAidButton = args.aidButton;
				for (; this.cell.firstChild.nodeType == NodeType.TEXT;
				       this.cell.removeChild(this.cell.firstChild)) {}
				
				this.initFocus(this.cell.firstChild, true);
				if (args.aidButton) {
					this.aidButton = cells[cells.length - 1].firstChild;
					this.initFocus(this.aidButton);
				}
			},
			clone: function(id) { 
				return new xsltforms.elements.dojo.XFInput({
					xform: this.xform,
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
				this.cell = null;
				this.calendarButton = null;
				this.inherited(arguments);
			},
			initInput: function(type) {
				var cell = this.cell;
				var input = cell.firstChild;
				var clase = type["class"];
				var Schema = this.xform.getSchemaManager()
				if (input.type == "password") {
					this.type = Schema.getType("xsd_:string");
					this.initEvents(input, true);
				} else if (input.nodeName.toLowerCase() == "textarea") {
					this.type = Schema.getType("xsd_:string");
					
					this.initEvents(input, false);
				} else if (type != this.type) {
					this.type = type;

					if (clase == "boolean" || this.itype != input.type) {
						for (; cell.firstChild; cell.removeChild(cell.firstChild)) {}
					} else {
						for (var i = cell.childNodes.length - 1; i >= 1; i--) {
							cell.removeChild(cell.childNodes[i]);
						}
					}

					if (clase == "boolean") {
						input = Core.createElement("input");
						input.type = "checkbox";
						
						cell.appendChild(input);
					} else {
						if(this.itype != input.type) {
							input = Core.createElement("input", cell, null, "xforms-value");
						}
						this.initEvents(input, (this.itype=="text"));

						if (clase == "date" || clase == "datetime") {
							this.calendarButton =
								Core.createElement("button", cell, "...", "aid-button");
							
							this.initFocus(this.calendarButton);
						} else if (clase == "number") {
							input.style.textAlign = "right";							
						}

						var max = type.getMaxLength();
						if (max) {
							input.maxLength = max;
						} else {
							input.removeAttribute("maxLength");
						}

						var length = type.getDisplayLength();
						if (length) { 	 
							input.size = length; 	 
						} else { 	 
							input.removeAttribute("size"); 	 
						}
					}
				}

				this.initFocus(input, true);
				this.input = input;
			},
			setValue: function(value) {
				var node = this.element.node;
				var Schema = this.xform.getSchemaManager();
				var type = node ?
						Schema.getType(Core.getMeta(node, "type") || "xsd_:string")
						: Schema.getType("xsd_:string");
						
				if (!this.input || type != this.type) {
					this.initInput(type);
					this.changeReadonly();
				}

				if (type["class"] == "boolean") {
					this.input.checked = value == "true";
//							this.widget.attr("checked", value == "true");
				} else if (this.input.value != value) { // && this != xforms.focus) {
					this.input.value = value || "";
				}
				
				var actualValue = dojo.query("span.value", this.element);
				actualValue[0].innerHTML = value;
			},
			changeReadonly: function() {
				if (this.input) {
					this.input.readOnly = this.readonly;

					if (this.calendarButton) {
						this.calendarButton.style.display = this.readonly? "none" : "";
					}
				}
			},
			initEvents: function(input, canActivate) {
				if (this.inputmode) {
					this.xform.getEventManager().attach(input, "keyup", this.keyUpInputMode);
				}
				if (canActivate) {
					if (this.incremental) {
						this.xform.getEventManager().attach(input, "keyup", this.keyUpIncrementalActivate);
					} else {
						this.xform.getEventManager().attach(input, "keyup", this.keyUpActivate);
					}
				} else {
					if (this.incremental) {
						this.xform.getEventManager().attach(input, "keyup", this.keyUpIncremental);
					}
				}
			},

			blur: function(target) {
				this.xform.focus = null;
				var input = this.input;
				if (!this.incremental) {
					assert(input, this.element.id);
					var value = input.type == "checkbox"?
							(input.checked ? "true" : "false") : input.value;
							this.valueChanged(value);
				} else {
					var node = this.element.node;
					var value = input.value;
					var Schema = this.xform.getSchemaManager();
					if (value != null && value.length > 0
							&& Schema.getType(Core.getMeta(node, "type") || "xsd_:string").format) {
						try { input.value = getValue(node, true); } catch(e) { }
					}
					if (this.timer) {
						window.clearTimeout(this.timer);
						this.timer = null;
					}
				}
			},
			click: function(target) {
				if (target == this.aidButton) {
					this.xform.openAction();
					this.xform.dispatch(this, "ajx-aid");
					this.xform.closeAction();
				} else if (target == this.input && this.type["class"] == "boolean") {
					this.xform.openAction();
					this.valueChanged(target.checked? "true" : "false");
					this.xform.dispatch(this, "DOMActivate");
					this.xform.closeAction();
				} else if (target == this.calendarButton) {
					Calendar.show(target.previousSibling,
							this.type["class"] == "datetime" ? Calendar.SECONDS : Calendar.ONLY_DATE);
				}
			},
			keyUpInputMode: function() {
				var xf = getXFElement(this);
				this.value = xf.inputmode(this.value);
			},
			keyUpActivate: function(a) {
				var xf = getXFElement(this);
				if (a.keyCode == 13) {
					this.xform.openAction();
					xf.valueChanged(this.value || "");
					this.xform.dispatch(xf, "DOMActivate");
					this.xform.closeAction();
				}
			},
			keyUpIncrementalActivate: function(a) {
				var xf = getXFElement(this);
				if (a.keyCode == 13) {
					this.xform.openAction();
					xf.valueChanged(this.value || "");
					this.xform.dispatch(xf, "DOMActivate");
					this.xform.closeAction();
				} else {
					if (xf.delay && xf.delay > 0) {
						if (xf.timer) {
							window.clearTimeout(xf.timer);
						}
						var timerfun = dojo.hitch(this, function() {
							
							this.xform.openAction();
							document.getElementById(xf.element.id )
								.xfElement.valueChanged(this.value || "");
							this.xform.closeAction();
						});
						xf.timer = window.setTimeout(timerfun, xf.delay);
					} else {
						this.xform.openAction();
						xf.valueChanged(this.value || "");
						this.xform.closeAction();
					}
				}
			},
			keyUpIncremental: function() {
				var xf = getXFElement(this);
				if (xf.delay && xf.delay > 0) {
					if (xf.timer) {
						window.clearTimeout(xf.timer);
					}
					var timerfn = dojo.hitch(this, function() {
						this.xform.openAction();
						document.getElementById(xf.element.id)
							.xfElement.valueChanged(this.value || "");
						this.xform.closeAction();
					});
					xf.timer = window.setTimeout(timerfn, xf.delay);
				} else {
					this.xform.openAction();
					xf.valueChanged(this.value || "");
					this.xform.closeAction();
				}
			}

			});
})();
