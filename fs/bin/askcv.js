class AskCv extends Shell.Command {
    get requiresFilesystem() {
        return true;
    }

    get captureInput() {
        return this._subCommand ? this._subCommand.captureInput : false;
    }

    onInput(char) {
        if (this._subCommand && typeof this._subCommand.onInput === 'function') {
            this._subCommand.onInput(char);
        }
    }

    async run() {
        const args = [...(this.arguments || [])];

        if (args.includes('--help') || args.includes('-h')) {
            this.stdOut = 'askcv - Ask questions about Eliot Stocker using local AI (wllama)';
            this.stdOut = '';
            this.stdOut = 'Usage:';
            this.stdOut = '  askcv "<question>"    Ask a question about Eliot\'s experience';
            this.stdOut = '  askcv                 Start an interactive chat session about Eliot\'s CV';
            this.stdOut = '';
            this.stdOut = 'Examples:';
            this.stdOut = '  askcv "What did Eliot do at Snyk?"';
            this.stdOut = '  askcv "Tell me about Eliot\'s leadership experience"';
            this.stdOut = '  askcv "What technologies does Eliot have experience with?"';
            return;
        }

        // 1. Ensure wllama is installed via wbt
        let WllamaCmd = this.context.getCommand('wllama');
        if (!WllamaCmd) {
            const WbtCmd = this.context.getCommand('wbt') || (typeof globalThis.Wbt !== 'undefined' ? globalThis.Wbt : null);
            if (!WbtCmd) {
                return Promise.reject(new Error('wbt package manager is not available'));
            }
            this.stdOut = 'wllama engine not found. Installing wllama via wbt...';
            this.flush();
            const wbt = new WbtCmd(['install', 'wllama'], this.context);
            wbt.on('stdout', data => { this.stdOut = data; this.flush(); });
            wbt.on('stderr', data => { this.stdErr = data; this.flush(); });
            await wbt.runCommand();
            WllamaCmd = this.context.getCommand('wllama');
            if (!WllamaCmd) {
                return Promise.reject(new Error('Failed to install wllama'));
            }
        }

        // 2. Read CV files from virtual filesystem
        const cvFiles = [
            '/work/cv/title.md',
            '/work/cv/contact.md',
            '/work/cv/info.md',
            '/work/cv/employment/01-attest.md',
            '/work/cv/employment/05-snyk.md',
            '/work/cv/employment/10-brandwatch.md',
            '/work/cv/employment/20-rto.md',
            '/work/cv/employment/30-freelance.md',
            '/work/cv/employment/40-noonan.md',
            '/work/cv/references.md',
            '/work/cv/other.md'
        ];

        const fsObj = this.fs || (this.context && this.context.fs);
        let cvData = '';
        for (const file of cvFiles) {
            if (fsObj && typeof fsObj.getFileByPath === 'function') {
                const content = fsObj.getFileByPath(file);
                if (content && typeof content === 'string') {
                    cvData += `\n\n--- ${file} ---\n${content.trim()}`;
                }
            }
        }

        // 3. Build system prompt
        const systemPrompt = [
            'You are an AI assistant answering questions about Eliot Stocker based on his CV and professional experience.',
            'Be concise, accurate, helpful, and professional.',
            'Only answer questions using the CV data below. If something is not covered, state that you do not have that information.',
            '',
            '=== ELIOT STOCKER CV DATA ===',
            cvData.trim(),
            '=== END CV DATA ==='
        ].join('\n');

        // 4. Construct wllama arguments
        const question = args.join(' ').trim();
        const wllamaArgs = [
            '--hf', 'Qwen/Qwen2.5-0.5B-Instruct-GGUF',
            '--quant', 'Q4_K_M',
            '-s', systemPrompt
        ];

        if (question) {
            wllamaArgs.push('-p', question);
        }

        // 5. Run wllama
        const wllama = new WllamaCmd(wllamaArgs, this.context);
        wllama.fs = fsObj;
        this._subCommand = wllama;

        wllama.on('stdout', chunk => this.stdout.write(chunk));
        wllama.on('stderr', chunk => this.stderr.write(chunk));
        wllama.on('flush', data => {
            if (Array.isArray(data)) {
                for (const line of data) {
                    if (line && line.string) {
                        if (line.type === 'err') this.stdErr = line.string;
                        else this.stdOut = line.string;
                    }
                }
                this.flush();
            }
        });

        const result = await wllama.runCommand();
        if (result && typeof result.getStdOutput === 'function') {
            const lines = result.getStdOutput();
            for (const l of lines) {
                if (l && l.string) {
                    if (l.type === 'err') this.stdErr = l.string;
                    else this.stdOut = l.string;
                }
            }
        }
        if (result && typeof result.getExitCode === 'function') {
            this.exitCode = result.getExitCode();
        }
    }
}

module.exports = AskCv;
