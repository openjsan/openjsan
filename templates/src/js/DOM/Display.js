if (typeof DOM == 'undefined')
var DOM = {};

DOM.Display = function () {
    this.register = {};
}

DOM.Display.prototype = {
    register: {},

    hideElement: function (id) {
        this.registerElement(id);
        var elem = document.getElementById(id);
        if (elem == undefined) return null;
        if (elem.style.display == "none") return null;
        elem.style.display = "none";
    },

    showElement: function (id) {
        this.registerElement(id);
        var elem = document.getElementById(id);
        if (elem == undefined) return null;
        if (elem == undefined) return null;
        if (elem.style.display == "block") return null;
        elem.style.display = "block";
    },

    showOnlyElement: function (id) {
        this.registerElement(id);
        for (element in this.register)
            if (element != id)
              this.hideElement(element);
        this.showElement(id);
    },

    registerElement: function (id) {
        this.register[id] = 1;
    }
};

