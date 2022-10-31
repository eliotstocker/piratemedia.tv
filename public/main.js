let term;

function init() {
    gaInit();

    term = new Terminal({
        el: document.querySelector('.terminal'),
        hostname: 'Eli0tz Comput3r',
        profile: '/home/.profile',
        cwd: '/home',
        cursor: 'blink',
        outputAnimation: 'type',
        animateSpeed: 10,
        filesystem: fs
    });

    const nav = document.querySelectorAll('.nav a');
    nav.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault && e.preventDefault();
            const cmd = e.currentTarget.getAttribute("data-command");
            const vars = hashToVariables();
            vars.cmd = cmd;

            variablesToHash(vars);
        });
    });

    cmdFromHash(true);
    term.cli.on("exit", () => window.location.href = "https://google.com/");
}

function hashToVariables() {
    if(!window.location.hash || window.location.hash === "#" || !window.location.hash.includes("="))  {
        return {};
    }

    return [
        ...(window.location.hash.startsWith("#") ? window.location.hash.substring(1) : window.location.hash).split("&")
    ].reduce((acc, v) => {
        [k, v] = v.split("=")
        return {
            ...acc,
            [k]: decodeURIComponent(v)
        }
    }, {});
}

function variablesToHash(vars) {
    window.location.hash = Object.entries(vars).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

function cmdFromHash(listen = false) {
    console.log(hashToVariables())
    const {cmd} = hashToVariables();
    if(cmd) {
        term.onCommand(cmd);
    }

    if(listen) {
        window.addEventListener('hashchange', () => cmdFromHash());
    }
}

function gaInit() {
    (function (a, c, d, p, h, k, l) {
        a.GoogleAnalyticsObject = h;
        a[h] = a[h] || function () {
            (a[h].q = a[h].q || []).push(arguments)
        };
        a[h].a = 1 * new Date;
        k = c.createElement(d);
        l = c.getElementsByTagName(d)[0];
        k.async = 1;
        k.src = p;
        l.parentNode.insertBefore(k, l)
    })(window, document, "script", "https://www.google-analytics.com/analytics.js", "ga");
    ga("create", "UA-78482123-1", "auto");
    ga("send", "pageview");
}