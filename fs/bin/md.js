const marked = require('marked');
const TerminalRenderer = require('marked-terminal');

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

        marked.setOptions({
            renderer: new TerminalRenderer()
        });

        try {
            return Promise.resolve(marked(file));
        } catch(e) {
            return Promise.reject('cant parse markdown, is this a valid markdown file?');
        }
    }
}

module.exports = MD;