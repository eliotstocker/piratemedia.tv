class Sendmail extends Shell.Command {
    run() {
        if(this.arguments.length != 0) {
            return Promise.reject('sendmail doesnt have any arguments yet.');
        }

        window.location = 'mailto:eliot@piragemedia.tv';

        return Promise.resolve("Launching Email App");
    }
}

module.exports = Sendmail;