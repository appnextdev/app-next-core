(function(exports) {
    "use strict";
    function normalizeName(child, parentBase) {
        if ("/" === child.charAt(0)) child = child.slice(1);
        if ("." !== child.charAt(0)) return child;
        var parts = child.split("/");
        while ("." === parts[0] || ".." === parts[0]) if (".." === parts.shift()) parentBase.pop();
        return parentBase.concat(parts).join("/");
    }
    function ensuredExecute(name) {
        var mod = internalRegistry[name];
        if (mod && !executed[name]) {
            executed[name] = true;
            mod.execute();
        }
        return mod && mod.exports;
    }
    function set(name, exports) {
        if ("object" != typeof exports) exports = {
            "default": exports
        };
        externalRegistry[name] = exports;
    }
    function get(name) {
        return externalRegistry[name] || ensuredExecute(name);
    }
    function has(name) {
        return !!externalRegistry[name] || !!internalRegistry[name];
    }
    function queueAnonymous(callback, args) {
        var entry = [ callback ];
        entry.push.apply(entry, args);
        anonymousEntries.push(entry);
    }
    function register(name, deps, wrapper) {
        if (!Array.isArray(name)) {
            var mod, meta, exports = Object.create(null);
            internalRegistry[name] = mod = {
                exports: exports,
                deps: deps.map(function(dep) {
                    return normalizeName(dep, name.split("/").slice(0, -1));
                }),
                dependants: [],
                update: function(moduleName, moduleObj) {
                    meta.setters[mod.deps.indexOf(moduleName)](moduleObj);
                },
                execute: function() {
                    mod.deps.map(function(dep) {
                        var imports = externalRegistry[dep];
                        if (imports) mod.update(dep, imports); else {
                            imports = get(dep) && internalRegistry[dep].exports;
                            if (imports) {
                                internalRegistry[dep].dependants.push(name);
                                mod.update(dep, imports);
                            }
                        }
                    });
                    meta.execute();
                }
            };
            meta = wrapper(function(identifier, value) {
                exports[identifier] = value;
                mod.lock = true;
                mod.dependants.forEach(function(moduleName) {
                    if (internalRegistry[moduleName] && !internalRegistry[moduleName].lock) internalRegistry[moduleName].update(name, exports);
                });
                mod.lock = false;
                return value;
            });
        } else queueAnonymous(register, arguments);
    }
    function define(name, deps, factory) {
        if (!Array.isArray(name) && "function" != typeof name) {
            if ("function" == typeof deps) {
                factory = deps;
                deps = [];
            }
            var mod, exports = {};
            internalRegistry[name] = mod = {
                exports: exports,
                deps: deps.map(function(dep) {
                    return normalizeName(dep, name.split("/").slice(0, -1));
                }),
                dependants: [],
                update: function(moduleName, moduleObj) {},
                execute: function() {
                    var depValues = [];
                    mod.deps.map(function(dep) {
                        var depValue;
                        if ("exports" === dep) depValue = mod.exports; else if ("module" === dep) depValue = mod; else {
                            depValue = externalRegistry[dep];
                            if (!depValue) {
                                depValue = get(dep) && internalRegistry[dep].exports;
                                depValue = depValue && depValue["default"];
                            }
                        }
                        depValues.push(depValue);
                    });
                    var r = factory.apply(null, depValues);
                    if ("object" != typeof mod.exports) mod.exports = {
                        "default": mod.exports
                    };
                    if ("object" == typeof r) {
                        r["default"] = r["default"] || r;
                        mod.exports = exports = r;
                    } else if (r) exports["default"] = r;
                    mod.lock = true;
                    mod.dependants.forEach(function(moduleName) {
                        if (internalRegistry[moduleName] && !internalRegistry[moduleName].lock) internalRegistry[moduleName].update(name, exports);
                    });
                    mod.lock = false;
                }
            };
        } else queueAnonymous(define, arguments);
    }
    function createScriptNode(src, callback) {
        var script = document.createElement("script");
        if (script.async) script.async = false;
        script.addEventListener("load", callback, false);
        script.src = src;
        headEl.appendChild(script);
    }
    function load(name) {
        if (!loading[name]) loading[name] = new Promise(function(resolve, reject) {
            createScriptNode((System.baseURL || "") + "/" + name + ".js", function() {
                delete loading[name];
                if (anonymousEntries.length) {
                    var anonymousEntry = anonymousEntries.shift();
                    anonymousEntry[0].call(this, name, anonymousEntry[1], anonymousEntry[2]);
                }
                var mod = internalRegistry[name];
                if (!mod) reject(new Error("Error loading module " + name)); else resolve(name);
            });
        });
        return loading[name];
    }
    function loadDependencies(name) {
        var depMod, mod = internalRegistry[name];
        if (!mod) return Promise.reject(new Error("Module " + name + " not loaded"));
        var key = name + "!";
        if (loading[key]) return loading[key]; else return loading[key] = Promise.all(mod.deps.map(function(dep) {
            if (externalRegistry[dep] || /module|exports|require/.test(dep)) return Promise.resolve(dep); else if (depMod = internalRegistry[dep]) {
                var key = dep + "!";
                if (executed[dep] || loading[key]) return name; else return loading[key] = loadDependencies(dep).then(function(name) {
                    loading[key] = Promise.resolve(name);
                    return name;
                });
            }
            return load(dep).then(loadDependencies);
        })).then(function() {
            return name;
        });
    }
    function importModule(name) {
        var mod, normalizedName = normalizeName(name, []);
        if (mod = externalRegistry[normalizedName]) return Promise.resolve(mod); else if (mod = internalRegistry[normalizedName]) if (executed[normalizedName]) return Promise.resolve(mod.exports); else return loadDependencies(normalizedName).then(ensuredExecute);
        return load(normalizedName).then(loadDependencies).then(ensuredExecute);
    }
    var headEl = document.getElementsByTagName("head")[0], loading = Object.create(null), executed = Object.create(null), internalRegistry = Object.create(null), externalRegistry = Object.create(null), anonymousEntries = [];
    define.amd = {
        jQuery: true
    };
    var System = {
        set: set,
        get: get,
        has: has,
        "import": importModule,
        importAll: function(names) {
            if (!Array.isArray(names)) names = [].slice.call(arguments);
            var keys = [];
            return Promise.all(names.map(function(name) {
                var matches = /^(.+?)(\.([\w*]+))?$/.exec(name);
                name = matches[1];
                keys.push(matches[3] || "default");
                return importModule(name);
            })).then(function(modules) {
                return modules.map(function(module, i) {
                    return "*" == keys[i] ? module : module[keys[i]];
                });
            });
        },
        register: register,
        amdDefine: define,
        amdRequire: function(deps, callback) {
            System.importAll(deps).spread(callback);
        }
    };
    exports.System = System;
    exports.define = define;
    if (!Promise.prototype.spread) Promise.prototype.spread = function(fn) {
        return this.then(function(args) {
            return Promise.all(args);
        }).then(function(args) {
            return fn.apply(this, args);
        });
    };
})(window);
System.register("handlers/data", [], function (exports_1, context_1) {
    "use strict";
    var AppNextDataEvents;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            AppNextDataEvents = class AppNextDataEvents {
                set onCancel(listener) { this.cancel = listener; }
                set onData(listener) { this.data = listener; }
                set onError(listener) { this.error = listener; }
                set onPending(listener) { this.pending = listener; }
                set onReady(listener) { this.ready = listener; }
                invokeCancelEvent(error) {
                    try {
                        if (this.cancel)
                            this.cancel(error);
                    }
                    catch (error) {
                        this.invokeErrorEvent(error);
                    }
                }
                invokeDataEvent(data) {
                    try {
                        if (this.data)
                            this.data(data);
                    }
                    catch (error) {
                        this.invokeErrorEvent(error);
                    }
                }
                invokeErrorEvent(error) {
                    if (this.error)
                        this.error(error);
                }
                invokePendingEvent() {
                    try {
                        if (this.pending)
                            this.pending();
                    }
                    catch (error) {
                        this.invokeErrorEvent(error);
                    }
                }
                invokeReadyEvent() {
                    try {
                        if (this.ready)
                            this.ready();
                    }
                    catch (error) {
                        this.invokeErrorEvent(error);
                    }
                }
            };
            exports_1("AppNextDataEvents", AppNextDataEvents);
        }
    };
});
System.register("handlers/error", [], function (exports_2, context_2) {
    "use strict";
    var Errors, errors;
    var __moduleName = context_2 && context_2.id;
    function error(code) {
        const info = errors[Errors[code]];
        if (!info)
            return new Error();
        const error = new Error(info.message);
        error.name = info.name;
        return error;
    }
    exports_2("error", error);
    return {
        setters: [],
        execute: function () {
            (function (Errors) {
                Errors[Errors["acceptNotSupported"] = 0] = "acceptNotSupported";
                Errors[Errors["captureNotSupported"] = 1] = "captureNotSupported";
                Errors[Errors["featureTerminated"] = 2] = "featureTerminated";
                Errors[Errors["permissionDenied"] = 3] = "permissionDenied";
            })(Errors || (Errors = {}));
            exports_2("Errors", Errors);
            errors = {
                acceptNotSupported: { name: 'accept not supported', message: 'Input element "accept" attribute is not supported by this device' },
                captureNotSupported: { name: 'capture not supported', message: 'Input element "capture" attribute is not supported by this device' },
                featureTerminated: { name: 'feature terminated', message: 'Current feature terminated due to user action' },
                permissionDenied: { name: 'permission denied', message: 'Requested permission denied by user' }
            };
        }
    };
});
System.register("providers/permission", ["handlers/data", "handlers/error"], function (exports_3, context_3) {
    "use strict";
    var data_1, error_1, AppNextPermissionProvider;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (data_1_1) {
                data_1 = data_1_1;
            },
            function (error_1_1) {
                error_1 = error_1_1;
            }
        ],
        execute: function () {
            AppNextPermissionProvider = class AppNextPermissionProvider extends data_1.AppNextDataEvents {
                constructor(name) {
                    super();
                    this.name = name;
                }
                register() {
                    function handlePermission(permission) {
                        try {
                            switch (permission.state) {
                                case 'granted': return provider.invokeReadyEvent();
                                case 'prompt': return provider.invokePendingEvent();
                                case 'denied': return provider.invokeCancelEvent(error_1.error(error_1.Errors.permissionDenied));
                            }
                        }
                        catch (error) {
                            provider.invokeErrorEvent(error);
                        }
                    }
                    const provider = this;
                    return navigator.permissions.query({ name: this.name }).then(permission => {
                        handlePermission(permission);
                        permission.onchange = () => handlePermission(permission);
                    });
                }
            };
            exports_3("AppNextPermissionProvider", AppNextPermissionProvider);
        }
    };
});
System.register("handlers/watch", ["handlers/data"], function (exports_4, context_4) {
    "use strict";
    var data_2, AppNextWatch;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [
            function (data_2_1) {
                data_2 = data_2_1;
            }
        ],
        execute: function () {
            AppNextWatch = class AppNextWatch extends data_2.AppNextDataEvents {
            };
            exports_4("AppNextWatch", AppNextWatch);
        }
    };
});
System.register("providers/geolocation", ["providers/permission", "handlers/watch", "handlers/error"], function (exports_5, context_5) {
    "use strict";
    var permission_1, watch_1, error_2, AppNextGeoLocationProvider;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (permission_1_1) {
                permission_1 = permission_1_1;
            },
            function (watch_1_1) {
                watch_1 = watch_1_1;
            },
            function (error_2_1) {
                error_2 = error_2_1;
            }
        ],
        execute: function () {
            AppNextGeoLocationProvider = class AppNextGeoLocationProvider extends watch_1.AppNextWatch {
                constructor(options) {
                    super();
                    this.options = options;
                    this.permission = new permission_1.AppNextPermissionProvider('geolocation');
                    this.permission.onCancel = error => this.invokeCancelEvent(error);
                    this.permission.onError = error => this.invokeErrorEvent(error);
                    this.permission.onPending = () => this.invokePendingEvent();
                }
                request() {
                    return this.permission.register();
                }
                start() {
                    var init = true;
                    this.id = navigator.geolocation.watchPosition(position => {
                        if (init) {
                            init = false;
                            this.invokeReadyEvent();
                        }
                        this.invokeDataEvent(position);
                    }, error => {
                        if (init) {
                            this.invokeCancelEvent(new Error(error.message));
                        }
                        else {
                            this.invokeErrorEvent(new Error(error.message));
                        }
                    }, this.options || {});
                }
                stop() {
                    try {
                        if (!this.id)
                            return;
                        navigator.geolocation.clearWatch(this.id);
                        this.id = null;
                        this.invokeCancelEvent(error_2.error(error_2.Errors.featureTerminated));
                    }
                    catch (error) {
                        this.invokeErrorEvent(error);
                    }
                }
            };
            exports_5("AppNextGeoLocationProvider", AppNextGeoLocationProvider);
        }
    };
});
System.register("core", ["providers/geolocation"], function (exports_6, context_6) {
    "use strict";
    var geolocation_1, AppNextCore;
    var __moduleName = context_6 && context_6.id;
    function config(name) {
        return (AppNextCore.config || {})[name] || {};
    }
    exports_6("config", config);
    return {
        setters: [
            function (geolocation_1_1) {
                geolocation_1 = geolocation_1_1;
            }
        ],
        execute: function () {
            AppNextCore = class AppNextCore {
                constructor() {
                    this.providers =
                        {
                            geolocation: (options) => new geolocation_1.AppNextGeoLocationProvider(options)
                        };
                }
                config(value) { AppNextCore.config = value; }
            };
            exports_6("AppNextCore", AppNextCore);
        }
    };
});
System.register("elements/base", ["core", "handlers/data"], function (exports_7, context_7) {
    "use strict";
    var core_1, data_3, AppNextCustomElementUtils, AppNextCustomElement;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (data_3_1) {
                data_3 = data_3_1;
            }
        ],
        execute: function () {
            AppNextCustomElementUtils = class AppNextCustomElementUtils {
                constructor(container) {
                    this.support = {
                        attribute: (element, name) => {
                            const handler = document.createElement(element);
                            handler.setAttribute(name, true);
                            return !!handler[name];
                        }
                    };
                    this.container = container;
                }
                attribute(name, value) {
                    switch (arguments.length) {
                        case 1: return this.container.getAttribute(name);
                        case 2: this.container.setAttribute(name, value);
                    }
                }
                config() {
                    return core_1.config(this.attribute('config'));
                }
                element(type) {
                    const element = document.createElement(type);
                    this.container.attachShadow({ mode: 'open' });
                    this.container.shadowRoot.append(element);
                    return element;
                }
                reset() {
                    this.container.innerHTML = '';
                }
            };
            AppNextCustomElement = class AppNextCustomElement extends HTMLElement {
                constructor() {
                    super();
                    this.events = new data_3.AppNextDataEvents();
                    this.utils = new AppNextCustomElementUtils(this);
                }
            };
            exports_7("AppNextCustomElement", AppNextCustomElement);
        }
    };
});
System.register("elements/media-picker", ["elements/base", "handlers/error"], function (exports_8, context_8) {
    "use strict";
    var base_1, error_3, AppNextMediaPicker;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [
            function (base_1_1) {
                base_1 = base_1_1;
            },
            function (error_3_1) {
                error_3 = error_3_1;
            }
        ],
        execute: function () {
            AppNextMediaPicker = class AppNextMediaPicker extends base_1.AppNextCustomElement {
                render() {
                    this.utils.reset();
                    const target = 'input', config = this.utils.config(), element = this.utils.element(target), type = this.utils.attribute('type'), single = this.utils.attribute('single'), source = this.utils.attribute('source');
                    this.events.onCancel = config.oncancel;
                    this.events.onData = config.onmedia;
                    this.events.onError = config.onerror;
                    this.events.onReady = config.onready;
                    try {
                        if (source) {
                            if (this.utils.support.attribute(target, 'capture')) {
                                element.capture = source == 'auto' ? '' : source;
                            }
                            else {
                                this.events.invokeCancelEvent(error_3.error(error_3.Errors.captureNotSupported));
                            }
                        }
                        if (type) {
                            if (this.utils.support.attribute(target, 'accept')) {
                                element.accept = type + '/*';
                            }
                            else {
                                this.events.invokeCancelEvent(error_3.error(error_3.Errors.acceptNotSupported));
                            }
                        }
                        element.multiple = single == null || single == undefined || single != '';
                        element.onchange = () => this.events.invokeDataEvent(element.files);
                        element.type = 'file';
                        this.events.invokeReadyEvent();
                    }
                    catch (error) {
                        this.events.invokeErrorEvent(error);
                    }
                }
            };
            exports_8("AppNextMediaPicker", AppNextMediaPicker);
        }
    };
});
System.register("setup", ["elements/media-picker"], function (exports_9, context_9) {
    "use strict";
    var media_picker_1, AppNextCustomElementsRegistry, AppNextRenderer, AppNextSetup;
    var __moduleName = context_9 && context_9.id;
    return {
        setters: [
            function (media_picker_1_1) {
                media_picker_1 = media_picker_1_1;
            }
        ],
        execute: function () {
            AppNextCustomElementsRegistry = class AppNextCustomElementsRegistry {
                constructor() {
                    this.registry = {};
                    this.register('media-picker', media_picker_1.AppNextMediaPicker);
                }
                register(name, ctor) {
                    if (!customElements || this.registry[name])
                        return;
                    customElements.define(name, ctor);
                    this.registry[name] = ctor;
                }
            };
            AppNextRenderer = class AppNextRenderer {
                custom(elements) {
                    elements.forEach(element => this.render(document.querySelectorAll(element)));
                }
                render(elements = document.querySelectorAll('*')) {
                    elements.forEach((element) => {
                        if (element.render instanceof Function)
                            element.render();
                    });
                }
            };
            AppNextSetup = class AppNextSetup {
                constructor() {
                    const elements = new AppNextCustomElementsRegistry();
                    this.renderer = new AppNextRenderer();
                    addEventListener('load', () => {
                        this.renderer.custom(Object.keys(elements.registry));
                    });
                }
                render(elements) {
                    this.renderer.render(elements);
                }
            };
            exports_9("AppNextSetup", AppNextSetup);
        }
    };
});

this.AppNext = function(invoke)
{
    const imports = ['core', 'setup'].map(name => System.import(name))

    Promise.all(imports).then(modules =>
    {
        const core = new modules[0].AppNextCore(),
              setup = new modules[1].AppNextSetup()

        core.render = elements => setup.render(elements)

        invoke(core)
    })
}