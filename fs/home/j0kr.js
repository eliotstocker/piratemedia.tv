 const jokes = {
    'A magic tracktor goes down a road...': 'And Turns into a field',
    'Your IQ is so low...': 'It can be expressed as a boolean',
    'How many programmers does it take to change a lightbulb?...': 'Unfortunately the hardware is unsuitable',
    'An exception occured...': 'Problem exists between Keyboard and chair',
    'Eddie the eagle must have stuck his d*ck in peanut butter...': 'Becuase he\'s f*cking nuts!'
};

class Joke extends Shell.Command {
    run() {
        const joke = Math.floor(Math.random() * Object.keys(jokes).length);

        this.stdOut = Object.keys(jokes)[joke];
        this.stdOut = '---';
        this.stdOut = Object.values(jokes)[joke];

        return Promise.resolve();
    }
}

module.exports = Joke;