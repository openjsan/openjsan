// # $Id: Kinetic.pm 1493 2005-04-07 19:20:18Z theory $

// Set up namespace.
if (typeof HTTP == 'undefined') var HTTP = {};

HTTP.Query = function (qry) {
    this.query = [];
    var pairs = qry.substring(1).split(/[;&]/);
    for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split('=');
        if (parts[0] == null) continue;
        var key = unescape(parts[0]), val = unescape(parts[1]);
        if (this.query[key] == null) {
            this.query[key] = unescape(val);
        } else {
            if (typeof this.query[key] == 'string') {
                this.query[key] = [this.query[key], unescape(val)];
            } else this.query[key].push(unescape(val));
        }
    }
};

HTTP.Query.VERSION = '0.02';

HTTP.Query.prototype = {
    get:   function (key)      { return this.query[key] },
    set:   function (key, val) { this.query[key] = val },
    unset: function (key)      { delete this.query[key] },
    clear: function ()         { this.query = [] },

    add:   function (key, val) {
        if (this.query[key] != null) {
            if (typeof this.query[key] != 'string') this.query[key].push(val);
            else this.query[key] = [this.query[key], val];
        } else {
            this.query[key] = val;
        }
    },
    act:    function (fn) {
        for (var k in this.query) {
            if (typeof this.query[k] == 'string') {
                if (!fn(k, this.query[k])) return;
            } else {
                // XXX What if someone has changed Array.prototype or
                // Object.prototype??
                for (var i in this.query[k])
                    if (!fn(k, this.query[k][i])) return;
            }
        }
    },
    toString: function () {
        var ret = '';
        this.act(function (k, v) {
             ret += ';' + escape(k) + '=' + escape(v);
             return true;
        });
        return ret.replace(/^;/, '?');
    }
};
