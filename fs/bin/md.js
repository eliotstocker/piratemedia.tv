const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const chalk = require('chalk');

// Force ANSI colours — chalk disables them when there is no TTY (e.g. browser)
chalk.level = 3;

class MD extends Shell.Command {
    get requiresFilesystem() {
        return true;
    }

    run() {
        if(this.arguments.length !== 1) {
            return Promise.reject('md command requires a single argument');
        }

        const file = this.fs.getFileByPath(this.arguments[0]);

        if(!file) {
            return Promise.reject(`${this.arguments[0]}: No such file or directory`);
        }

        if(file.constructor === Object) {
            return Promise.reject(`${this.arguments[0]}: Is a directory`);
        }

        const cols = parseInt(this.context.getVar('COLUMNS'), 10) || 80;
        const renderer = new TerminalRenderer({ width: cols });
        const images = [];

        renderer.link = function(href, title, text) {
            const label = text || href;
            if (!href) return label;
            return `\x1b]8;;${href}\x07${chalk.hex('#00c0ff').underline(label)}\x1b]8;;\x07`;
        };

        renderer.image = function(href, title, text) {
            const token = `@@MD_IMAGE_${images.length}@@`;
            images.push({ token, href, text: text || title || '' });
            return token;
        };

        marked.setOptions({ renderer });

        let output;
        try {
            output = marked(file);
        } catch(e) {
            return Promise.reject('cant parse markdown, is this a valid markdown file?');
        }

        if (images.length === 0) {
            return Promise.resolve(output);
        }

        let ImageViewerCmd = null;
        if (this.context && typeof this.context.getCommand === 'function') {
            ImageViewerCmd = this.context.getCommand('imageviewer') || this.context.getCommand('imageviewer.js');
        }
        if (!ImageViewerCmd && this.fs && typeof this.fs.loadModule === 'function') {
            try {
                ImageViewerCmd = this.fs.loadModule('/bin/imageviewer.js');
            } catch (e) {}
        }

        const imgWidth = Math.min(cols, 24);

        return Promise.all(images.map(async (img) => {
            if (!ImageViewerCmd) {
                return { token: img.token, rendered: img.text ? `[${img.text}]` : '' };
            }
            try {
                const viewer = new ImageViewerCmd([img.href, String(imgWidth)], this.context);
                viewer.fs = this.fs;
                const rendered = await viewer.run();
                return { token: img.token, rendered: `\n${rendered}\n` };
            } catch (e) {
                const fallback = img.text || 'image';
                const label = img.href
                    ? `\x1b]8;;${img.href}\x07${chalk.dim(`[${fallback}]`)}\x1b]8;;\x07`
                    : chalk.dim(`[${fallback}]`);
                return { token: img.token, rendered: label };
            }
        })).then((results) => {
            for (const { token, rendered } of results) {
                output = output.replace(token, rendered);
            }
            return output;
        });
    }
}

module.exports = MD;