dojo.require("xsltforms");

dojo.require("xsltforms.XFAbstractObject");

(function() {
	var AbstractType = dojo.declare(null, {
		setSchema: function(schema) {
		this.schema = schema;
		return this;
	},
	setName: function(name) {
		this.name = name;
		this.nsuri = this.schema.ns;
		this.schema.types[name] = this;
		return this;
	},
	canonicalValue: function(value) {
		value = value.toString();

		switch (this.whiteSpace) {
		case "replace": value = value.replace(/[\t\r\n]/g, " "); break;
		case "collapse": value = value.replace(/[\t\r\n ]+/g, " ").replace(/^\s+|\s+$/g, ""); break;
		}

		return value;
	},
	getMaxLength: function() {
		return this.maxLength != null? this.maxLength 
				: (this.length != null? this.length
						: (this.totalDigits != null? this.totalDigits + 1 : null));
	},
	getDisplayLength: function() {
		return this.displayLength;
	}
	});

	var AtomicType = dojo.declare(AbstractType, {
		constructor: function() {
		this.patterns = [];
	},

	setBase: function(base) {
		var baseType = typeof base == "string"? this.schema.getType(base) : base;

		for (var id in baseType)  {
			var value = baseType[id];

			if (id == "patterns") {
				copyArray(value, this.patterns);
			} else if (id != "name" && id != "nsuri") {
				this[id] = value;
			}
		}

		return this;
	},

	put: function(name, value) {
		if (name == "base") {
			this.setBase(value);
		} else if (name == "pattern") {
			copyArray([value], this.patterns);
		} else {
			this[name] = value;
		}

		return this;
	},

	/** If valid return canonicalValue else null*/
	validate: function (value) {
		value = this.canonicalValue(value);

		for (var i = 0, len = this.patterns.length; i < len; i++) {
			if (!value.match(this.patterns[i])) {
				return false;
			}
		}

		if (this.enumeration != null) {
			var matched = false;

			for (var j = 0, len1 = this.enumeration.length; j < len1; j++) {
				if (value == this.canonicalValue(this.enumeration[j])) {
					matched = true;
					break;
				}
			}

			if (!matched) {
				return false;
			}
		}

		var l = value.length;
		var value_i = parseInt (value);

		if (   (this.length != null && this.length != l)
				|| (this.minLength != null && l < this.minLength)
				|| (this.maxLength != null && l > this.maxLength)
				|| (this.maxInclusive != null && value_i > this.maxInclusive)
				|| (this.maxExclusive != null && value_i >= this.maxExclusive)
				|| (this.minInclusive != null && value_i < this.minInclusive)
				|| (this.minExclusive != null && value_i <= this.minExclusive) ) {
			return false;
		}

		if (this.totalDigits != null || this.fractionDigits != null) {
			var index = value.indexOf(".");
			var integer = parseInt(index != -1? value.substring(0, index) : value);
			var decimal = index != -1? value.substring(index + 1) : "";

			if (index != -1) {
				if (this.fractionDigits == 0) {
					return false;
				}
				var dl = decimal.length - 1;
				for (; dl >= 0 && decimal.charAt(dl) == 0; dl--) {}
				decimal = decimal.substring(0, dl + 1);
			}

			if (   (this.totalDigits != null && integer.length + decimal.length > this.totalDigits)
					|| (this.fractionDigits != null && decimal.length > this.fractionDigits)) {
				return false;
			}
		}

		return true;
	},

	normalize: function (value) {
		if (this.fractionDigits != null) {
			var number = parseFloat(value);
			var num;

			if (isNaN(number)) {
				return "NaN";
			}

			if (number == 0) {
				num = zeros(0, this.fractionDigits + 1, true);
			}  else {
				var mult = zeros(1, this.fractionDigits + 1, true);
				num = "" + Math.round(number * mult);
			}

			if (this.fractionDigits != 0) {
				var index = num.length - this.fractionDigits;
				return (index == 0? "0" : num.substring(0, index)) + "." + num.substring(index);
			}

			return num;
		}

		return value;
	}
	});

	var ListType = dojo.declare(AbstractType, {
		constructor:function() {
		this.whiteSpace = "collapse";
	},

	setItemType: function(itemType) {
		this.itemType = typeof itemType == "string"? this.schema.getType(itemType) : itemType;
		return this;
	},

	validate: function (value) {
		var items = this.baseType.canonicalValue.call(this, value).split(" ");
		value = "";

		if (items.length == 1 && items[0] == "") {
			items = [];
		}

		for (var i = 0, len = items.length; i < len; i++) {
			var item = itemType.validate(items[i]);

			if (!item) {
				return null;
			}

			value += value.length === 0? item : " " + item;
		}

		if ( (this.length != null > 0 && this.length != 1) // !!! was l (lowercase L)
				|| (this.minLength != null && 1 < this.minLength)
				|| (this.maxLength != null && 1 > this.maxLength)) {
			return null;
		}

		return null;
	},

	canonicalValue: function(value) {
		var items = this.baseType.canonicalValue(value).split(" ");
		var cvalue = "";

		for (var i = 0, len = items.length; i < len; i++) {
			var item = this.itemType.canonicalValue(items[i]);
			cvalue += (cvalue.length === 0? "" : " ") + item;
		}

		return cvalue;
	}
	});

	var UnionType = dojo.declare(AbstractType, {
		constructor: function () {
		this.baseTypes = [];
	},

	addType: function(type) {
		this.baseTypes.push(typeof type == "string"? this.schema.getType(type) : type);
		return this;
	},

	validate: function (value) {
		for (var i = 0, len = this.baseTypes.length; i < len; ++i) {
			if (this.baseTypes[i].validate(value)) {
				return true;
			}
		}
		return false;
	}
	});

	var TypeDefs = {

		initAll : function(manager) {
			this.init("http://www.w3.org/2001/XMLSchema", this.Default, manager);
			this.init("http://www.w3.org/2002/xforms", this.XForms, manager);
			this.init("http://www.agencexml.com/xsltforms", this.XSLTForms, manager);
		},

			init : function(ns, list, manager) {
				var schema = manager.get(ns);
			
				for (var id in list) {
					var type = new AtomicType();
					type.setSchema(schema);
					type.setName(id);
					var props = list[id];
					var base = props.base;

					if (base) {
						type.setBase(base);
					}
				
					for (var prop in props) {
						if (prop != "base") {				
							type[prop] = props[prop];
						}
					}
				}
			},
			ctes : {
				i : "A-Za-z_\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\xFF",
				c : "A-Za-z_\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\xFF\\-\\.0-9\\xB7"
			}
		};
	
	TypeDefs.Default = {
			"string" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"whiteSpace" : "preserve"
			},

			"boolean" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^(true|false|0|1)$" ],
				"class" : "boolean"
			},

				

			"decimal" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[\\-+]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)$" ],
				"class" : "number",
				"format" : function(value) {
					return I8N.formatNumber(value, this.fractionDigits);
				},
				"parse" : function(value) {
					return I8N.parseNumber(value);
				}
			},

				

			"float" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^(([-+]?([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))([eE][-+]?[0-9]+)?|-?INF|NaN)$" ],
				"class" : "number"
			},

				

			"double" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^(([-+]?([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))([eE][-+]?[0-9]+)?|-?INF|NaN)$" ],
				"class" : "number"
			},

				

			"dateTime" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?$" ],
				"class" : "datetime",
				"displayLength" : 20,
				"format" : function(value) {
					return I8N.format(I8N.parse(value, "yyyy-MM-ddThh:mm:ss"),null, true);
				},
				"parse" : function(value) {
					return I8N.format(I8N.parse(value), "yyyy-MM-ddThh:mm:ss", true);
				}
			},

				

			"date" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?$" ],
				"class" : "date",
				"displayLength" : 10,
				"format" : function(value) {
					return I8N.formatDate(I8N.parse(value, "yyyy-MM-dd"));
				},
				"parse" : function(value) {
					return I8N.format(I8N.parseDate(value), "yyyy-MM-dd");
				}
			},

				

			"time" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?$" ],
				"displayLength" : 8,
				"class" : "time"
			},

				

			"duration" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^-?P(?!$)([0-9]+Y)?([0-9]+M)?([0-9]+D)?(T(?!$)([0-9]+H)?([0-9]+M)?([0-9]+(\\.[0-9]+)?S)?)?$" ]
			},

				

			"gDay" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^---(0[1-9]|[12][0-9]|3[01])$" ]
			},

				

			"gMonth" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^--(0[1-9]|1[012])$" ]
			},

				

			"gMonthDay" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^--(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$" ]
			},

				

			"gYear" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[-+]?([12][0-9]{3})$" ]
			},

				

			"gYearMonth" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^([12][0-9]{3})-(0[1-9]|1[012])$" ]
			},

				

			"integer" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:decimal",
				"fractionDigits" : "0"
			},

				

			"nonPositiveInteger" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"patterns" : [ "^([\\-][0-9]+|0)$" ]
			},

				

			"nonNegativeInteger" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"patterns" : [ "^[+]?[0-9]+$" ]
			},

				

			"negativeInteger" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"patterns" : [ "^[\\-][0-9]+$" ]
			},

				

			"positiveInteger" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"patterns" : [ "^[+]?0*[1-9][0-9]*$" ]
			},

				

			"byte" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"minInclusive" : -128,
				"maxInclusive" : 127
			},

				

			"short" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"minInclusive" : -32768,
				"maxInclusive" : 32767
			},

				

			"int" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"minInclusive" : -2147483648,
				"maxInclusive" : 2147483647
		},

				

			"long" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:integer",
				"minInclusive" : -9223372036854775808,
				"maxInclusive" : 9223372036854775807
		},

				

			"unsignedByte" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:nonNegativeInteger",
				"maxInclusive" : 255
			},

				

			"unsignedShort" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:nonNegativeInteger",
				"maxInclusive" : 65535
			},

				

			"unsignedInt" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:nonNegativeInteger",
				"maxInclusive" : 4294967295
			},

				

			"unsignedLong" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:nonNegativeInteger",
				"maxInclusive" : 18446744073709551615
		},

				

			"normalizedString" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"whiteSpace" : "replace"
			},

				

			"token" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"whiteSpace" : "collapse"
			},

				

			"language" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:token",
				"patterns" : [ "^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$" ]
			},

				

			"anyURI" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:token",
				"patterns" : [ "^(([^:\\/?#]+):)?(\\/\\/([^\\/\\?#]*))?([^\\?#]*)(\\?([^#]*))?(#([^\\:#\\[\\]\\@\\!\\$\\&\\\\'\(\\)\\*\\+\\,\\;\\=]*))?$" ]
			},

				

			"Name" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:token",
				"patterns" : [ "^[" + TypeDefs.ctes.i + ":][" + TypeDefs.ctes.c + ":]*$" ]
			},

				

			"NCName" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:token",
				"patterns" : [ "^[" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*$" ]
			},

				

			"QName" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:token",
				"patterns" : [ "^(([a-zA-Z][0-9a-zA-Z+\\-\\.]*:)?/{0,2}[0-9a-zA-Z;/?:@&=+$\\.\\>> -_!~*'()%]+)?(>> #[0-9a-zA-Z;/?:@&=+$\\.\\-_!~*'()%]+)?:[" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*$" ]
			},

				

			"ID" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:NCName"
			},

				

			"IDREF" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"base" : "xsd_:NCName"
			},

				

			"IDREFS" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*( +[" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*)*$" ]
			},

				

			"NMTOKEN" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[" + TypeDefs.ctes.c + "]+$" ]
			},

				

			"NMTOKENS" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[" + TypeDefs.ctes.c + "]+( +[" + TypeDefs.ctes.c + "]+)*$" ]
			},

				

			"base64Binary" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[a-zA-Z0-9+/]+$" ]
			},

				

			"hexBinary" : {
				"nsuri" : "http://www.w3.org/2001/XMLSchema",
				"patterns" : [ "^[0-9A-F]+$" ]
			}
		};


				

		TypeDefs.XForms = {

				

			"string" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"whiteSpace" : "preserve"
			},

				

			"boolean" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(true|false|0|1)?$" ],
				"class" : "boolean"
			},

				

			"decimal" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^([\\-+]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+))?$" ],
				"class" : "number",
				"format" : function(value) {
					return I8N.formatNumber(value, this.fractionDigits);
				},
				"parse" : function(value) {
					return I8N.parseNumber(value);
				}
			},

				

			"float" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^((([-+]?([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))([eE][-+]?[0-9]+)?|-?INF|NaN))?$" ],
				"class" : "number"
			},

				

			"double" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^((([-+]?([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))([eE][-+]?[0-9]+)?|-?INF|NaN))?$" ],
				"class" : "number"
			},

				

			"dateTime" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?)?$" ],
				"class" : "datetime",
				"displayLength" : 20,
				"format" : function(value) {
					return I8N.format(I8N.parse(value, "yyyy-MM-ddThh:mm:ss"), null, true);
				},
				"parse" : function(value) {
					return I8N.format(I8N.parse(value), "yyyy-MM-ddThh:mm:ss", true);
				}
			},

				

			"date" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(([12][0-9]{3})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?)?$" ],
				"class" : "date",
				"displayLength" : 10,
				"format" : function(value) {
					return I8N.formatDate(I8N.parse(value, "yyyy-MM-dd"));
				},
				"parse" : function(value) {
					return I8N.format(I8N.parseDate(value), "yyyy-MM-dd");
				}
			},

				

			"time" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\\.[0-9]+)?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?)?$" ],
				"displayLength" : 8
			},

				

			"duration" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(-?P(?!$)([0-9]+Y)?([0-9]+M)?([0-9]+D)?(T(?!$)([0-9]+H)?([0-9]+M)?([0-9]+(\\.[0-9]+)?S)?)?)?$" ]
			},

				

			"dayTimeDuration" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^([\-]?P([0-9]+D(T([0-9]+(H([0-9]+(M([0-9]+(\.[0-9]*)?S|\.[0-9]+S)?|(\.[0-9]*)?S)|(\.[0-9]*)?S)?|M([0-9]+(\.[0-9]*)?S|\.[0-9]+S)?|(\.[0-9]*)?S)|\.[0-9]+S))?|T([0-9]+(H([0-9]+(M([0-9]+(\.[0-9]*)?S|\.[0-9]+S)?|(\.[0-9]*)?S)|(\.[0-9]*)?S)?|M([0-9]+(\.[0-9]*)?S|\.[0-9]+S)?|(\.[0-9]*)?S)|\.[0-9]+S)))?$" ]
			},

				

			"yearMonthDuration" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^([\-]?P[0-9]+(Y([0-9]+M)?|M))?$" ]
			},

				

			"gDay" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(---(0[1-9]|[12][0-9]|3[01]))?$" ]
			},

				

			"gMonth" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(--(0[1-9]|1[012]))?$" ]
			},

				

			"gMonthDay" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(--(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))?$" ]
			},

				

			"gYear" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^([-+]?([12][0-9]{3}))?$" ]
			},

				

			"gYearMonth" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^(([12][0-9]{3})-(0[1-9]|1[012]))?$" ]
			},

				

			"integer" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:decimal",
				"fractionDigits" : "0"
			},

				

			"nonPositiveInteger" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"patterns" : [ "^(([\\-][0-9]+|0))?$" ]
			},

				

			"nonNegativeInteger" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"patterns" : [ "^([+]?[0-9]+)?$" ]
			},

				

			"negativeInteger" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"patterns" : [ "^([\\-][0-9]+)?$" ]
			},

				

			"positiveInteger" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"patterns" : [ "^[+]?0*[1-9][0-9]*$" ]
			},

				

			"byte" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"minInclusive" : -128,
				"maxInclusive" : 127
			},

				

			"short" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"minInclusive" : -32768,
				"maxInclusive" : 32767
			},

				

			"int" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"minInclusive" : -2147483648,
				"maxInclusive" : 2147483647
			},

				

			"long" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:integer",
				"minInclusive" : -9223372036854775808,
				"maxInclusive" : 9223372036854775807
			},

				

			"unsignedByte" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:nonNegativeInteger",
				"maxInclusive" : 255
			},

				

			"unsignedShort" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:nonNegativeInteger",
				"maxInclusive" : 65535
			},

				

			"unsignedInt" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:nonNegativeInteger",
				"maxInclusive" : 4294967295
			},

				

			"unsignedLong" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:nonNegativeInteger",
				"maxInclusive" : 18446744073709551615
			},

				

			"normalizedString" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"whiteSpace" : "replace"
			},

				

			"token" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"whiteSpace" : "collapse"
			},

				

			"language" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:token",
				"patterns" : [ "^([a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*)?$" ]
			},

				

			"anyURI" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:token",
				"patterns" : [ "^((([a-zA-Z][0-9a-zA-Z+\\-\\.]*:)?/{0,2}[0-9a-zA-Z;/?:@&=+$\\.\\>> -_!~*'()%]+)?(>> #[0-9a-zA-Z;/?:@&=+$\\.\\-_!~*'()%]+)?)?$" ]
			},

				

			"Name" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:token",
				"patterns" : [ "^([" + TypeDefs.ctes.i + ":][" + TypeDefs.ctes.c + ":]*)?$" ]
			},

				

			"NCName" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:token",
				"patterns" : [ "^([" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*)?$" ]
			},

				

			"QName" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:token",
				"patterns" : [ "^((([a-zA-Z][0-9a-zA-Z+\\-\\.]*:)?/{0,2}[0-9a-zA-Z;/?:@&=+$\\.\\>> -_!~*'()%]+)?(>> #[0-9a-zA-Z;/?:@&=+$\\.\\-_!~*'()%]+)?:[" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*)?$" ]
			},

				

			"ID" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:NCName"
			},

				

			"IDREF" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xforms:NCName"
			},

				

			"IDREFS" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^([" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]+( +[" + TypeDefs.ctes.i + "][" + TypeDefs.ctes.c + "]*)*)?$" ]
			},

				

			"NMTOKEN" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^[" + TypeDefs.ctes.c + "]*$" ]
			},

				

			"NMTOKENS" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^([" + TypeDefs.ctes.c + "]+( +[" + TypeDefs.ctes.c + "]+)*)?$" ]
			},

				

			"base64Binary" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^[a-zA-Z0-9+/]*$" ]
			},

				

			"hexBinary" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"patterns" : [ "^[0-9A-F]*$" ]
			},

				

			"email" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xsd_:string",
				"whiteSpace" : "collapse",
				"patterns" : [ "^([A-Za-z0-9!#-'\*\+\-/=\?\^_`\{-~]+(\.[A-Za-z0-9!#-'\*\+\-/=\?\^_`\{-~]+)*@[A-Za-z0-9!#-'\*\+\-/=\?\^_`\{-~]+(\.[A-Za-z0-9!#-'\*\+\-/=\?\^_`\{-~]+)*)?$" ]
			},

				

			"card-number" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xsd_:string",
				"minLength" : 12,
				"maxLength" : 19,
				"patterns" : [ "^[0-9]+$" ]
			},

				

			"url" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xsd_:string",
				"whiteSpace" : "collapse",
				"patterns" : [ "^(ht|f)tp(s?)://([a-z0-9]*:[a-z0-9]*@)?([a-z0-9.]*\\.[a-z]{2,7})$" ]
			},

				

			"amount" : {
				"nsuri" : "http://www.w3.org/2002/xforms",
				"base" : "xsd_:decimal",
				"format" : function(value) {
					return I8N.formatNumber(value, 2);
				}
			}
		};

				

		TypeDefs.XSLTForms = {

				

			"decimal" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"patterns" : [ "^[-+]?\\(*[-+]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)(([+-/]|\\*)\\(*([0-9]+(\\.[0-9]*)?|\\.[0-9]+)\\)*)*$" ],
				"class" : "number",
				"eval" : "xsd:decimal"
			},

				

			"float" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:float"
			},

				

			"double" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:double"
			},

				

			"integer" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:integer"
			},

				

			"nonPositiveInteger" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:nonPositiveInteger"
			},

				

			"nonNegativeInteger" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:nonNegativeInteger"
			},

				

			"negativeInteger" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:negativeInteger"
			},

				

			"positiveInteger" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:positiveInteger"
			},

				

			"byte" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:byte"
			},

				

			"short" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:short"
			},

				

			"int" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:int"
			},

				

			"long" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:long"
			},

				

			"unsignedByte" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:unsignedByte"
			},

				

			"unsignedShort" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:unsignedShort"
			},

				

			"unsignedInt" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:unsignedInt"
			},

				

			"unsignedLong" : {
				"nsuri" : "http://www.agencexml.com/xsltforms",
				"base" : "xsltforms:decimal",
				"eval" : "xsd:unsignedLong"
			}
		};

	dojo.declare(
			"xsltforms.schema.Schema",
			xsltforms.XFAbstractObject,
			{
				//	    constructor: function(manager, ns, name, prefixes) {
				constructor: function(args) {
				this.manager = args.manager;
				assert(args.ns && !this.manager.all[args.ns], 
				"Needed schema name or exists one schema with that namespace");
				if(this.manager.all[args.ns]) {
					this.xform.error(this, "xforms-link-exception", "More than one schema with the same namespace declaration");
					return;
				}
				this.name = args.name;
				this.ns = args.ns;
				this.types = {};
				this.prefixes = args.prefixes || {};
				this.manager.all[args.ns] = this;
			},

			getType: function(name) {
			    var manager = this.manager;
				if (name.indexOf(":") != -1) {
					var res = name.split(":");
					var prefix = res[0];
					var ns = this.prefixes[prefix];

					if (ns) {
						return manager.getTypeNS(ns, res[1]);
					}

					return manager.getType(name);
				}

				var type = this.types[name];

				if (!type) {
					alert("Type " + name + " not defined");
					throw "Error";
				}

				return type;
			},

			createAtomicType: function(args) {
				var atype = new AtomicType(args);
				atype.setSchema(this);
				return atype;
			},

			createListType: function(args) {
				var atype = new AtomicType(args);
				atype.setSchema(this);
				return atype;
			},

			createUnionType: function(args) {
				var atype = new AtomicType(args);
				atype.setSchema(this);
				return atype;
			}
			});

	dojo.declare(
			"xsltforms.schema.SchemaManager",
			xsltforms.XFAbstractObject,
			{
				constructor: function() {
				this.all = {};
				this.prefixes = {
						"xsd_" : "http://www.w3.org/2001/XMLSchema",
						"xsd" : "http://www.w3.org/2001/XMLSchema",
						"xforms" : "http://www.w3.org/2002/xforms",
						"xsltforms" : "http://www.agencexml.com/xsltforms"
				};
				TypeDefs.initAll(this);
			},

			getType: function(name) {
				var res = name.split(":");
				if (typeof(res[1]) == "undefined") {
					return this.getTypeNS(this.prefixes["xforms"], res[0]);
				} else {
					return this.getTypeNS(this.prefixes[res[0]], res[1]);
				}
			},

			getTypeNS: function(ns, name) {
				var schema = this.all[ns];

				if (!schema) {
					alert("Schema for namespace " + ns + " not defined for type " + name);
					throw "Error";
				}

				var type = schema.types[name];	

				if (!type) {
					alert("Type " + name + " not defined in namespace " + ns);
					throw "Error";
				}

				return type;
			},

			get: function(ns) {
				var schema = this.all[ns];

				if (!schema) {
					schema = new xsltforms.schema.Schema({
						xform: this.xform,
						manager: this,
						ns: ns
					});

					return schema;
				}
			},

			registerPrefix: function(prefix, namespace) {
				this.prefixes[prefix] = namespace;
			}
			});
})();

dojo.provide("xsltforms.schema");
