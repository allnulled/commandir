# commandir

Commandir pattern allows to scale command pattern with directories or URLs. Nodejs or browser.

## Installation

```sh
npm install -s @allnulled/commandir
```

## Importation

In node.js:

```js
require("@allnulled/commandir");
```

In html:

```html
<script src="node_modules/@allnulled/commandir/commandir.js"></script>
```

## Usage

In node.js:

```js
const commandir = Commandir.nodejs(__dirname + "/commands");
```

In browser:

```js
const commandir = Commandir.browser("https://github.com/allnulled/path/to/file/raw");
```

The `browser` mode, which in fact means AJAX mode, is allowed in node.js too as it only uses `fetch`.

Then, in any:

```js
commandir.execute("path/to/command.js", {
    parameter1: 1,
    parameter2: 2,
    parameter3: 3
});
```

You can, then, `list()`, `register(name, callback)` and `unregister(name)`:

```js
console.log(commandir.list());
commandir.register("salute", () => console.log("hi!"));
commandir.execute("salute");
commandir.unregister("salute");
```

## Details

1. The objects `module.exports` and `__dirname` exist in both environments.

The only difference is that `__dirname` in browsers points to the URL of the script. But `module.exports` and `return` can be used in `browser` mode to return a module from the file.

2. The method `register` receive different parameters

In browser, `register(name, url)`. In node.js, `register(name, callback)`.

3. The methods `register` and `unregister` work differently

In browser, they just associate a label with a URL. In node.js, they write a file in the filesystem with the callback provided as second parameter, and remove it on `unregister`.

4. The method `list` cannot work in browser

Because directories in the web do not list by default, the method `list` is still not provided with a polyfill.

5. Names are fixed and sanitized
   
Names have a process of validation and transformation before they get registered. They rewrite the `.js` at the end, and forbid `..` just in case.

For now, I think it is all.

## Test

This is the example that the test uses. It is cross-environment but because we discriminated. 

```js
let basedir = ".";

const isNodejs = typeof global !== "undefined";

const main = async function () {
  if (isNodejs) {
    require(__dirname + "/../commandir.js");
    basedir = __dirname;
  }

  if (isNodejs) {
    const commandir = Commandir.nodejs(basedir + "/commands");
    commandir.execute("/hello", {
      dest: "world"
    });
    commandir.register("/goodbye", function (parameters) {
      console.log(`Goodbye, ${parameters.dest}!`);
    });
    commandir.execute("/goodbye", { dest: "world" });
    commandir.unregister("/goodbye");
    console.log(commandir.list(""));
  } else {
    const commandir = Commandir.browser("/test/commands");
    await commandir.register("hello", "./commands/hello.js");
    await commandir.execute("hello", { dest: "world" });
  }
};

main();
```

