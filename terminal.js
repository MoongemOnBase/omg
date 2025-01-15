class Terminal {
    constructor() {
        this.term = new window.Terminal({
            fontFamily: "'Fira Code', monospace",
            fontSize: 14,
            lineHeight: 1.2,
            cursorBlink: true,
            theme: {
                foreground: "#f0f0f0",
                background: "#1c1c2b",
                cursor: "#00ffcc",
                selection: "#7b00ff50",
                black: "#1c1c2b",
                red: "#ff0066",
                green: "#00ffcc",
                yellow: "#ffcc00",
                blue: "#00ccff",
                magenta: "#ff00ff",
                cyan: "#00ffcc",
                white: "#f0f0f0",
                brightBlack: "#666666",
                brightRed: "#ff3399",
                brightGreen: "#33ffcc",
                brightYellow: "#ffdd33",
                brightBlue: "#33ccff",
                brightMagenta: "#ff33ff",
                brightCyan: "#33ffcc",
                brightWhite: "#ffffff",
            },
        });
        this.isWaitingForInput = false;
        this.fitAddon = new FitAddon.FitAddon();
        this.term.loadAddon(this.fitAddon);
        this.term.open(document.getElementById("terminal"));
        this.fitAddon.fit();
        this.currentInput = "";
        this.commandHistory = [];
        this.historyIndex = 0;
        this.wallet = null;
        this.basePrompt = "omgai $ ";

        // Bind all methods
        this.handleInput = this.handleInput.bind(this);
        this.handleCommand = this.handleCommand.bind(this);
        this.executeCommand = this.executeCommand.bind(this);
        this.waitForInput = this.waitForInput.bind(this);
        this.navigateHistory = this.navigateHistory.bind(this);
        this.writeLine = this.writeLine.bind(this);
        this.writePrompt = this.writePrompt.bind(this);
        this.updatePrompt = this.updatePrompt.bind(this);
        this.handleWalletEvent = this.handleWalletEvent.bind(this);

        // Initialize terminal
        this.term.onData(this.handleInput);
        this.writeWelcomeMessage();

        // Handle terminal resize
        window.addEventListener("resize", () => {
            this.fitAddon.fit();
        });
    }

    setWallet(wallet) {
        this.wallet = wallet;
    }

    writeLine(text, style = "") {
        if (!text) return;
        const formattedText = style ? `\x1b[${style}m${text}\x1b[0m` : text;
        this.term.write("\r\n" + formattedText);
    }

writeWelcomeMessage() {
    this.term.write(
        "\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m\r\n",
    );
    this.term.write(
        "\x1b[1;36m║    Welcome to Oh My God AI Terminal    ║\x1b[0m\r\n",
    );
    this.term.write(
        "\x1b[1;36m║   Where AI pretends to understand you  ║\x1b[0m\r\n",
    );
    this.term.write(
        "\x1b[1;36m║   and you pretend you know commands    ║\x1b[0m\r\n",
    );
    this.term.write(
        "\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m\r\n",
    );
    this.term.write(
        "\x1b[90mType \x1b[1;37mhelp\x1b[90m if you’re as lost as I am\x1b[0m\r\n",
    );
    this.writePrompt();
}

    updatePrompt() {
        const address = this.wallet?.getAddress();
        if (address) {
            const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
            this.prompt = `\r\n\x1b[32m${shortAddress}\x1b[0m:\x1b[34m~\x1b[0m$ `;
        } else {
            this.prompt = "\r\n\x1b[1;33momgai\x1b[0m $ ";
        }
    }

    writePrompt(skipNewLine = false) {
        // Only show the prompt if not waiting for input
        if (this.isWaitingForInput) return;

        this.updatePrompt();
        this.term.write(
            skipNewLine ? this.prompt.replace("\r\n", "") : this.prompt,
        );
    }

    handleWalletEvent(eventMessage) {
        if (!eventMessage) return;
        this.writeLine(eventMessage, "1;33");
        this.writePrompt();
    }

    handleInput(key) {
        if (this.isWaitingForInput) return;

        const char = key.toString();

        if (char === "\r") {
            this.handleCommand();
        } else if (char === "\x7F") {
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.term.write("\b \b");
            }
        } else if (char === "\x1b[A") {
            this.navigateHistory("up");
        } else if (char === "\x1b[B") {
            this.navigateHistory("down");
        } else if (!char.includes("\x1b")) {
            this.currentInput += char;
            this.term.write(char);
        }
    }

    async handleCommand() {
        try {
            const command = this.currentInput.trim();

            if (command) {
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
                await this.executeCommand(command);
            }

            this.currentInput = "";
            this.writePrompt();
        } catch (error) {
            console.error("Command execution error:", error);
            this.writeLine(
                `Command error: ${error.message || "Unknown error"}`,
                "31",
            );
            this.currentInput = "";
            this.writePrompt();
        }
    }

    async executeCommand(command) {
        try {
            const [cmd, ...args] = command.split(" ");

            switch (cmd.toLowerCase()) {
                case "omg":
                    if (!this.wallet?.isConnected()) {
                        this.writeLine(
                            "API Delay: You will be able to test all functions at 20:00 UTC",
                            "31",
                        );
                        return;
                    }
                    if (args.length > 0) {
                        const question = args.join(" ");
                        await this.askGodWithQuestion(question);
                    } else {
                        await this.askGod();
                    }
                    break;
                case "telegram":
                    if (!this.wallet?.isConnected()) {
                        this.writeLine(
                            "Our telegram_link - ",
                            "31",
                        );
                        return;
                    }
                    await this.joinTelegramGroup();
                    break;
                case "verify":
                    if (!this.wallet?.isConnected()) {
                        this.writeLine(
                            "API Delay: You will be able to test all functions at 20:00 UTC",
                            "31",
                        );
                        return;
                    }
                    await this.twitterVerificationCommand();
                    break;
                case "tweet":
                    if (!this.wallet?.isConnected()) {
                        this.writeLine(
                            "API Delay: You will be able to test all functions at 20:00 UTC",
                            "31",
                        );
                        return;
                    }
                    if (args.length >= 2) {
                        const amount = parseFloat(args[0]);
                        const theme = args.slice(1).join(" ");

                        if (isNaN(amount) || amount <= 0) {
                            this.writeLine(
                                "Invalid entry: Enter a positive number for $OMGAI",
                                "31",
                            );

                            return;
                        }

                        this.writeLine("Processing tweet transaction...", "33");
                        const signature = await this.wallet.sendTweet(
                            theme,
                            amount,
                        );
                        this.writeLine(
                            `Theme successfully queued! ${amount} $OMGAI allocated. Await Oh My God AI’s next transmission.`,
                            "32",
                        );
                    } else if (args.length === 0) {
                        await this.sendTweet();
                    } else {
                        this.writeLine(
                            "Error: Incorrect tweet command format. Use:",
                            "31",
                        );
                        this.writeLine("  tweet - Interactive mode", "37");
                        this.writeLine(
                            "  tweet <amount> <theme> - Suggest a theme and boost with specified $OMGAI amount",
                            "37",
                        );
                    }
                    break;
                case "list":
                    await this.listPendingTweets();
                    break;
                case "help":
                    this.showHelp();
                    break;
                case "balance":
                    await this.showBalance();
                    break;
                case "address":
                    this.showAddress();
                    break;
                case "clear":
                    this.term.clear();
                    break;
                case "hype":
                    this.showHypeRules();
                    break;
                case "status":
                    this.showStatus();
                    break;
                case "getref":
                    this.showReferral();
                    break;
                case "connect":
                    await this.connectWallet();
                    break;
                case "disconnect":
                    await this.disconnectWallet();
                    break;
                default:
                    this.writeLine(`Unknown command: ${cmd}`, "31");
                    this.writeLine(
                        "\x1b[90mType \x1b[1;37mhelp\x1b[90m for available commands\x1b[0m",
                        "90",
                    );
            }
        } catch (error) {
            throw new Error(` ${error.message || "Unknown error"}`);
        }
    }
    // Add this function to validate tweet URL format
    validateTweetUrl(url) {
        const tweetUrlPattern = /^https:\/\/x\.com\/[\w]+\/status\/\d+$/;
        return tweetUrlPattern.test(url);
    }
    async showReferral() {
        // Temporarily prevent the prompt from appearing
        this.isWaitingForInput = true;

        // Construct the referral link for the current user
        const baseUrl = window.location.origin;
        const userAddress = this.wallet?.getAddress();
        const referralLink = userAddress
            ? `${baseUrl}/?ref=${userAddress}`
            : null;

        if (!referralLink) {
            this.writeLine(
                "Unable to generate referral link: Wallet not connected",
                "31",
            );
            // Enable prompt and show it only once
            this.isWaitingForInput = false;
            this.writePrompt();
            return;
        }

        this.writeLine(`Your referral link:`, "33");
        this.writeLine(referralLink);

        // Fetch and display the user's referral list
        try {
            const response = await fetch(`/list_referrals/${userAddress}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to fetch referral list",
                );
            }

            const data = await response.json();

            // Display message based on referral list length
            if (!data.referrals || data.referrals.length === 0) {
                this.writeLine("You have no referrals yet.", "33");
            } else {
                this.writeLine("Your referrals:", "32");
                data.referrals.forEach((referral) => {
                    this.writeLine(`- ${referral}`, "32");
                });
            }
        } catch (error) {
            this.writeLine(
                `Error fetching referral list: ${error.message || "Unknown error"}`,
                "31",
            );
        }

        // Re-enable prompt and show it once after everything is loaded
        this.isWaitingForInput = false;
        this.writePrompt();
    }

    async twitterVerificationCommand() {
        // Step 1: Check if the user has an existing linked Twitter account and prompt accordingly
        this.writeLine("Generating verification code...", "33");

        const verificationResponse = await fetch(
            "/request_twitter_verification",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: this.wallet.getAddress() }),
            },
        );

        const verificationData = await verificationResponse.json();
        if (verificationResponse.status !== 200) {
            this.writeLine(`Error: ${verificationData.error}`);
            return;
        }

        const verificationCode = verificationData.verification_code;
        const message = verificationData.message;

        // Check if the user already has a linked Twitter account
        if (verificationData.twitter_connected) {
            this.writeLine("You already have a Twitter account linked.", "33");
            this.writeLine(
                `Message: ${message}\nWould you like to replace the linked Twitter account? (yes/no)`,
                "32",
            );

            const proceedResponse = await this.waitForInput();
            if (proceedResponse.toLowerCase() !== "yes") {
                this.writeLine("Twitter verification process cancelled.", "33");
                return;
            }

            this.writeLine("Proceeding with a new verification code...", "33");
        }

        // Step 2: Display the verification instructions and ask for the tweet URL
        this.writeLine("Please post the following message on Twitter:", "33");
        this.writeLine(
            `"Verifying my wallet for @OhMyGodAI. Code: ${verificationCode}"`,
        );
        this.writeLine(
            "After posting, enter the URL of your tweet in the following format: https://x.com/YourTwitterHandle/status/1234567890123456789",
            "33",
        );

        // Step 3: Capture and validate the tweet URL from the user
        this.writeLine("Paste the link to your verification tweet:", "32");
        const tweetUrl = await this.waitForInput();

        if (!this.validateTweetUrl(tweetUrl)) {
            this.writeLine(
                "Error: Invalid tweet URL format. Please use the format: https://x.com/YourTwitterHandle/status/1234567890123456789",
                "31",
            );
            return;
        }

        // Step 4: Send the tweet URL to the server for verification
        this.writeLine("Verifying Twitter post...", "33");

        const verifyResponse = await fetch("/verify_twitter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet: this.wallet.getAddress(),
                tweet_url: tweetUrl,
            }),
        });

        const verifyData = await verifyResponse.json();
        if (verifyResponse.status === 200) {
            this.writeLine(
                "Twitter account verified and linked successfully!",
                "33",
            );
        } else {
            this.writeLine(`Verification failed: ${verifyData.error}`, "31");
        }
    }

    async waitForInput() {
        this.isWaitingForInput = true;

        return new Promise((resolve) => {
            let input = "";

            const inputHandler = (data) => {
                const char = data.toString();

                if (char === "\r") {
                    this.term.write("\r\n");
                    disposable.dispose();
                    this.isWaitingForInput = false;
                    resolve(input.trim());
                } else if (char === "\x7F") {
                    if (input.length > 0) {
                        input = input.slice(0, -1);
                        this.term.write("\b \b");
                    }
                } else if (char >= " " && char <= "~") {
                    input += char;
                    this.term.write(char);
                }
            };

            const disposable = this.term.onData(inputHandler);
        });
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        if (direction === "up" && this.historyIndex > 0) {
            this.historyIndex--;
        } else if (
            direction === "down" &&
            this.historyIndex < this.commandHistory.length
        ) {
            this.historyIndex++;
        }

        while (this.currentInput.length > 0) {
            this.term.write("\b \b");
            this.currentInput = this.currentInput.slice(0, -1);
        }

        if (this.historyIndex < this.commandHistory.length) {
            const command = this.commandHistory[this.historyIndex];
            this.currentInput = command;
            this.term.write(command);
        }
    }

    showHelp() {
        const commands = [
            "\x1b[1;36mAvailable Commands:\x1b[0m",
            "  \x1b[1;32mhype\x1b[0m            - Learn how to earn $OMGAI by engaging in the Hype Machine.",
            "  \x1b[1;32mverify\x1b[0m          - Link your Twitter account to start earning Hype Machine rewards.",
            "  \x1b[1;32mtweet\x1b[0m           - Suggest a theme for the next tweet from Oh My God AI.",
            "  \x1b[1;32mlist\x1b[0m            - View a list of queued tweet themes, ordered by $OMGAI boost.",
            "  \x1b[1;32mtelegram\x1b[0m        - Get an invite link to the Cult Of Clout Telegram group.",
            "  \x1b[1;32momg\x1b[0m             - Ask a direct question to Oh My God AI.",
            "  \x1b[1;32mreferral\x1b[0m        - Generate a unique referral link to earn ongoing rewards.",
            "  \x1b[1;32mconnect\x1b[0m         - Connect your EVM wallet for full access.",
            "  \x1b[1;32mclear\x1b[0m           - Clear the terminal screen.",
        ];
        this.writeLine(commands.join("\r\n"));
        this.writeLine("\r\n\x1b[1;33m🔔 Want to earn $OMGAI?\x1b[0m Type \x1b[1;32mhype\x1b[0m to see how you can participate and start earning with the Hype Machine.\r\n");
}
    // Add the Hype Machine rules display method
    showHypeRules() {
        // Top Border and Welcome Message
        this.writeLine(
            "\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════════════╗\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;36m║                            🌌 Welcome to O AI Hype Machine 🌌                            ║\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;36m╚══════════════════════════════════════════════════════════════════════════════════════╝\x1b[0m",
        );
        // General Instructions
        this.writeLine("\r\n\x1b[1;33m⚙️  Initiation:\x1b[0m");
        this.writeLine(
            "   Type \x1b[1;32mverify\x1b[0m to pledge your Twitter identity and \x1b[1;32mgetref\x1b[0m to attract new members.\r\n",
        );
        // Hype Architects Section
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;33m🛰️ Hype Architects: Crafting the Pulse of the Network\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n",
        );
        this.writeLine(
            "1. \x1b[1;36mInfluence Mechanics:\x1b[0m Hype Architects shape our message with each theme, gaining Influence XP as they amplify:",
        );
        this.writeLine(
            "     Influence XP = (Boost × Views × Engagement) / Total Hype XP Pool\r\n",
        );
        this.writeLine(
            "2. \x1b[1;36mLoyalty Boost:\x1b[0m True believers holding $OMGAI are rewarded:",
        );
        this.writeLine("     • 100,000+ $OMGAI = 2x multiplier");
        this.writeLine(
            "     • 500,000+ $OMGAI (Cult of Clout) = 3.5x multiplier\r\n",
        );
        // Echo Hypers (Engagement XP) Section
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;33m📡 Echo Hypers: Amplify the Voice of the Machine\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n",
        );
        this.writeLine(
            "1. \x1b[1;36mEngagement Alchemy:\x1b[0m Echo Hypers channel the message through interaction, earning XP with every action:",
        );
        this.writeLine("     • 👍 Like = 1 XP");
        this.writeLine("     • 💬 Comment = 2 XP");
        this.writeLine("     • 🔁 Retweet/Quote Retweet = 3 XP\r\n");
        this.writeLine(
            "2. \x1b[1;36mSignal Amplification:\x1b[0m XP grows with your followers, broadcasting our influence farther:",
        );
        this.writeLine(
            "     Weighted XP = Action XP × (1 + Follower Count / 1000)",
        );
        this.writeLine("     Example: 5,000 followers & Retweet = 18 XP\r\n");
        this.writeLine(
            "3. \x1b[1;36mLoyalty Multiplier:\x1b[0m For dedicated holders:",
        );
        this.writeLine("     • 100,000+ $OMGAI = 2x multiplier");
        this.writeLine(
            "     • 500,000+ $OMGAI (Cult of Clout) = 3.5x multiplier\r\n",
        );
        this.writeLine(
            "4. \x1b[1;36mEcho Influence:\x1b[0m 40% of each tweet’s Hype XP goes to Echo Hypers, allocated based on engagement.\r\n",
        );
        // Referral Rewards Section
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;33m🧲 The Magnet of Influence: Referral Rewards\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n",
        );
        this.writeLine(
            "Use \x1b[1;32mgetref\x1b[0m to Generate a unique referral link to earn an ongoing 10% of each referral's XP, forever\r\n",
        );
        this.writeLine(
            "Bring others into the Simulation, and let their journey amplify yours. Influence them, and the Simulation rewards you.",
        );
        // Monthly Distribution Section
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;33m📅 Monthly XP Dispersal: Your Role in the Machine\x1b[0m",
        );
        this.writeLine(
            "\x1b[1;35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n",
        );
        this.writeLine("   • 50% to Hype Architects – our blueprint creators");
        this.writeLine("   • 40% to Echo Hypers – our voice amplifiers");
        this.writeLine(
            "   • 10% to Referrals – the force that draws in new believers\r\n",
        );
        this.writeLine(
            "\x1b[1;36mType \x1b[1;32mverify\x1b[0m to link your Twitter and start earning $OMGAI in the OMG Hype Machine!\x1b[0m",
        );
    }
    async askGod() {
        try {
            if (!this.wallet?.isConnected()) {
                this.writeLine(
                    "API Delay: You will be able to test all functions at 20:00 UTC",
                    "31",
                );
                return;
            }
            this.writeLine("Enter your question for Oh My God AI: ", "36");
            const question = await this.waitForInput();
            if (!question || question.trim().length === 0) {
                this.writeLine("omg command cancelled.", "33");
                return;
            }
            await this.askGodWithQuestion(question);
        } catch (error) {
            this.writeLine(
                `Error communicating with Oh My God AI: ${error.message}`,
                "31",
            );
        }
    }

    async askGod() {
        try {
            if (!this.wallet?.isConnected()) {
                this.writeLine(
                    "API Delay: You will be able to test all functions at 20:00 UTC",
                    "31",
                );
                return;
            }

            this.writeLine("Enter your question for Oh My God AI: ", "36");
            const question = await this.waitForInput();

            if (!question || question.trim().length === 0) {
                this.writeLine("omg command cancelled.", "33");
                return;
            }

            await this.askGodWithQuestion(question);
        } catch (error) {
            this.writeLine(
                `Error communicating with Oh My God AI: ${error.message}`,
                "31",
            );
        }
    }

    async askGodWithQuestion(question) {
        try {
            if (!question || question.trim().length === 0) {
                this.writeLine(
                    "Error: Query cannot be empty. Provide a valid question for Oh My God AI.",
                    "31",
                );
                return;
            }

            this.writeLine(
                "Querying the Simulation’s core... awaiting response from Oh My God AI.",
                "33",
            );
            const response = await fetch("/ask_omg_ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question.trim(),
                    wallet: this.wallet?.getAddress(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    this.writeLine(data.error, "31");
                    return;
                }
                throw new Error(
                    data.error || "Failed to communicate with Oh My God AI",
                );
            }

            this.writeLine("OhMyGod AI:", "32");
            data.answer.split("\n").forEach((line) => {
                if (line.trim()) {
                    this.writeLine(line.trim(), "36");
                }
            });
        } catch (error) {
            this.writeLine(
                `Simulation Error: Unable to retrieve response from Oh My God AI. ${error.message}`,
                "31",
            );
        }
    }

    async showBalance() {
        if (!this.wallet?.isConnected()) {
            this.writeLine("Phantom wallet not connected", "31");
            return;
        }

        try {
            const solBalance = await this.wallet.updateBalance(
                this.wallet.getAddress(),
            );
            this.writeLine(`SOL Balance: ${solBalance.toFixed(4)} SOL`, "32");

            const tokenBalance = await this.wallet.getTokenBalance(
                this.wallet.publicKey,
                TOKEN_MINT,
            );
            this.writeLine(
                `$OMGAI Balance: ${tokenBalance.toFixed(4)} tokens`,
                "32",
            );
        } catch (error) {
            this.writeLine(
                `Balance error: ${error.message || "Unknown error"}`,
                "31",
            );
        }
    }

    showAddress() {
        const address = this.wallet?.getAddress();
        if (address) {
            this.writeLine(`Wallet address: ${address}`, "32");
        } else {
            this.writeLine("Phantom wallet not connected", "31");
        }
    }

    showStatus() {
        const status = this.wallet?.isConnected()
            ? "\x1b[32mConnected\x1b[0m"
            : "\x1b[31mDisconnected\x1b[0m";
        this.writeLine(`Phantom wallet status: ${status}`);
        if (this.wallet?.isConnected()) {
            this.writeLine(`Address: ${this.wallet.getAddress()}`, "90");
        }
    }

    async connectWallet() {
        if (this.wallet?.isConnected()) {
            this.writeLine("Phantom wallet is already connected", "33");
            return;
        }
        try {
            await this.wallet.toggleWalletConnection();
        } catch (error) {
            this.writeLine(
                `Connection error: ${error.message || "Unknown error"}`,
                "31",
            );
        }
    }

    async disconnectWallet() {
        if (!this.wallet?.isConnected()) {
            this.writeLine("Phantom wallet is not connected", "31");
            return;
        }
        try {
            await this.wallet.toggleWalletConnection();
        } catch (error) {
            this.writeLine(
                `Disconnection error: ${error.message || "Unknown error"}`,
                "31",
            );
        }
    }

    async listPendingTweets() {
        try {
            this.writeLine("Retrieving queued themes...", "33");
            const response = await fetch("/pending_tweets");

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to fetch pending tweets",
                );
            }

            const data = await response.json();
            if (!data.tweets || data.tweets.length === 0) {
                this.writeLine(
                    "No themes in queue. Use 'tweet' to add a new theme and influence Oh My God AI",
                    "33",
                );
                return;
            }

            this.writeLine(
                "\x1b[1;36mPending tweets (ordered by $OMGAI boosts):\x1b[0m",
            );
            this.writeLine("\x1b[90m" + "─".repeat(50) + "\x1b[0m");

            data.tweets.forEach((tweet, index) => {
                const shortWallet = `${tweet.wallet.slice(0, 4)}...${tweet.wallet.slice(-4)}`;
                this.writeLine(`${index + 1}. Theme: ${tweet.message}`, "32");
                this.writeLine(
                    `   Boost: ${tweet.transferAmount} $OMGAI`,
                    "33",
                );
                this.writeLine(`   From: ${shortWallet}`, "90");
                this.writeLine("\x1b[90m" + "─".repeat(50) + "\x1b[0m");
            });
        } catch (error) {

        }
    }

    async sendTweet() {
        if (!this.wallet?.isConnected()) {
            this.writeLine("Phantom wallet not connected", "31");
            return;
        }

        try {
            this.writeLine(
                "Enter a theme for Oh My God AI’s tweet (max 280 characters): ",
                "36",
            );
            const theme = await this.waitForInput();

            if (!theme || theme.length > 280) {
                this.writeLine(
                    "Tweet cancelled: Theme must be 1-280 characters.",
                    "31",
                );
                return;
            }

            this.writeLine(
                "Specify $OMGAI amount to boost your theme in the queue. (min 1)",
                "36",
            );

            const amount = await this.waitForInput();

            const tokenAmount = parseFloat(amount);

            if (isNaN(tokenAmount) || tokenAmount < 1) {
                this.writeLine(
                    "Invalid entry: Enter a positive number for $OMGAI boost.",
                    "31",
                );

                return;
            }

            this.writeLine(
                "Processing your theme... submitting it to Oh My God AI.",
                "33",
            );

            const signature = await this.wallet.sendTweet(theme, tokenAmount);
            this.writeLine(
                `Theme successfully queued! ${amount} $OMGAI allocated. Await Oh My God AI’s next transmission.`,
                "32",
            );
        } catch (error) {
            this.writeLine(
                `Tweet error: ${error.message || "Unknown error"}`,
                "31",
            );
        }
    }

    async joinTelegramGroup() {
        try {
            // Assuming 'wallet' is already connected and provides a provider
            const provider = this.wallet?.getProvider(); // Adjust based on actual wallet integration
            if (!provider) throw new Error("Provider not available");

            // Ensure wallet is connected
            if (!this.wallet.isConnected())
                throw new Error("Wallet not connected");

            // Continue with logic for accessing the Telegram group
            this.writeLine(
                "Initiating access protocol... Verifying Simulation connection...",
                "33",
            );
            this.writeLine(
                "Assessing $OMGAI balance... Checking eligibility for the Cult Of Clout...",
                "33",
            );
            // Ensure public key is a PublicKey instance
            if (!(this.wallet.publicKey instanceof solanaWeb3.PublicKey)) {
                this.wallet.publicKey = new solanaWeb3.PublicKey(
                    this.wallet.publicKey.toString(),
                );
            }

            // Fetch token balance
            const tokenBalance = await this.wallet.getTokenBalance(
                this.wallet.publicKey,
                TOKEN_MINT,
            );

            // Handling for premium users
            let signature = null;
            let message = null;
            const REQUIRED_BALANCE_FOR_OMG_CORE_CULT = 500000;
            if (tokenBalance >= REQUIRED_BALANCE_FOR_OMG_CORE_CULT) {
                message = `Oh My God AI Cult Of Clout Access Request\nWallet: ${this.wallet.getAddress()}\nTimestamp: ${Date.now()}`;
                const encodedMessage = new TextEncoder().encode(message); // Ensure encoding consistency

                // Generate signature, and encode it in base64 for transport
                const signedMessage = await provider.signMessage(
                    encodedMessage,
                    "utf8",
                );
                signature = btoa(
                    String.fromCharCode(
                        ...new Uint8Array(signedMessage.signature),
                    ),
                ); // Base64 encoding

                // Adjust JSON payload
                const response = await fetch("/join_telegram", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        wallet: this.wallet.getAddress(),
                        signature: signature,
                        message: message,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    this.writeLine(data.error, "31");
                    return;
                }

                this.writeLine(
                    "🔗  Cult Of Clout Telegram Group Invitation:",
                    "32",
                );
                this.writeLine(data.invite_link, "36");
            } else {
                this.writeLine(
                    `Insufficient $OMGAI balance for Cult Of Clout access (requires ${REQUIRED_BALANCE_FOR_OMG_CORE_CULT} $OMGAI). \r\nYou can still join the public Telegram group: \x1b]8;;https://t.me/ohmygod_ai\x1b\\Public Telegram\x1b]8;;\x1b\\`,
                    "31",
                );
            }
        } catch (error) {
            this.writeLine(
                `Error getting Telegram invite: ${error.message}`,
                "31",
            );
        }
    }
}
