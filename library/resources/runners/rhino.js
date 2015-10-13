// Common code to all runners 
// Should be kept in sync between rhino.js & headless.js

function hasDoo () {
    return (typeof doo !== "undefined" &&
            typeof doo.runner !== "undefined" &&
            typeof doo.runner.run_BANG_ === "function");
};

function noDooMsg() { 
    var messageLines = [
            "",
            "ERROR: doo was not loaded from the compiled script.",
            "",
            "Make sure you start your tests using doo-tests or doo-all-tests",
            "and that you include that file in your build",
            ""
        ];
    return messageLines.join("\n");
}; 

function noScriptMsg(env) {
    var msgLines = [
        "",
        ["ERROR:", env, "couldn't find the script"].join(" "),
        "",
        "This is most likely doo's fault. Please file an issue at ",
        "http://github.com/bensu/doo and we'll sort it out together.",
        ""
    ];
    return msgLines.join("\n");
}

// Rhino Runner

var setTimeout, clearTimeout, setInterval, clearInterval;

(function () {
    var executor = new java.util.concurrent.Executors.newScheduledThreadPool(1);
    var counter = 1;
    var ids = {};

    setTimeout = function (fn,delay) {
        var id = counter++;
        var runnable = new JavaAdapter(java.lang.Runnable, {run: fn});
        ids[id] = executor.schedule(runnable, delay, java.util.concurrent.TimeUnit.MILLISECONDS);
        return id;
    };

    clearTimeout = function (id) {
        ids[id].cancel(false);
        executor.purge();
        delete ids[id];
    };

    setInterval = function (fn,delay) {
        var id = counter++;
        var runnable = new JavaAdapter(java.lang.Runnable, {run: fn});
        ids[id] = executor.scheduleAtFixedRate(runnable, delay, delay, java.util.concurrent.TimeUnit.MILLISECONDS);
        return id;
    };

    clearInterval = clearTimeout;

})();

function assertDoo() {
    if (!hasDoo()) {
        print(noDooMsg());
        java.lang.System.exit(1);
    };
};

arguments.forEach(function (arg) {
    if (new java.io.File(arg).exists()) {
        try {
            load(arg);
        } catch (e) {
            assertDoo();
            print("Error in file: \"" + arg + "\"");
            print(e);
        }
    } else {
        print(noScriptMsg("Rhino"));
        java.lang.System.exit(1);
    }
});

// check this before trying to call set_print_fn_BANG_
assertDoo(); 

doo.runner.set_print_fn_BANG_(function(x) {
    // since console.log *itself* adds a newline
    var splitX = x.replace(/\n$/, "");
    if (splitX.length > 0) {
        print(splitX);
    }
});

doo.runner.set_exit_point_BANG_(function (isSuccess) {
    java.lang.System.exit(isSuccess ? 0 : 1);
});

var results = doo.runner.run_BANG_();
