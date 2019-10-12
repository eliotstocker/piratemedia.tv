function init() {
    gaInit();

    const term = new Terminal({
        el: document.querySelector('.terminal'),
        hostname: 'Eli0tz Comput3r',
        profile: '/home/.profile',
        cwd: '/home',
        cursor: 'blink',
        outputAnimation: 'type',
        animateSpeed: 5,
        filesystem: fs
    });

    const nav = document.querySelectorAll('.nav a');
    nav.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault && e.preventDefault();
            const cmd = e.currentTarget.getAttribute("data-command");

            term.cli.onCommand(cmd);
        });
    })
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