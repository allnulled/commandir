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