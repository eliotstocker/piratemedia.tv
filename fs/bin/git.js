class Git extends Shell.Command {
    run() {
        if(this.arguments.length != 1) {
            return Promise.reject('git command requires a single sub command');
        }

        switch(this.arguments[0]) {
            case "pull":
            case "clone":
                window.location = 'https://github.com/eliotstocker/Brsh-JS';
                break;
            default:
                window.location = 'https://github.com/eliotstocker';
        }

        return Promise.resolve("Redirecting to github, please wait...");
    }
}

module.exports = Git;