dojo.provide("xsltforms.I8NManager");

dojo.require("xsltforms.XFAbstractObject");

(function() {
    var _LANGUAGES = [
        "cz", "de", "el", "en", "en_us", "es", "fr" , "gl", "it",
        "ja", "nb_no", "nl", "nn_no", "pt", "ro", "ru", "si", "sk"
    ];
    
    dojo.declare("xsltforms.I8NManager", xsltforms.XFAbstractObject,
    {
        messages : null,
        lang : null,

        get : function(key) {
            var configManager = this.xform.getConfigManager();
            
            if (!configManager.config) {
                return "Initializing";
            }
            
            var confLanguage =
                Core.selectSingleNodeText('language', configManager.config);
            
            if (Language == "navigator" || Language != confLanguage) {
                var lan = Language == "navigator" ?
                          (navigator.language || navigator.userLanguage)
                        : Core.selectSingleNodeText('language', configManager.config);
                lan = lan.replace("-", "_").toLowerCase();
                var finded = inArray(lan, _LANGUAGES);
                if (!finded) {
                    ind = lan.indexOf("_");
                    if (ind != -1) {
                        lan = lan.substring(0, ind);
                    }
                    finded = inArray(lan, _LANGUAGES);
                }
                if (finded) {
                    configManager.loadProperties("config_" + lan + ".xsl");
                    Language =
                        Core.selectSingleNodeText('language', configManager.config);
                } else {
                    Language = "default";
                }
            }
            return Core.selectSingleNodeText(key, configManager.config);
        },
        
        parse : function(str, pattern) {
            if (str == null || str.match("^\\s*$")) {
                return null;
            }

            if (!pattern) { pattern = this.get("format.datetime"); }
            var d = new Date();
            this._parse(d, "Year", str, pattern, "yyyy");
            this._parse(d, "Month", str, pattern, "MM");
            this._parse(d, "Date", str, pattern, "dd");
            this._parse(d, "Hours", str, pattern, "hh");
            this._parse(d, "Minutes", str, pattern, "mm");
            this._parse(d, "Seconds", str, pattern, "ss");

            return d;
        },
        
        format : function(date, pattern, loc) {
            if (!date) {
                return "";
            }

            if (!pattern) { pattern = this.get("format.datetime"); }

            var str = this._format(pattern, (loc ? date.getDate() : date.getUTCDate()), "dd");
            str = this._format(str, (loc ? date.getMonth() : date.getUTCMonth()) + 1, "MM");
            var y = (loc ? date.getFullYear() : date.getUTCFullYear());
            str = this._format(str, y < 1000? 1900 + y : y, "yyyy");
            str = this._format(str, (loc ? date.getSeconds() : date.getUTCSeconds()), "ss");
            str = this._format(str, (loc ? date.getMinutes() : date.getUTCMinutes()), "mm");
            str = this._format(str, (loc ? date.getHours() : date.getUTCHours()), "hh");
            var o = date.getTimezoneOffset();
            str = this._format(str, (loc ? (o < 0 ? "+" : "-")+zeros(Math.floor(Math.abs(o)/60),2)+":"+zeros(Math.abs(o) % 60,2) : "Z"), "z");

            return str;
        },

        parseDate : function(str) {
            return this.parse(str, this.get("format.date"));
        },

        formatDate : function(str) {
            return this.format(str, this.get("format.date"), true);
        },

        formatNumber : function(number, decimals) {
            if (isNaN(number)) { return number; }

            var value = "" + number;
            var index = value.indexOf(".");
            var integer = parseInt(index != -1? value.substring(0, index) : value);
            var decimal = index != -1? value.substring(index + 1) : "";
            var decsep = this.get("format.decimal");

            return integer
                + (decimals > 0? decsep + zeros(decimal, decimals, true) 
                : (decimal? decsep + decimal : ""));
        },

        parseNumber : function(value) {
            var decsep = this.get("format.decimal");

            if(!value.match("^[\\-+]?([0-9]+(\\" + decsep + "[0-9]*)?|\\" + decsep + "[0-9]+)$")) {
                throw "Invalid number " + value;
            }

            var index = value.indexOf(decsep);
            var integer = parseInt(index != -1? value.substring(0, index) : value);
            var decimal = index != -1? value.substring(index + 1) : null;
            
            return integer + (decimal? "." + decimal : "");
        },

        _format : function(returnValue, value, el) {
            return returnValue.replace(el, zeros(value, el.length));
        },
        
        _parse : function(date, prop, str, format, el) {
            var index = format.indexOf(el);
            
            if (index != -1) {
                format = format.replace(new RegExp("\\.", "g"), "\\.");
                format = format.replace(new RegExp("\\(", "g"), "\\(");
                format = format.replace(new RegExp("\\)", "g"), "\\)");
                format = format.replace(new RegExp(el), "(.*)");
                format = format.replace(new RegExp("yyyy"), ".*");
                format = format.replace(new RegExp("MM"), ".*");
                format = format.replace(new RegExp("dd"), ".*");
                format = format.replace(new RegExp("hh"), ".*");
                format = format.replace(new RegExp("mm"), ".*");
                format = format.replace(new RegExp("ss"), ".*");
                
                var val = str.replace(new RegExp(format), "$1");
                
                if (val.charAt(0) === '0') val = val.substring(1);
                
                val = parseInt(val);
            
                if (isNaN(val)) {
                    throw "Error parsing date " + str + " with pattern " + format;
                }

                var n = new Date();
                n = n.getFullYear() - 2000;
                date["set" + prop](prop == "Month"? val - 1 : (prop == "Year" && val <= n+10 ? val+2000 : val));
            }
        }
    })
})();