dojo.provide("xsltforms.submission");

dojo.require("xsltforms.XFAbstractObject");

(function() {

    var EXAMPLE_CONTEXT = {
            resource: "http://foo/bar/action",
            method: "GET",
            serialization: "none",
            synchr: true,
            mediatype: "application/xml"
    };
    
    var EXAMPLE_MATCHERS = [
        { "uri-scheme": ["http", "https"]},
    ];
    
    function _resolveSchemaForContext(context) {
        var scheme = null;
        try
        {
            if (!!context._uriScheme) return context._uriScheme;
            
            if (!!context.resource) {
                var url = new dojo._Url(context.resource);
                scheme = url.scheme;
                context._uriScheme = scheme;
            }
        } catch (e) {}
        return scheme;
    };
    
    var matcher = xsltforms.submission.matcher = function(predicate, factory) {
        return function(context) {
            return predicate(context) ? factory(context) : null;
        };
    };
    
    var compose = xsltforms.submission.compose = function() {
        var predicates = new Array(arguments.length);
        copyArray(arguments, predicates);
        
        return function(context) {
            for (var ii = 0, len = predicates.length; ii < len; ii++) {
                if (!predicates[ii](context)) return false;
            };
            return true;
        };
    };
    
    xsltforms.submission.URISchemeMatcher = function(args, factory) {
        var original = args.scheme || args.schemes;
        var schemes = null;

        if (!dojo.isArrayLike(original)) {
            schemes = [original];
        } else {
            schemes = new Array(original.length);
            copyArray(original, schemes);
        }

        var predicate = function(context) {
            var scheme = _resolveSchemaForContext(context);
            return inArray(scheme, schemes);
        };
        
        return matcher(predicate, factory);
    };
    
    dojo.declare("xsltforms.submission.SubmissionRegistry",
            xsltforms.XFAbstractObject,
    {
        constructor: function(args) {
            this._matchers = [];
        },
        
        registerMatcher: function(matcher) {
            this._matchers.splice(0, 0, matcher);
        },
        
        createSubmission: function(context) {
            for (var ii = 0; ii < this._matchers.length; ii++) {
                var result = this._matchers[ii](context);
                if (!!result) return result;
            }
            return null;
        }
    });
    
})();