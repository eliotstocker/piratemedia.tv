const colors = require('ansi-256-colors');

const CHAR_HALF_BLOCK = String.fromCharCode(9604);

function printDouble(dataUri, width) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
            const cols = width || 80;
            const rows = Math.round(cols * (img.naturalHeight / img.naturalWidth) / 2);

            const canvas = document.createElement('canvas');
            canvas.width = cols;
            canvas.height = rows * 2;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, cols, rows * 2);
            const { data } = ctx.getImageData(0, 0, cols, rows * 2);

            let s = '';
            for (let y = 0; y < rows * 2 - 1; y += 2) {
                if (s) s += colors.reset + '\n';
                for (let x = 0; x < cols; x++) {
                    const i1 = (y * cols + x) * 4;
                    const i2 = ((y + 1) * cols + x) * 4;
                    const r1 = Math.round(data[i1]     / 255 * 5);
                    const g1 = Math.round(data[i1 + 1] / 255 * 5);
                    const b1 = Math.round(data[i1 + 2] / 255 * 5);
                    const r2 = Math.round(data[i2]     / 255 * 5);
                    const g2 = Math.round(data[i2 + 1] / 255 * 5);
                    const b2 = Math.round(data[i2 + 2] / 255 * 5);
                    if (data[i1 + 3] === 0) {
                        s += colors.reset + ' ';
                    } else {
                        s += colors.bg.getRgb(r1, g1, b1) + colors.fg.getRgb(r2, g2, b2) + CHAR_HALF_BLOCK;
                    }
                }
            }
            s += colors.reset;
            resolve(s);
        };
        img.src = dataUri;
    });
}

class ImageViewer extends Shell.Command {
    get requiresFilesystem() {
        return true;
    }

    run() {
        if (this.arguments.length < 1 || this.arguments.length > 2) {
            return Promise.reject('Usage: imageviewer <file> [width]');
        }

        const file = this.fs.getFileByPath(this.arguments[0]);

        if (!file) {
            return Promise.reject(`${this.arguments[0]}: No such file or directory`);
        }

        if (file.constructor === Object) {
            return Promise.reject(`${this.arguments[0]}: Is a directory`);
        }

        const cols = parseInt(this.context.getVar('COLUMNS'), 10) || 80;
        const width = this.arguments[1] ? parseInt(this.arguments[1], 10) : cols;

        const fileStr = file.toString();
        if (!fileStr.startsWith('data:')) {
            return Promise.reject(`${this.arguments[0]}: Unsupported file format`);
        }

        return printDouble(fileStr, width);
    }
}

module.exports = ImageViewer;