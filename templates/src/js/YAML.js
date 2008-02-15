// -*- java -*-
/**********************************************************************
 *
 * derived from yaml_dumper.js
 * $Id: YAML.js,v 1.2 2004/07/28 00:31:11 rhundt Exp $
 *
 * (c) 2002 Slaven Rezic. 
 * This program is free software; you can redistribute it and/or modify
 * it under the same terms as Perl.
 *
 **********************************************************************/
var YAML_DEBUG = 0;
// detect javascript implementation
var YAML_JS;
if (typeof VM != "undefined") {
    YAML_JS = "njs";
} else if (typeof navigator != "undefined" && navigator.appName == "Netscape") {
    if (navigator.appVersion.indexOf("4.") == 0) { // no check for 3.
	YAML_JS = "js1.3"; // ???
    } else {
	YAML_JS = "js1.4";
    }
} else {
    // mozilla standalone?
    YAML_JS = "js1.4"; // XXX differentiate!
}

// Context constants
var YAML_LEAF = 1;
var YAML_COLLECTION = 2;
var YAML_KEY = 3;
var YAML_FROMARRAY = 5;
var YAML_VALUE = "\x07YAML\x07VALUE\x07";
var YAML_COMMENT = "\x07YAML\x07COMMENT\x07";

// Common YAML character sets
var YAML_ESCAPE_CHAR;
if (YAML_JS == "njs") { // workaround njs 0.2.5 bug (?)
    YAML_ESCAPE_CHAR = "[";
    for(var i=0x00; i<=0x08; i++) { YAML_ESCAPE_CHAR += String.fromCharCode(i); }
    for(var i=0x0b; i<=0x1f; i++) { YAML_ESCAPE_CHAR += String.fromCharCode(i); }
    YAML_ESCAPE_CHAR += "]";
} else {
    YAML_ESCAPE_CHAR = "[\\x00-\\x08\\x0b-\\x1f]";
}
var YAML_FOLD_CHAR = ">";
var YAML_BLOCK_CHAR = "|";

YAML_Indent         = 2;
YAML_UseHeader      = true;
YAML_UseVersion     = true;
YAML_SortKeys       = true;
YAML_AnchorPrefix   = "";
YAML_UseCode        = false;
YAML_DumpCode       = "";
YAML_LoadCode       = "";
YAML_ForceBlock     = false;
YAML_UseBlock       = false;
YAML_UseFold        = false;
YAML_CompressSeries = true;
//XXX NYI  YAML_InlineSeries   = false;
YAML_UseAliases     = true;
YAML_Purity         = false;
YAML_DateClass      = "";

function YAML() {
    this.stream         = "";
    this.level          = 0;
    this.anchor         = 1;
    this.Indent         = YAML_Indent;
    this.UseHeader      = YAML_UseHeader;
    this.UseVersion     = YAML_UseVersion;
    this.SortKeys       = YAML_SortKeys;
    this.AnchorPrefix   = YAML_AnchorPrefix;
    this.DumpCode       = YAML_DumpCode;
    this.LoadCode       = YAML_LoadCode;
    this.ForceBlock     = YAML_ForceBlock;
    this.UseBlock       = YAML_UseBlock;
    this.UseFold        = YAML_UseFold;
    this.CompressSeries = YAML_CompressSeries;
    //XXX NYI    this.InlineSeries   = YAML_InlineSeries;
    this.UseAliases     = YAML_UseAliases;
    this.Purity         = YAML_Purity;
    this.DateClass      = YAML_DateClass;

    // methods
    this.dump  = YAML_dump;
    this.dump1 = YAML_dump1;
    this._emit_header = YAML_emit_header;
    this._emit_node = YAML_emit_node;
    this._emit_mapping = YAML_emit_mapping;
    this._emit_sequence = YAML_emit_sequence;
    this._emit_str = YAML_emit_str;
    this._emit_key = YAML_emit_key;
    this._emit_nested = YAML_emit_nested;
    this._emit_simple = YAML_emit_simple;
    this._emit_double = YAML_emit_double;
    this._emit_single = YAML_emit_single;
    this._emit_function = YAML_emit_function;
    this._emit_regexp = YAML_emit_regexp;
    this.is_valid_implicit = YAML_is_valid_implicit;
    this.indent = YAML_indent;

    // parsing magic added by Richard Hundt (richard<at>aywen.com)
    this.load = YAML_load;
    this._parse = YAML_parse;
    this._parse_node = YAML_parse_node;
    this._parse_qualifiers = YAML_parse_qualifiers;
    this._parse_explicit = YAML_parse_explicit;
    this._parse_mapping = YAML_parse_mapping;
    this._parse_seq = YAML_parse_seq;
    this._parse_inline = YAML_parse_inline;
    this._parse_inline_mapping = YAML_parse_inline_mapping;
    this._parse_inline_seq = YAML_parse_inline_seq;
    this._parse_inline_double_quoted = YAML_parse_inline_double_quoted;
    this._parse_inline_single_quoted = YAML_parse_inline_single_quoted;
    this._parse_inline_simple = YAML_parse_inline_simple;
    this._parse_implicit = YAML_parse_implicit;
    this._parse_unfold = YAML_parse_unfold;
    this._parse_block = YAML_parse_block;
    this._parse_throwaway_comments = YAML_parse_throwaway_comments;
    this._parse_next_line = YAML_parse_next_line;
    this.unescape_innerHTML = YAML_unescape_innerHTML;
}

function YAMLDump() {
    var o = new YAML();
    return o.dump(arguments);
}

function YAML_dump1(arg) {
    return this.dump([arg]);
}

