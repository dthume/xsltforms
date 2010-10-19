dojo.provide("xsltforms.WidgetFactory");

(function() {
    var exampleContext = {
        "controlType": "input",
        "schemaType": { nsuri: "http://some/namespace/uri", name: "tName"},
        "appearance": "full",
        "inputMode": "predictive"
    };
    
    function newInputFactory(name, content, clase, postProcessor) {
        return function(context) {
            return function(args) {
                var widget =
                    Core.createElement("input", args.parent, content, clase); 
                widget.type = name;
                
                if (!!postProcessor) postProcessor(widget, args);
                
                return widget;
            }
        }
    }
    
    var exampleHeirarchy = {
        "input" : { // controlType
            "#default" : { // class
                    "#default" : newInputFactory("input", null, "xforms-value")
                }
            }
        }
    }
    
    var _DEFAULT = "#default";

    function createPath(context) {
        var clase = context.schemaType["class"] || "#default";
        
        return [context.controlType, clase, context.appearance];
    }
    
    dojo.declare("xsltforms.SimpleWidgetRegistry", null,
    {
        isXFWidgetRegistry: true,
        
        constructor: function(args) {
            this._defs = { };
        },
        
        lookupWidget: function(context) {
            var path = createPath(context);
            var current = this._defs;
            
            dojo.forEach(path, function(component) {
                current = current.hasOwnProperty(component) ?
                          current[component]
                        : current[_DEFAULT];
                if (!!current) {
                    throw new Error("Failed to lookup widget for context: " +
                            context);
                }
            });
            
            return current;
        },
        
        registerWidget: function(context, widget) {
            var path = createPath(context);
            var current = this._defs;
                    
            dojo.forEach(path, function(component) {
                if (!current.hasOwnProperty(component)) {
                    current[component] = {};
                }
                current = current[component];
            });
           
            return current;
        }
    }
    
    dojo.declare("xsltforms.DefaultingWidgetRegistry", null,
    {
        isXFWidgetRegistry: true,
        
        constructor: function(args) {
            this._delegate = args.delegate;
        },
        
        lookupWidget: function(context) {
            return this._delegate.lookupWidget(dojo.mixin({
                "schemaType": { nsuri: "#default", name: "#default" },
                "appearance": _DEFAULT,
                "inputMode": _DEFAULT
            }, context));
        }
    });
})();