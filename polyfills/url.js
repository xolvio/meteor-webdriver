(function () {

  if (!window) {
    return;
  }

  if (window.URL && window.URL.prototype && ('href' in window.URL.prototype))
    return;

  function URL(url, base) {
    if (!url)
      throw new TypeError('Invalid argument');

    var doc = document.implementation.createHTMLDocument('');
    if (base) {
      var baseElement = doc.createElement('base');
      baseElement.href = base;
      doc.head.appendChild(baseElement);
    }
    var anchorElement = doc.createElement('a');
    anchorElement.href = url;
    doc.body.appendChild(anchorElement);

    if (anchorElement.protocol === ':' || !/:/.test(anchorElement.href))
      throw new TypeError('Invalid URL');

    Object.defineProperty(this, '_anchorElement', {value: anchorElement});
  }

  URL.prototype = {
    toString: function () {
      return this.href;
    },

    get href() {
      return this._anchorElement.href;
    },
    set href(value) {
      this._anchorElement.href = value;
    },

    get protocol() {
      return this._anchorElement.protocol;
    },
    set protocol(value) {
      this._anchorElement.protocol = value;
    },

    // NOT IMPLEMENTED
    // get username() {
    //   return this._anchorElement.username;
    // },
    // set username(value) {
    //   this._anchorElement.username = value;
    // },

    // get password() {
    //   return this._anchorElement.password;
    // },
    // set password(value) {
    //   this._anchorElement.password = value;
    // },

    // get origin() {
    //   return this._anchorElement.origin;
    // },

    get host() {
      return this._anchorElement.host;
    },
    set host(value) {
      this._anchorElement.host = value;
    },

    get hostname() {
      return this._anchorElement.hostname;
    },
    set hostname(value) {
      this._anchorElement.hostname = value;
    },

    get port() {
      return this._anchorElement.port;
    },
    set port(value) {
      this._anchorElement.port = value;
    },

    get pathname() {
      return this._anchorElement.pathname;
    },
    set pathname(value) {
      this._anchorElement.pathname = value;
    },

    get search() {
      return this._anchorElement.search;
    },
    set search(value) {
      this._anchorElement.search = value;
    },

    get hash() {
      return this._anchorElement.hash;
    },
    set hash(value) {
      this._anchorElement.hash = value;
    }
  };

  var oldURL = window.URL || window.webkitURL || window.mozURL;

  URL.createObjectURL = function (blob) {
    return oldURL.createObjectURL.apply(oldURL, arguments);
  };

  URL.revokeObjectURL = function (url) {
    return oldURL.revokeObjectURL.apply(oldURL, arguments);
  };

  Object.defineProperty(URL.prototype, 'toString', {enumerable: false});

  window.URL = URL;
})();