function YAML_dump(args) {
    this.stream   = "";
    this.document = 0;

    for(var doc_i = 0; doc_i < args.length; doc_i++) {
	var doc = args[doc_i];
	this.document++;
	this.transferred = {};
	this.id_refcnt   = {};
	this.id_anchor   = {};
	this.anchor      = 1;
	this.level       = 0;
	this.offset      = [0 - this.Indent];
	this._emit_header(doc);
	this._emit_node(doc);
    }

    return this.stream;
}

function YAML_emit_header(node) {
    if (!this.UseHeader && this.document == 1) {
	// XXX croak like in the perl version?
	this.headless = true;
	return;
    }
    this.stream += "---";
    if (this.UseVersion) {
	this.stream += " #YAML:1.0";
    }
}

function YAML_emit_node(node, context) {
    if (typeof context == "undefined") context = 0;

    if (typeof node == "undefined" || node == null) {
	return this._emit_str(null);
    } else if (typeof node == "#array") { // njs array
	return this._emit_sequence(node);
    } else if (typeof node == "object") { // mozilla array & object
	var is_a_mapping = false;
	var is_empty = true;
	for (var i in node) {
	    is_empty = false;
	    if (isNaN(i)) {
		is_a_mapping = true;
		break;
	    }
	}
	if (!is_empty) {
	    if (is_a_mapping) {
		return this._emit_mapping(node, context);
	    } else {
		return this._emit_sequence(node);
	    }
	} else {
	    if (typeof node.length != "undefined") {
		return this._emit_sequence(node, context);
	    } else {
		return this._emit_mapping(node, context);
	    }
	}
    } else if (typeof node == "function") {
	if (String(node).indexOf("/") == 0) {
	    return this._emit_regexp(node);
	} else {
	    return this._emit_function(node);
	}
    } else if (typeof node == "string" || typeof node == "boolean") {
	return this._emit_str(node);
    } else {
	return this._emit_str(String(node));
    }
}

function YAML_emit_mapping(value, context) {
    var keys = new Array;
    for(var key in value) {
	keys[keys.length] = key;
    }

    if (keys.length == 0) { // empty hash
	this.stream += " {}\n";
	return;
    }

    if (context == YAML_FROMARRAY && this.CompressSeries) {
        this.stream += " ";
	this.offset[this.level+1] = this.offset[this.level] + 2;
    } else {
        context = 0;
	if (!this.headless) {
	    this.stream += "\n";
	    this.headless = false;
	}
	this.offset[this.level+1] = this.offset[this.level] + this.Indent;
    }
    
    if (this.SortKeys) {
	keys.sort(YAML_cmp_strings);
    }
	
    this.level++;
    for(var key_i = 0; key_i < keys.length; key_i++) {
	var key = keys[key_i];
        this._emit_key(key, context);
        context = 0;
        this.stream += ":";
        this._emit_node(value[key]);
    }
    this.level--;
}

function YAML_emit_sequence(value) {
    if (value.length == 0) {
	this.stream += " []\n";
	return;
    }

    if (!this.headless) {
	this.stream += "\n";
	this.headless = false;
    }

    // XXX NYI InlineSeries

    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;
    for(var i = 0; i < value.length; i++) {
	this.stream += YAML_x(" ", this.offset[this.level]);
	this.stream += "-";
	this._emit_node(value[i], YAML_FROMARRAY);
    }
    this.level--;
}

function YAML_emit_key(value, context) {
    if (context != YAML_FROMARRAY) {
	this.stream += YAML_x(" ", this.offset[this.level]);
    }
    this._emit_str(value, YAML_KEY);
}

function YAML_emit_str(value, type) {
    if (typeof type == "undefined") type = 0;

    // Use heuristics to find the best scalar emission style.
    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;

    if (value != null &&
	typeof value != "boolean" &&
	value.match(new RegExp(YAML_ESCAPE_CHAR)) == null &&
	(value.length > 50 || value.match(/\n[ \f\n\r\t\v]/) != null ||
	 (this.ForceBlock && type != YAML_KEY)
	 )
	) {
	this.stream += (type == YAML_KEY ? "? " : " ");
	if ((this.UseFold && !this.ForceBlock) ||
	    value.match(/^[^ \f\n\r\t\v][^\n]{76}/) != null
	    ) {
            if (this.is_valid_implicit(value)) {
                this.stream += "! ";
            }
            this._emit_nested(YAML_FOLD_CHAR, value);
        } else {
            this._emit_nested(YAML_BLOCK_CHAR, value);
        }
        this.stream += "\n";
    } else {
	if (type != YAML_KEY) {
	    this.stream += " ";
	}
        if        (value != null && value == YAML_VALUE) {
            this.stream += "=";
        } else if (YAML_is_valid_implicit(value)) {
            this._emit_simple(value);
        } else if (value.match(new RegExp(YAML_ESCAPE_CHAR + "|\\n|\\'")) != null) {
            this._emit_double(value);
        } else {
            this._emit_single(value);
        }
	if (type != YAML_KEY) {
	    this.stream += "\n";
	}
    }
    
    this.level--;
}

