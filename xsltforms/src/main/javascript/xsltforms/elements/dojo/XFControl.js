dojo.provide("xsltforms.elements.dojo.XFControl");

dojo.require("xsltforms.elements.dojo.XFElement");

(function() {
    function getXFElement(element) {
        var xf = null;

        while (!xf && element) {
            xf = element.xfElement;

            if (xf && !xf.isControl) {
                xf = null;
            }

            element = element.parentNode;
        }

        return xf;
    }

    function selectItem(element) {
        var par = element.parentNode;

        if (par) {
            var repeat = par.xfElement? par : par.parentNode;
            var childs = par.childNodes;
            assert(repeat.xfElement, element.nodeName +  " - " + repeat.nodeName);

            for (var i = 0, len = childs.length; i < len; i++) {
                if (childs[i] == element) {
                    repeat.xfElement.setIndex(i + 1);
                    break;
                }
            }
        }
    }

    function focusHandler() {
        var xf = getXFElement(this);
        if (xf.xform.focus != xf) {
            xf.focus(true);
        } else {
            xf.xform.posibleBlur = false;
        }
    }

    function blurHandler() {
        var xf = getXFElement(this); 
        if (xf == xf.xform.focus) {
            xf.xform.posibleBlur = true;
            var timerfn = dojo.hitch(this, function() {
                xf.xform.blur();
            });
            setTimeout(timerfn, 200);
        }
    }

    dojo.declare(
        "xsltforms.elements.dojo.XFControl",
        xsltforms.elements.dojo.XFElement,
    {
        isControl: true,
        initFocus: function(element, principal) {
            if (principal) {
                this.focusControl = element;
            }
            var Event = this.xform.getEventManager();
            Event.attach(element, "focus", focusHandler);
            Event.attach(element, "blur", blurHandler);
        },
        dispose: function() {
            this.focusControl = null;
            this.inherited(arguments);
        },
        getLabelCell: function() {
            return dojo.query("span.label", this.element)[0];
        },
        getValueCell: function() {
            return dojo.query("span.value", this.element)[0];
        },
        getWidgetCell: function() {
            return dojo.query("span.widget", this.element)[0];
        },
        focus: function(focusEvent) {
            if (this.isOutput) {
                return;
            }

            if (this.xform.focus != this) {
                this.xform.openAction();
                this.xform.blur(true);
                this.xform.focus = this;
                Core.setClass(this.element, "xforms-focus", true);
                Core.setClass(this.element, "xforms-disabled", false);
                var parent = this.element.parentNode;

                while (parent.nodeType == NodeType.ELEMENT) {
                    if (typeof parent.node != "undefined"
                        && Core.hasClass(parent, "xforms-repeat-item")) {
                        selectItem(parent);
                    }

                    parent = parent.parentNode;
                }

                this.xform.dispatch(this.xform.focus, "DOMFocusIn");
                this.xform.closeAction();

                if (this.full && !focusEvent) { // select full
                    this.focusFirst();
                }
            }

            var fcontrol = this.focusControl;
            this.xform.posibleBlur = false;

            if (fcontrol && !focusEvent) {
                var control = this.focusControl;
                var name = control.nodeName.toLowerCase();
                control.focus();
                control.focus();

                if (name == "input" || name == "textarea") {
                    control.select();
                }
            }
        },	
        build_: function(ctx) {
            var result = this.evaluateBinding(this.binding, ctx);

            if (typeof result == "object") {
                var node = result[0];
                var element = this.element;
                var old = element.node;

                if (old != node || !this.xform.ready) {
                    element.node = node;
                    this.nodeChanged = true;
                }

                if (node) {
                    this.depsNodesRefresh.push(node);
                }
            } else {
                this.outputValue = result;
            }
        },
        refresh: function() {
            var element = this.element;
            var node = element.node;

            if (node) {
                var value = getValue(node, true);
                this.xform.openAction();
                var changed = value != this.currentValue || this.nodeChanged;

                if (this.relevant) {
                    Core.setClass(element, "xforms-disabled", false);
                }

                this.changeProp(node, "required", "xforms-required", "xforms-optional", changed);
                this.changeProp(node, "notrelevant", "xforms-disabled", "xforms-enabled", changed);
                this.changeProp(node, "readonly", "xforms-readonly", "xforms-readwrite", changed);
                this.changeProp(node, "notvalid", "xforms-invalid", "xforms-valid", changed);

                if (changed) {
                    this.currentValue = value;
                    this.setValue(value);

                    if (!this.nodeChanged && !this.isTrigger) {
                        this.xform.dispatch(element, "xforms-value-changed");
                    }
                }

                this.xform.closeAction();
            } else if (this.outputValue != null) {
                this.setValue(this.outputValue);
                Core.setClass(element, "xforms-disabled", false);
            } else {
                Core.setClass(element, "xforms-disabled", !this.hasValue);
            }    
            this.nodeChanged = false;
        },
        changeProp: function(node, prop, onTrue, onFalse, changed) {
            var value = Core.getMeta(node, prop);

            if (changed || value != this[prop]) {
                if (!this.nodeChanged && !this.isTrigger) {
                    this.xform.dispatch(this.element, (value? onTrue : onFalse));
                }

                Core.setClass(this.element, onTrue, value);
                Core.setClass(this.element, onFalse, !value);
                this[prop] = value;

                if(prop == "readonly" && this.changeReadonly) {
                    this.changeReadonly();
                }
            }	
        },
        valueChanged: function(value) {
            var node = this.element.node;
            var model = this.xform.getElementById(Core.getMeta(node.ownerDocument.documentElement, "model")).xfElement;
            var Schema = this.xform.getSchemaManager()
            var schtyp = Schema.getType(Core.getMeta(node, "type") || "xsd_:string");

            if (value != null && value.length > 0 && schtyp.parse) {
                try { value = schtyp.parse(value); } catch(e) { }
            }
            if (value != getValue(node)) {
                this.xform.openAction();
                setValue(node, value);
                model.addChange(node);
                //this.xform.dispatch(model, "xforms-recalculate");
                //xforms.refresh();
                this.xform.closeAction();
            }
        }
    });

    xsltforms.elements.dojo.XFControl.getXFElement = getXFElement;
    xsltforms.elements.dojo.XFControl.focusHandler = focusHandler;
    xsltforms.elements.dojo.XFControl.blurHandler = blurHandler;
})();
