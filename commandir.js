(function (factory) {
  const mod = factory();
  if (typeof window !== "undefined") {
    window.Commandir = mod;
  }
  if (typeof global !== "undefined") {
    global.Commandir = mod;
  }
  if (typeof module !== "undefined") {
    module.exports = mod;
  }
})(function () {

  const Commandir_for_node = class {

    static create(...args) {
      return new this(...args);
    }

    constructor(dir) {
      this.dir = require("path").resolve(dir);
    }

    _force(arg, callback, errorMessage) {
      if (!callback(arg)) {
        throw new Error(errorMessage);
      }
    }

    _correctCommand(command) {
      return command.replace(/\.js$/g, "") + ".js";
    }

    _sanitizeCommand(command) {
      if (command.indexOf("..") !== -1) {
        throw new Error("No se admiten comandos con el string «..»");
      }
      return command.replace(/^\/+/g, "");
    }

    unregister(command) {
      this._force(command, it => typeof (it) === 'string', "Required parameter «command» to be a string on «commandir.unregister»");
      const command_path = this._correctCommand(require("path").resolve(this.dir, this._sanitizeCommand(command)));
      require("fs").unlinkSync(command_path);
      delete require.cache[command_path];
    }

    register(command, callback) {
      this._force(command, it => typeof (it) === 'string', "Required parameter «command» to be a string on «commandir.register»");
      this._force(callback, it => typeof (it) === 'function', "Required parameter «callback» to be a function on «commandir.register»");
      const command_path = this._correctCommand(require("path").resolve(this.dir, this._sanitizeCommand(command)));
      const command_source = callback.toString();
      require("fs").writeFileSync(command_path, "module.exports = \n" + command_source + ";\n", "utf8");
    }

    execute(command, parameters = {}, refresh = false) {
      this._force(command, it => typeof (it) === 'string', "Required parameter «command» to be a string on «commandir.execute»");
      this._force(parameters, it => typeof (it) === 'object', "Required parameter «parameters» to be an object on «commandir.execute»");
      this._force(refresh, it => typeof (it) === 'boolean', "Required parameter «refresh» to be a boolean on «commandir.execute»");
      const command_path = this._correctCommand(require("path").resolve(this.dir, this._sanitizeCommand(command)));
      if (refresh) {
        delete require.cache[command_path];
      }
      const command_module = require(command_path);
      const command_product = command_module.call(this, parameters);
      return command_product;
    }

    list(subpath = "") {
      this._force(subpath, it => typeof (it) === 'string', "Required parameter «subpath» to be a string on «commandir.list»");
      const path = require("path");
      const listable_path = path.resolve(this.dir, this._sanitizeCommand(subpath));
      const files = require("fs").readdirSync(listable_path).map(f => path.resolve(this.dir, f).replace(this.dir, ""));
      return files;
    }

  }

  const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

  const Commandir_for_browser = class {

    constructor(baseURL) {
      this.baseURL = new URL(baseURL, window.location.origin).toString();
      this.commands = new Map(); // Guarda las URLs en memoria.
    }

    static create(...args) {
      return new this(...args);
    }

    _force(arg, callback, errorMessage) {
      if (!callback(arg)) {
        throw new Error(errorMessage);
      }
    }

    _sanitizeCommand(command) {
      if (command.includes("..")) {
        throw new Error("No se admiten comandos con el string «..»");
      }
      return command.replace(/^\/+/g, "");
    }

    register(command, callbackURL) {
      this._force(command, it => typeof it === "string", "Required parameter «command» to be a string on «commandir.register»");
      this._force(callbackURL, it => typeof it === "string", "Required parameter «callbackURL» to be a string on «commandir.register»");
      const sanitizedCommand = this._sanitizeCommand(command);
      this.commands.set(sanitizedCommand, new URL(callbackURL, this.baseURL).toString());
    }

    async execute(command, parameters = {}) {
      this._force(command, it => typeof it === "string", "Required parameter «command» to be a string on «commandir.execute»");
      this._force(parameters, it => typeof it === "object", "Required parameter «parameters» to be an object on «commandir.execute»");
      const sanitizedCommand = this._sanitizeCommand(command);
      if (!this.commands.has(sanitizedCommand)) {
        throw new Error(`Command «${sanitizedCommand}» is not registered.`);
      }
      const commandURL = this.commands.get(sanitizedCommand);
      const response = await fetch(commandURL);
      if (!response.ok) {
        throw new Error(`Command «${sanitizedCommand}» failed with status ${response.status}`);
      }
      const commandSource = await response.text();
      const module = {
        exports: undefined,
      };
      const __dirname = commandURL;
      const commandFunction = new AsyncFunction("module", "__dirname", "$parameters", commandSource);
      const commandProduct = await commandFunction(module, __dirname, parameters);
      const commandModule = module.exports;
      if(typeof commandProduct !== "undefined") {
        return commandProduct;
      }
      if(typeof commandModule === "function") {
        return await commandModule.call(this, parameters);
      }
      return commandModule;
    }

    list() {
      return Array.from(this.commands.keys());
    }

  };


  const Commandir = class {
    static nodejs(...args) {
      return Commandir_for_node.create(...args);
    }
    static browser(...args) {
      return Commandir_for_browser.create(...args);
    }
  }

  Commandir.default = Commandir;

  return Commandir;

});