function YAML_is_valid_implicit(value) {
    if (   value == null
	|| typeof value == "number"       // !int or !float (never reached)
	|| typeof value == "boolean"      // !int or !float (never reached)
	|| value.match(/^(-?[0-9]+)$/) != null       // !int
	|| value.match(/^-?[0-9]+\.[0-9]+$/) != null    // !float
	|| value.match(/^-?[0-9]+e[+-][0-9]+$/) != null // !float
	   ) {
	return true;
    }
    if (   value.match(new RegExp(YAML_ESCAPE_CHAR)) != null
	|| value.match(/(^[ \f\n\r\t\v]|\:( |$)|\#( |$)|[ \f\n\r\t\v]$)/) != null
	|| value.indexOf("\n") >= 0
	) {
	return false;
    }
    if (value.charAt(0).match(/[A-Za-z0-9_]/) != null) { // !str
	return true;
    }
    return false;
}

function YAML_emit_nested(indicator, value) {
    this.stream += indicator;

    var end = value.length - 1;
    var newlines_end = 0;
    while(end >= 0 && value.charAt(end) == "\n") {
	newlines_end++;
	if (newlines_end > 1) break;
	end--;
    }

    var chomp = (newlines_end > 0 ? (newlines_end > 1 ? "+" : "") : "-");
    if (value == null) {
	value = "~";
    }
    this.stream += chomp;
    if (value.match(/^[ \f\n\r\t\v]/) != null) {
	this.stream += this.Indent;
    }
    if (indicator == YAML_FOLD_CHAR) {
        value = YAML_fold(value);
	if (chomp != "+") {
	    value = YAML_chop(value);
	}
    }
    this.stream += this.indent(value);
}

function YAML_emit_simple(value) {
    if (typeof value == "boolean") {
	this.stream += value ? "+" : "-";
    } else {
	this.stream += value == null ? "~" : value;
    }
}

function YAML_emit_double(value) {
    var escaped = YAML_escape(value);
    escaped = escaped.replace(/\"/g, "\\\"");
    this.stream += "\"" + escaped + "\"";
}

function YAML_emit_single(value) {
    this.stream += "'" + value + "'";
}

function YAML_emit_function(value) {
    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;
    this.stream += " !javascript/code: ";
    this._emit_nested(YAML_BLOCK_CHAR, String(value));
    this.stream += "\n";
    this.level--;
}

function YAML_emit_regexp(value) {
    this.offset[this.level + 1] = this.offset[this.level] + this.Indent;
    this.level++;
    this.stream += " !javascript/regexp:";
    this.level--; // XXX somewhat hackish
    var rx = {MODIFIERS: (value.global ? "g" : "")
	                 + (value.ignoreCase ? "i" : "")
	                 + (value.multiline ? "m" : ""),
	      REGEXP:    value.source
    };
    this._emit_mapping(rx,0);
}

function YAML_indent(text) {
    if (text.length == 0) return text;
    if (text.charAt(text.length-1) == "\n")
	text = text.substr(0, text.length-1);
    var indent = YAML_x(" ", this.offset[this.level]);

    if (YAML_JS == "js1.3") {
	var text_a = text.split("\n");
	var res = [];
	for(var i = 0; i < text_a.length; i++) {
	    res[res.length] = text_a[i].replace(/^/, indent);
	} 
	text = res.join("\n");
    } else {
	var rx = (YAML_JS == "njs" ? new RegExp("^(.)", "g") : new RegExp("^(.)", "gm"));
	text = text.replace(rx, indent+"$1");
    }

    text = "\n" + text;
    return text;
}

function YAML_fold(text) {
    var folded = "";
    text = text.replace(/^([^ \f\n\r\t\v].*)\n(?=[^ \f\n\r\t\v])/g, RegExp.$1 + "\n\n");
    while (text.length > 0) {
        if        (text.match(/^([^\n]{0,76})(\n|\Z)/) != null) {
	    text = text.replace(/^([^\n]{0,76})(\n|\Z)/, "");
            folded += RegExp.$1;
        } else if (text.match(/^(.{0,76})[ \f\n\r\t\v]/) != null) { 
	    text = text.replace(/^(.{0,76})[ \f\n\r\t\v]/, "");
            folded += RegExp.$1;
        } else {
	    // XXX croak?
	    text = text.replace(/(.*?)([ \f\n\r\t\v]|\Z)/, "");
            folded += RegExp.$1;
        }
        folded += "\n";
    }
    return folded;
}

YAML_escapes =
    ["\\z",   "\\x01", "\\x02", "\\x03", "\\x04", "\\x05", "\\x06", "\\a",
     "\\x08", "\\t",   "\\n",   "\\v",   "\\f",   "\\r",   "\\x0e", "\\x0f",
     "\\x10", "\\x11", "\\x12", "\\x13", "\\x14", "\\x15", "\\x16", "\\x17",
     "\\x18", "\\x19", "\\x1a", "\\e",   "\\x1c", "\\x1d", "\\x1e", "\\x1f",
    ];

function YAML_escape(text) {
    text = text.replace(/\\/g, "\\\\");
    var new_text = "";
    for(var i = 0; i < text.length; i++) {
	if (text.charCodeAt(i) <= 0x1f) {
	    new_text += YAML_escapes[text.charCodeAt(i)];
	} else {
	    new_text += text.charAt(i);
	}
    }
    return new_text;
}

function YAML_x(s,n) {
    var ret = "";
    for (var i=1; i<=n; i++) {
	ret += s;
    }
    return ret;
}

function YAML_chop(s) {
    return s.substr(0, s.length-1);
}

function YAML_cmp_strings(a,b) {
    a = String(a);
    b = String(b);
    if (a < b) return -1;
    if (a > b) return +1;
    return 0;
}

//=============================================================================
// load stuff follows - (c) 2004 Richard Hundt richard@aywen.com 
// var oYAML = new YAML();
// 
// oYAML.load(yaml_string);
//    this returns either a single data structure if there is only one document
//    otherwise returns a list - alternatively you can say:
// var myDoc = oYAML.documents[n];
//
// NOTE: if you're getting your yaml string with innerHMTL, you need to use
//    var yaml_string = YAML_unescape_innerHTML(myInnerHTMLstring) because the
//    UA will turn '&' into &amp; and '>' into &gt; - this may be fixed in
//    future versions
//
// TODO:
//    - more thorough testing (especially inline parsing)
//    - implement JavaScript code deparse
//    - implement JavaScript RegExp explicit type
//    - make the error handling (croak and warn) produce more useful errors
//=============================================================================
function YAML_load(stream) {
    this.stream = stream;
    return this._parse();
}

function YAML_parse() {
    this.stream.replace(/\015\012/g,"\012");
    this.stream.replace(/\015/g, "\012");
    this.line = 0;
    this.lines = this.stream.split(/\x0a/);
    this.line = 1;
    this.document = 0;
    this.documents = [ ];
    // Add an "assumed" header if there is no header and the stream is
    // not empty (after initial throwaways).
    if (!this.eos) {
        if (!/^---(\s|$)/.test(this.lines[0])) {
            this.lines.unshift('--- #YAML:1.0');
            this.line--;
        }
    }
    // Main Loop. Parse out all the top level nodes and return them.
    while (!this.eos) {
        this.anchor2node = {};
        this.document++;
        this.done = 0;
        this.level = 0;
        this.offset = [-1];
        if (this.lines[0].match(/^---\s*(.*)$/)) {
            var words = RegExp.$1.split(/\s+/);
            var directives = { };
            while (words.length && (words[0].match(/^#(\w+):(\S.*)$/))) {
                var key = RegExp.$1, value = RegExp.$2;
                words.shift();
                if (typeof directives[key] != 'undefined') {
		    continue;
                }
                directives[key] = value;
            }
            this.preface = words.join(' ');
        }
        else {
            croak('YAML_PARSE_ERR_NO_SEPARATOR '+this.lines);
        }
        if (!this.done) {
            this._parse_next_line(YAML_COLLECTION);
        }
        if (this.done) {
            this.indent = -1;
            this.content = '';
        }
        directives['YAML'] = directives['YAML'] || '1.0';
        directives['TAB'] = directives['TAB'] || 'NONE';
	var m = directives['YAML'].split(/\./);
	this.major_version = m[0];
	this.minor_version = m[1];

	if (this.major_version != '1')
	    croak('YAML_PARSE_ERR_BAD_MAJOR_VERSION '+directives['YAML']);
	if (this.minor_version != '0')
	    warn('YAML_PARSE_WARN_BAD_MINOR_VERSION '+directives['YAML']);
	if (!/^(NONE|\d+)(:HARD)?$/.test(directives['TAB']))
	    croak("Unrecognized TAB policy "+directives['TAB']);

	this.documents.push(this._parse_node());
    }
    return this.documents.length > 1 ? this.documents : this.documents[0];
}

function YAML_parse_node() {
    var preface = this.preface;
    this.preface  = '';
    var node      = '',
	type      = '',
	indicator = '',
	escape    = '',
	chomp     = '',
	anchor    = '',
	alias     = '',
	explicit  = '',
	implicit  = '',
	_class    = '';
    var m = this._parse_qualifiers(preface);
    anchor   = m[0] || 0;
    alias    = m[1] || 0;
    explicit = m[2] || 0;
    implicit = m[3] || 0;
    _class   = m[4] || 0;
    preface  = m[5] || 0;
    if (anchor) {
        this.anchor2node[anchor] = new YAML_anchor2node();
    }
    this.inline = '';
    while (preface.length) {
        var line = this.line - 1;

        if (preface.match(/^(>|\|)(-|\+)?\d*\s*/)) {
	    indicator = RegExp.$1;
	    preface = preface.replace(/^(>|\|)(-|\+)?\d*\s*/, '');
	    if (typeof RegExp.$2 != 'undefined') {
		chomp = RegExp.$2;
	    }
        }
        else {
            if (indicator) croak('YAML_PARSE_ERR_TEXT_AFTER_INDICATOR');
            this.inline = preface;
            preface = '';
        }
    }
    if (alias) {
	if (typeof this.anchor2node[alias] == 'undefined') {
	    croak('YAML_PARSE_ERR_NO_ANCHOR '+alias);
	}
        if (this.anchor2node[alias].constructor != YAML_anchor2node) {
            node = this.anchor2node[alias];
        }
        else {
            node = "*"+alias;
	    this.anchor2node[alias].push([node, this.line]);
        }
    }
    else if (this.inline.length) {
        node = this._parse_inline(1, implicit, explicit, _class);
        if (this.inline.length) {
            croak('YAML_PARSE_ERR_SINGLE_LINE');
        }
    }
    else if (indicator == YAML_BLOCK_CHAR) {
        this.level++;
        node = this._parse_block(chomp);
	if (implicit) {
	    node = this._parse_implicit(node);
	}
        this.level--; 
    }
    else if (indicator == YAML_FOLD_CHAR) {
        this.level++;
        node = this._parse_unfold(chomp);
	if (implicit) {
	    node = this._parse_implicit(node);
	}
        this.level--;
    }
    else {
        this.level++;
        this.offset[this.level] = this.offset[this.level] || 0;
        if (this.indent == this.offset[this.level]) {
            if (/^-( |$)/.test(this.content)) {
                node = this._parse_seq(anchor);
            }
            else if (/(^\?|\:( |$))/.test(this.content)) {
                node = this._parse_mapping(anchor);
            }
            else if (/^\s*$/.test(preface)) {
                node = this._parse_implicit('');
            }
            else {
                croak('YAML_PARSE_ERR_BAD_NODE');
            }
        }
        else {
            node = '';
        }
        this.level--;
    }
    this.offset = this.offset.slice(0, this.level+1);

    print_STDERR("@@@ offset => "+this.offset+", level => "+this.level);

    if (explicit) {
        if (_class) {
	    // perhaps we need to create an instance here...
	    // var _inst = new window[_class]; 
	    // for (var x in _inst) { node[x] = _inst[x] }; // dunno...
	    window[_class].apply(node, [ ]);
        }
        else {
            node = this._parse_explicit(node, explicit);
        }
    }
    if (anchor) {
        if (this.anchor2node[anchor].constructor == YAML_anchor2node) {
            // XXX Can't remember what this code actually does
            /* yeah, well if you don't know, how the hell should I know? */
	    for (var x = 0; x < this.anchor2node[anchor].length; x++) {
                try {
		    this.anchor2node[anchor][x] = node;
		} catch(ex) {
		    warn('YAML_LOAD_WARN_UNRESOLVED_ALIAS '+anchor+' '+node);
		}
            }
        }
        this.anchor2node[anchor] = node;
    }
    return node;
}

function YAML_parse_qualifiers(preface) {
    var anchor   = '', 
	alias    = '', 
	explicit = '', 
	implicit = '', 
	_class   = '', 
	token    = '';
    this.inline  = '';
    while (/^[&*!]/.test(preface)) {
        var line = this.line - 1;
        if (preface.match(/^\!(\S+)\s*/)) {
	    if (explicit) {
		croak('YAML_PARSE_ERR_MANY_EXPLICIT');
	    }
	    preface = preface.replace(/^\!(\S+)\s*/, '');
            explicit = RegExp.$1;
        }
        else if (/^\!\s*/.test(preface)) {
	    preface = preface.replace(/^\!\s*/, '');
	    if (implicit) {
		croak ('YAML_PARSE_ERR_MANY_IMPLICIT');
	    }
            implicit = 1;
        }
        else if (preface.match(/^\&([^ ,:]+)\s*/)) {
	    preface = preface.replace(/^\&([^ ,:]+)\s*/, '');
            token = RegExp.$1;
	    if (!/^[a-zA-Z0-9]+$/.test(token)) {
		croak('YAML_PARSE_ERR_BAD_ANCHOR: token => '+token);
	    }
	    alias && croak('YAML_PARSE_ERR_MANY_ANCHOR');
	    alias && croak('YAML_PARSE_ERR_ANCHOR_ALIAS');
            anchor = token;
        }
        else if (preface.match(/^\*([^ ,:]+)\s*/)) {
            token = RegExp.$1;
	    preface = preface.replace(/^\*([^ ,:]+)\s*/, '');
	    if (!/^[a-zA-Z0-9]+$/.test(token)) {
		croak('YAML_PARSE_ERR_BAD_ALIAS');
	    }
            alias && croak('YAML_PARSE_ERR_MANY_ALIAS');
            anchor && croak('YAML_PARSE_ERR_ANCHOR_ALIAS');
            alias = token;
        }
    }
    return [anchor, alias, explicit, implicit, _class, preface];
}

function YAML_parse_implicit(value) {
    value = value.replace(/\s*$/, '');
    if (value == '')
	return value;
    if (/^-?\d+$/.test(value))
	return value;

    if (value.match(/^[+-]?(\d*)(?:\.(\d*))?([Ee][+-]?\d+)?$/)) {
	if (typeof RegExp.$3 != 'undefined' ? 
	    typeof RegExp.$1 != 'undefined' : 
	    typeof RegExp.$1 != 'undefined' || 
	    typeof RegExp.$2 != 'undefined')
	    return value * 1.0;
    }
    if (/^\d{4}\-\d\d\-\d\d(T\d\d:\d\d:\d\d(\.\d*[1-9])?(Z|[-+]\d\d(:\d\d)?))?$/.test(value))
	return value+"";
    if (/^\w/.test(value))
	return value+"";
    if (/^~$/.test(value))
	return null;
    if (/^\+$/.test(value)) 
	return 1;
    if (/^-$/.test(value))
	return 0;
	if (/^[^\[\]\{\}]+$/.test(value))
	return value; // XXX - cwest
    croak('YAML_PARSE_ERR_BAD_IMPLICIT '+value);
}

function YAML_parse_explicit(node, explicit) {
    if (explicit.match(/^(int|float|bool|date|time|datetime|binary)$/)) {
        var handler = "YAML_load_"+RegExp.$1;
        return window[handler](node);
    } 
    // this is still Perl legacy code for specifying a class eg. My::Class
    // but is here as handy reminder - you're welcome to fix it :) - XXX
    else if (explicit.match(/^javascript\/(regexp|code)\:(\w(\w|\:\:)*)?$/)) {
        var type = RegExp.$1 || '', _class = RegExp.$2 || '';
        var handler = "YAML_load_javascript_"+type;
        if (typeof window[handler] != 'undefined') {
            return window[handler](node, _class);
        }
        else {
            croak('YAML_LOAD_ERR_NO_CONVERT '+explicit);
        }
    }
    else if (!/\//.test(explicit)) {
        croak('YAML_LOAD_ERR_NO_CONVERT '+explicit);
    }
    else {
        return new YAML_Node(node, explicit);
    }
}

// can't really see why this is needed - YAML.pm does some TIE magic
// to make sure that nodes keep track of their types - in JS, everything
// is an object, so it should be do-able... FIXME
function YAML_Node(node, explicit) {
    node.TYPE = explicit;
    return node;
}

// Support for !int
function YAML_load_int(node) {
    if (!/^-?\d+$/.test(node)) croak('YAML_LOAD_ERR_BAD_STR_TO_INT');
    return node;
}

// Support for !date
function YAML_load_date(node) {
    if (!/^\d\d\d\d-\d\d-\d\d$/.test(node))
	croak('YAML_LOAD_ERR_BAD_STR_TO_DATE');
    return node;
}

// Support for !time
function YAML_load_time(node) {
    if (!/^\d\d:\d\d:\d\d$/.test(node))
	croak('YAML_LOAD_ERR_BAD_STR_TO_TIME');
    return node;
}

// Support for !javascript/code;deparse
function YAML_load_javascript_code(node, _class) {
}

function YAML_load_javascript_regexp(node) {
}

function YAML_parse_mapping(anchor) {
    var mapping = { };
    this.anchor2node[anchor] = mapping;
    var key;
    while (!this.done && (this.indent == this.offset[this.level])) {
	print_STDERR('_parse_mapping top of while loop');
        // If structured key:
        if (/^\?\s*/.test(this.content)) {
	    this.content = this.content.replace(/^\?\s*/, '');
            this.preface = this.content;
            this._parse_next_line(YAML_COLLECTION);
            key = this._parse_node();
            key = key+"";
        }
        // If "default" key (equals sign) 
        else if (/^\=\s*/.test(this.content)) {
	    this.content = this.content.replace(/^\=\s*/, '');
            key = YAML_VALUE;
        }
        // If "comment" key (slash slash)
        else if (/^\=\s*/.test(this.content)) {
	    this.content = this.content.replace(/^\=\s*/, '');
            key = YAML_COMMENT;
        }
        // Regular scalar key:
        else {
	    print_STDERR("Reg scalar key, content => "+this.content);
            this.inline = this.content;
            key = this._parse_inline();
            key = key+"";
            this.content = this.inline;
            this.inline = '';
	    print_STDERR("key => "+key+", content => "+this.content);
        }
	print_STDERR(this.content);
	if (!/^:\s*/.test(this.content)) {
	    croak('YAML_LOAD_ERR_BAD_MAP_ELEMENT');
	}
	this.content = this.content.replace(/^:\s*/, '');
        this.preface = this.content;
        var line = this.line;
        this._parse_next_line(YAML_COLLECTION);
        var value = this._parse_node();
        if (typeof mapping[key] != 'undefined') {
            warn('YAML_LOAD_WARN_DUPLICATE_KEY');
        }
        else {
            mapping[key] = value;
        }
    }

    return mapping;
}

// Parse a YAML sequence into an Array
function YAML_parse_seq(anchor) {
    var seq = [], m;
    this.anchor2node[anchor] = seq;
    while (!this.done && (this.indent == this.offset[this.level])) {
        if (/^-(?: (.*))?$/.test(this.content)) {
	    m = this.content.match(/^-(?: (.*))?$/);
            this.preface = typeof m[1] != 'undefined'? m[1] : '';
        }
        else {
            croak('YAML_LOAD_ERR_BAD_SEQ_ELEMENT');
        }
        if (/^(\s*)(\w.*\:(?: |$).*)$/.test(this.preface)) {
	    m = this.preface.match(/^(\s*)(\w.*\:(?: |$).*)$/);
            this.indent = this.offset[this.level] + 2 + m[1].length;
            this.content = m[2];
            this.offset[++this.level] = this.indent;
            this.preface = '';
            seq.push(this._parse_mapping(''));
            this.level--;
            this.offset[this.offset.length-1] = this.level;
        }
        else {
            this._parse_next_line(YAML_COLLECTION);
            seq.push(this._parse_node());
        }
    }
    return seq;
}

// Parse an inline value. Since YAML supports inline collections, this is
// the top level of a sub parsing.
function YAML_parse_inline(top) {
    var top          = arguments[0] || '',
	top_implicit = arguments[1] || '',
	top_explicit = arguments[2] || '',
	top_class    = arguments[3] || '';
    
    this.inline = this.inline.replace(/^\s*(.*)\s*$/, "$1");
    
    var node     = '',
	anchor   = '',
	alias    = '',
	explicit = '',
	implicit = '',
	_class   = '';

    var q = this._parse_qualifiers(this.inline);
    var anchor      = q[0] || 0,
	alias       = q[1] || 0,
	explicit    = q[2] || 0,
	implicit    = q[3] || 0,
	_class      = q[4] || 0;
    this.inline     = q[5] || 0;

    if (anchor) {
        this.anchor2node[anchor] = new YAML_anchor2node();
    }
    implicit = implicit || top_implicit;
    explicit = explicit || top_explicit;
    _class   = _class   || top_class;

    top_implicit = ''; top_explicit = ''; top_class = '';

    if (alias) {
	if (typeof this.anchor2node[alias] == 'undefined')
	    croak('YAML_PARSE_ERR_NO_ANCHOR '+alias); 
        if (this.anchor2node[alias].constructor != YAML_anchor2node) {
            node = this.anchor2node[alias];
        }
        else {
            node = "*"+alias;
	    this.anchor2node[alias].push([node, this.line]);
        }
    }
    else if (/^\{/.test(this.inline)) {
        node = this._parse_inline_mapping(anchor);
    }
    else if (/^\[/.test(this.inline)) {
        node = this._parse_inline_seq(anchor);
    }
    else if (/^\x22/.test(this.inline)) {
        node = this._parse_inline_double_quoted();
        node = this._unescape(node);
	if (implicit)
	    node = this._parse_implicit(node);
    }
    else if (/^\x27/.test(this.inline)) {
        node = this._parse_inline_single_quoted();
        if (implicit) 
	    node = this._parse_implicit(node);
    }
    else {
        if (top) {
            node = this.inline;
            this.inline = '';
        }
        else {
	    print_STDERR("_parse_inline_simple");
            node = this._parse_inline_simple();
        }
	if (!explicit)
	    node = this._parse_implicit(node);
    }
    if (explicit) {
        if (_class) {
	    window[_class].apply(node);
        }
        else {
            node = this._parse_explicit(node, explicit);
        }
    }
    if (anchor) {
        if (this.anchor2node[anchor].constructor == YAML_anchor2node) {
            for (var x = 0; x < this.anchor2node[anchor].length; x++) {
		try {
		    this.anchor2node[anchor][0] = node;
		} catch (ex) {
		    warn('YAML_LOAD_WARN_UNRESOLVED_ALIAS '+anchor+' '
			 +this.anchor2node[anchor][0]);
		}
            }
        }
        this.anchor2node[anchor] = node;
    }
    return node;
}

// Parse the inline YAML mapping into a JavaScript object/hash
function YAML_parse_inline_mapping(anchor) {
    var node = {};
    this.anchor2node[anchor] = node;

    if (!/^\{\s*/.test(this.inline)) {
	croak('YAML_PARSE_ERR_INLINE_MAP');
    }
    this.inline = this.inline.replace(/^\{\s*/, '');

    while (!/^\}/.test(this.inline)) {
	this.inline = this.inline.replace(/^\}/, '');
        var key = this._parse_inline();
	if (!/^\: \s*/.test(this.inline))
	    croak('YAML_PARSE_ERR_INLINE_MAP');

	this.inline = this.inline.replace(/^\: \s*/, '');

        this.value = this._parse_inline();
        if (typeof node[key] != 'undefined') {
            warn('YAML_LOAD_WARN_DUPLICATE_KEY');
        }
        else {
            node[key] = value;
        }
	if (/^\}/.test(this.inline))
	    continue;

	if (!/^\,\s*/.test(this.inline))
	    croak('YAML_PARSE_ERR_INLINE_MAP');

	this.inline = this.inline.replace(/^\,\s*/, '');
    }
	this.inline = this.inline.replace(/^\}/, '');
    return node;
}

// Parse the inline YAML sequence into a Perl array
function YAML_parse_inline_seq(anchor) {
    var node = [];
    this.anchor2node[anchor] = node;
    if (!/^\[\s*/.test(this.inline))
	croak ('YAML_PARSE_ERR_INLINE_SEQUENCE');
    this.inline = this.inline.replace(/^\[\s*/, '');

    while (!/^\]/.test(this.inline)) {
	this.inline = this.inline.replace(/^\]/, '');
        var value = this._parse_inline();
        node.push(value);
	if (/^\]/.test(this.inline))
	    continue;
	if (!/^\,\s*/.test(this.inline))
	    croak('YAML_PARSE_ERR_INLINE_SEQUENCE');
	this.inline = this.inline.replace(/^\,\s*/, '');
    }
	this.inline = this.inline.replace(/^\]/, ''); // XXX - cwest
    return node;
}

// Parse the inline double quoted string.
function YAML_parse_inline_double_quoted() {
    var node, m = this.inline.match(/^"((?:\\"|[^"])*)"\s*(.*)$/);
    if (m && m.length) {
        node = m[1];
        this.inline = m[2];
        node = node.replace(/\\"/g, '"');
    } else {
        croak('YAML_PARSE_ERR_BAD_DOUBLE');
    }
    return node;
}


// Parse the inline single quoted string.
function YAML_parse_inline_single_quoted() {
    var node, m = this.inline.match(/^'((?:''|[^'])*)'\s*(.*)$/);
    if (m && m.length) {
        node = m[1];
        this.inline = m[2];
        node = node.replace(/''/g, "'");
    } else {
        croak('YAML_PARSE_ERR_BAD_SINGLE');
    }
    return node;
}

// Parse the inline unquoted string and do implicit typing.
function YAML_parse_inline_simple() {
    var value;
    if (this.inline.match( /^(|[^!@#%^&*].*?)(?=[,[\]{}]|: |- |:\s*$|$)/ )) {
        value = RegExp.$1;
	this.inline = this.inline.slice(RegExp.$1.length);
    }
    else {
        croak('YAML_PARSE_ERR_BAD_INLINE_IMPLICIT '+value);
    }
    return value;
}

// Unfold a YAML multiline scalar into a single string.
function YAML_parse_unfold(chomp) {
    var node = '';
    var space = 0;
    while (!this.done && (this.indent == this.offset[this.level])) {
        node += this.content.concat(String.fromCharCode(10));//"$o->{content}\n";
        this._parse_next_line(YAML_LEAF);
    }
    node = node.replace(/^(\S.*)\n(?=\S)/gm, "$1");
    node = node.replace(/^(\S.*)\n(\n+\S)/gm,"$1$2");
    if (chomp != '+') node = node.replace(/\n*\Z/, '');
    if (!chomp) node += String.fromCharCode(10);

    return node;
}

// Parse a YAML block style scalar. This is like a Perl here-document.
function YAML_parse_block(chomp) {
    var node = '';
    while (!this.done && (this.indent == this.offset[this.level])) {
        node += this.content.concat(String.fromCharCode(10));
        this._parse_next_line(YAML_LEAF);
    }
    if (chomp == '+') return node;
    node = node.replace(/\n*\Z/, String.fromCharCode(10));
    if (chomp == '-') node = node.replace(/\n\Z/, '');
    return node;
}

function YAML_parse_throwaway_comments() {
    while (this.lines.length && this.lines[0].match(/^\s*(\#|$)/)) {
        this.lines.shift();
        this.line++;
    }
    this.eos = this.done = !this.lines.length;
}

/*
 * This is the routine that controls what line is being parsed. It gets called
 * once for each line in the YAML stream.
 *
 * This routine must:
 * 1) Skip past the current line
 * 2) Determine the indentation offset for a new level
 * 3) Find the next _content_ line
 *   A) Skip over any throwaways (Comments/blanks)
 *   B) Set this.indent, this.content, this.line
 * 4) Expand tabs appropriately  
 */
function YAML_parse_next_line(type) {
    var level = this.level;
    var offset = this.offset[level];
    if (typeof offset == 'undefined') croak('YAML_EMIT_ERR_BAD_LEVEL');
    this.lines.shift();
    this.eos = this.done = !this.lines.length;
    if (this.eos) return;
    this.line++;

    print_STDERR("preface => "+this.preface);
    // Determine the offset for a new leaf node
    if (this.preface.match(/(?:>|\|)(?:-|\+)?(\d*)\s*$/)) {
	if (RegExp.$1.length && (parseInt(RegExp.$1) == 0)) {
	    croak('YAML_PARSE_ERR_ZERO_INDENT');
        }
	type = YAML_LEAF;
        if (RegExp.$1.length) {
            this.offset[level + 1] = (offset + parseInt(RegExp.$1));
        }
        else {
            // First get rid of any comments.
            while (this.lines.length && (/^\s*#/.test(this.lines[0]))) {
		if (!(this.lines[0].match(/^( *)/))) croak('line 1172'); // FIXME
                if (!(RegExp.$1.length <= offset)) break;
                this.lines.shift();
                this.line++;
            }
            this.eos = this.done = !this.lines.length;
            if (this.eos) return;
            if (this.lines[0].match(/^( *)\S/) && (RegExp.$1.length > offset)) {
                this.offset[level+1] = RegExp.$1.length;
            }
            else {
                this.offset[level+1] = (offset + 1);
            }
        }
        offset = this.offset[++level];
    }
    // Determine the offset for a new collection level
    else if ((type == YAML_COLLECTION) && (this.preface.match(/^(\s*(\!\S*|\&\S+))*\s*$/))) {
        this._parse_throwaway_comments();
        if (this.eos) {
            this.offset[level+1] = (offset + 1);
            return;
        }
        else {
            this.lines[0].match(/^( *)\S/) || croak('SHIT!!!');
            if (RegExp.$1.length > offset) {
                this.offset[level+1] = RegExp.$1.length;
            }
            else {
                this.offset[level+1] = (offset + 1);
            }
        }
        offset = this.offset[++level];
	print_STDERR("type is COLLECTION offset => "+offset+", level => "+level);
    }
        
    if (type == YAML_LEAF) {
        while (this.lines.length &&
               this.lines[0].match(/^( *)(\#)/) &&
               (RegExp.$1.length < offset)
              ) {
            this.lines.shift();
            this.line++;
        }
        this.eos = this.done = !this.lines.length;
    }
    else {
        this._parse_throwaway_comments();
    }
    if (this.eos) return;
    
    if (this.lines[0].match(/^---(\s|$)/)) {
        this.done = 1;
        return;
    }
    print_STDERR('type => '+type);
    if ((type == YAML_LEAF) && 
        this.lines[0].match(new RegExp("^ {"+offset+"}(.*)$"))) {
        this.indent = offset;
        this.content = RegExp.$1;
    }
    else if (this.lines[0].match(/^\s*$/)) {
        this.indent = offset;
        this.content = '';
    }
    else {
        this.lines[0].match(/^( *)(\S.*)$/);
  print_STDERR("   indent("+RegExp.$1.length+")  offsets("+this.offset+")");
        while (this.offset[level] > RegExp.$1.length) {
            level--;
        }
	if (this.offset[level] != RegExp.$1.length) {
	    croak('YAML_PARSE_ERR_INCONSISTENT_INDENTATION '
		  +'this.offset['+level+'] => '+this.offset[level]+' $1.length => '
		  +RegExp.$1.length);
	}

        this.indent = RegExp.$1.length;
        this.content = RegExp.$2;
    }
    if ((this.indent - offset) > 1) croak('YAML_PARSE_ERR_INDENTATION');
}

//==============================================================================
// Utility subroutines.
//==============================================================================

// Printable characters for escapes
var unescapes = {
    z : "\x00", a : "\x07", t : "\x09",
    n : "\x0a", v : "\x0b", f : "\x0c",
    r : "\x0d", e : "\x1b", '\\' : '\\'
};

/*
// Transform all the backslash style escape characters to their literal meaning
function _unescape {
    my ($node) = @_;
    $node =~ s/\\([never\\fartz]|x([0-9a-fA-F]{2}))/
              (length($1)>1)?pack("H2",$2):$unescapes{$1}/gex;
    return $node;
}
*/

function YAML_unescape_innerHTML(str) {
    str = str.replace(/(&gt;)/g, '>');
    str = str.replace(/(&amp;)/g, '&');
    return str;
}

// this looks like some kind of Array subclass (blessed arrayref)
function YAML_anchor2node() {
    var _a2n = [ ]; _a2n.constructor = arguments.callee;
    return _a2n;
}

function croak(msg) {
    throw new Error(msg);
}

function warn(msg) {
    alert(msg);
}

function print_STDERR(msg) {
    if (YAML_DEBUG) {
	document.body.appendChild(document.createTextNode(msg));
	document.body.appendChild(document.createElement('br'));
    }
}


