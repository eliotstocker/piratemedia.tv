class Reset extends Shell.Command {
    static get name() { return 'reset'; }

    async run() {
        this.write('Resetting terminal filesystem to factory defaults...\r\n');
        if (typeof globalThis.resetFilesystem === 'function') {
            await globalThis.resetFilesystem();
        } else {
            try {
                localStorage.removeItem('pmtv-fs-hash');
            } catch (_) {}
            if (typeof indexedDB !== 'undefined') {
                try {
                    indexedDB.deleteDatabase('brsh_fs_storage');
                } catch (_) {}
            }
        }
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
            }
        }, 400);
        return Promise.resolve();
    }
}

module.exports = Reset;
