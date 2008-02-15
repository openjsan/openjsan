if (typeof HTTP == 'undefined') var HTTP = {};

HTTP.Request = function () {
    this.req   = this._getRequestObject();
    this.async = false;
}

HTTP.Request.prototype = {
    req:   null,
    async: false,
    
    getUrl: function (url, method) {
        if (method == null) method = "GET";
        this.req.open(method, url, this.async);
        this.req.send(null);
        return true;
    },
    
    getText: function (url) {
        if (this.getUrl(url)) return this.req.responseText;
        return null;
    },
    
    getXML: function (url) {
        if (this.getUrl(url)) return this.req.responseXML;
        return null;
    },

    _getRequestObject: function () {
        if (self.XMLHttpRequest) {
            return new XMLHttpRequest;
        } else {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
    }
};

