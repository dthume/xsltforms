dojo.provide("xsltforms.elements.dojo.DojoWidgetFactory");

dojo.require("xsltforms.WidgetFactory");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.SimpleTextarea");

(function() {
    var DojoWidget = dojo.declare(
            "xsltforms.elements.dojo.DojoWidget",
            xsltforms.Widget,
    {
        constructor: function(args) {
            dojo.safeMixin(this, args);
        },
        getInputControl: function() {
            return this.input;
        },
        getValue: function() {
            return this.input.get("value");            
        },
        setValue: function(value) {
            this.input.set("value", value);
        },
        click: function(target) {},
        changeReadonly: function() {
            this.input.set("readOnly", (!!this.control.readonly));            
        },
        dispose: function() {
            this.input.destroyRecursive();
            this.input = null;
            this.control = null;
            this.type = null;
            this.xform = null;
        }
    });
    
    var DojoCheckbox = dojo.declare(null, DojoWidget,
    {
        getValue: function() {
            return this.input.get("checked") ? "true" : "false";
        },
        setValue: function(value) {
            this.input.set("checked", "true" == value);
        }
    });
    
    function newDojoWidget(clazz, context, args, extraConstructorArgs) {
        var merged = dojo.mixin({
            xform: args.xform,
            control: args.control,
            type: context.schemaType
        }, extraConstructorArgs);
        
        return new clazz(merged);
    }
    
    function checkbox() {
        return function(context) {
            return function(args) {
                var input = new dijit.form.CheckBox({
                    "class": "xforms-value"
                });
                input.placeAt(args.parent, "only");
                
                var widget = newDojoWidget(DojoWidget, context, args, {
                    input: input
                });
                
                input.connect("onblur", args.events.blur);
                input.connect("onfocus", args.events.focus);
                
                if (args.inputMode) {
                    input.connect("onkeyup", args.events.keyUpInputMode);
                }
                if (args.incremental) {
                    input.connect("onkeyup", args.events.keyUpIncrementalActivate);
                } else {
                    input.connect("onkeyup", args.events.keyUpActivate);
                }
                
                return widget;
            };
        };
    }
    
    function simpleTextarea() {
        return function(context) {
            return function(args) {
                var Event = args.xform.getEventManager();
                
                var input = new dijit.form.SimpleTextarea({
                    "class": "xforms-value"
                });
                input.placeAt(args.parent, "only");
                
                var widget = newDojoWidget(DojoWidget, context, args, {
                    input: input,
                    focusControl: input
                });
                
                input.connect("onblur", args.events.blur);
                
                // For some reason we don't get proper focus events from Dojo;
                // we get focus events when the widget is clicked, but not when
                // it's tabbed into via the keyboard, so we instead subscribe
                // directly onto the focusNode of the widget using traditional
                // Event registration methods
                Event.attach(input.focusNode, "focus", args.events.focus);
                
                if (args.inputMode) {
                    input.connect("onkeyup", args.events.keyUpInputMode);
                }
                if (args.incremental) {
                    input.connect("onkeyup", args.events.keyUpInputMode);
                }
                
                return widget;
            };
        };
    }
    
    xsltforms.GLOBAL_WIDGET_REGISTRY.mergeClassRegistryDefinition({
        "input" : {
            "boolean" : {
                "#default" : checkbox()
            }
        },
        "textarea" : { // controlType
            "#default" : { // class
                "#default" : simpleTextarea()
            }
        }
    });
})();