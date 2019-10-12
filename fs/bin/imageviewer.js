const PNGReader = require('png.js');
const colors = require('ansi-256-colors');

const CHAR_HALF_BLOCK = String.fromCharCode(9604);

function printDouble (buffer, done) {
    const reader = new PNGReader(buffer);
    reader.parse(function (err, png) {
        if (err) return done(err);
        let s = '';
        for (let y = 0; y < png.getHeight() - 1; y += 2) {
            if (s) s += colors.reset + '\n';
            for (let x = 0; x < png.getWidth(); x++) {
                const p1 = png.getPixel(x, y);
                const p2 = png.getPixel(x, y + 1);
                const r1 = Math.round(p1[0] / 255 * 5);
                const g1 = Math.round(p1[1] / 255 * 5);
                const b1 = Math.round(p1[2] / 255 * 5);
                const r2 = Math.round(p2[0] / 255 * 5);
                const g2 = Math.round(p2[1] / 255 * 5);
                const b2 = Math.round(p2[2] / 255 * 5);
                if (p1[3] === 0) {
                    s += colors.reset + ' ';
                } else {
                    s += colors.bg.getRgb(r1, g1, b1) + colors.fg.getRgb(r2, g2, b2) + CHAR_HALF_BLOCK;
                }
            }
        }
        s += colors.reset;
        done(null, s)
    })
}

function _base64ToArrayBuffer(base64) {
    const binary_string =  window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array( len );
    for (let i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

class ImageViewer extends Shell.Command {
    get requiresFilesystem() {
        return true;
    }

    run() {
        if(this.arguments.length !== 1) {
            return Promise.reject('ImageViewer command requires a single argument');
        }

        const file = this.fs.getFileByPath(this.arguments[0]);

        if(!file) {
            return Promise.reject(`${this.arguments[0]}: No such file or directory`);
        }

        if(file.constructor === Object) {
            return Promise.reject(`${this.arguments[0]}: Is a directory`);
        }

        if(!file.startsWith('data:image/png')) {
            return Promise.reject(`${this.arguments[0]}: Invalid file type, required png`);
        }

        const buffer = new _base64ToArrayBuffer(file.substring('data:image/png;base64,'.length));

        return new Promise((resolve, reject) => {
            printDouble(buffer, (err, string) => {
                if(err) {
                    return reject(err);
                }
                return resolve(string);
            });
        });
    }
}

module.exports = ImageViewer;