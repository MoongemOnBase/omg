const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const SPL_ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);
const TOKEN_MINT = new solanaWeb3.PublicKey(
    "AouLuBH1hxtj6pRPF8Fswe99ueB5DhDYunAeWfu8pump",
);

const Buffer = buffer.Buffer;

class SolanaWallet {
    constructor() {
        this.initializeProperties();
        this.isFirstLogin = localStorage.getItem("hasLoggedIn") !== "true"; // Flag to check if it's the first login in this session
        this.setupWallet();
    }

    setupWallet() {
        try {
            console.log("Initializing wallet interface...");
            this.initializeElements();
            this.initializeTerminal();

            if (!this.isPhantomInstalled()) {
            }
            this.explainer = document.getElementById("explainer");
            this.setupPhantomListeners();
            this.checkWalletConnection();
            this.addEventListeners();
        } catch (error) {
            console.error("Error setting up wallet connection.", {
                code: error.code || "INIT_ERROR",
                message: this.getErrorMessage(error),
            });
            this.handleError(error);
        }
    }

    initializeProperties() {
        const heliusUrl =
            "https://rpc.helius.xyz/?api-key=" + window.HELIUS_API_KEY;
        this.connection = new solanaWeb3.Connection(heliusUrl, "confirmed");
        this.maxRetries = 3;
        this.initialDelay = 1500;
        this.publicKey = null;
        this.terminal = null;
        this.isReconnecting = false;
        this.balanceInterval = null;
        this.lastAccountChange = null;
        this.isAutoConnecting = false;
    }

    getErrorMessage(error) {
        return error?.message || error?.toString() || "Unknown error occurred";
    }

    async connectWallet() {
        try {
            console.log("Inside connectWallet function...");
            const provider = this.getProvider();
            if (!provider) throw new Error("API Delay: You will be able to connect wallet at 20:00 UTC");

            const response = await provider.connect();
            console.log("Wallet connected:", response.publicKey.toString());
            await this.handleSuccessfulConnection(response.publicKey);

            // Only save referral on the first login
            if (this.isFirstLogin) {
                console.log("First login detected, saving referral...");
                const saved = await this.saveReferral(response.publicKey.toString());

                // Set isFirstLogin to false and update localStorage
                this.isFirstLogin = false;
                localStorage.setItem("hasLoggedIn", "true"); // Set the flag in localStorage
            }

            return true;
        } catch (error) {
            this.terminal.writeLine(` Unable to connect wallet - ${error.message}`);
            console.error("Connection error:", error);
            return false;
        }
    }


    // Save referral information on the first login
    async saveReferral(userWallet) {
        try {
            const response = await fetch("/connect_wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_wallet: userWallet }),
            });
            const data = await response.json();
            return data.message === "Referral saved successfully"; // Return true if saved
        } catch (error) {
            console.error("Error saving referral:", error);
            return false;
        }
    }

    handleError(error) {
        const errorMessage = this.getErrorMessage(error);
        console.error("Wallet error:", errorMessage);
        this.terminal?.writeLine(`${errorMessage}`);
        return errorMessage;
    }

    async getTokenBalance(walletAddress, tokenMintAddress) {
        try {
            const tokenAccountAddress = await this.findAssociatedTokenAccount(
                walletAddress,
                tokenMintAddress,
            );
            const tokenAccountInfo =
                await this.connection.getParsedAccountInfo(tokenAccountAddress);

            if (!tokenAccountInfo || !tokenAccountInfo.value) {
                return 0;
            }

            const balance =
                tokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;
            return balance;
        } catch (error) {
            console.error("Error fetching token balance:", error);
            throw new Error("Failed to retrieve token balance.");
        }
    }

    async findAssociatedTokenAccount(walletAddress, tokenMintAddress) {
        const [associatedTokenAddress] =
            await solanaWeb3.PublicKey.findProgramAddress(
                [
                    walletAddress.toBuffer(),
                    TOKEN_PROGRAM_ID.toBuffer(),
                    tokenMintAddress.toBuffer(),
                ],
                SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
            );
        return associatedTokenAddress;
    }

    async sendTweet(message, amount = 1) {
        try {
            const provider = this.getProvider();
            if (!provider) throw new Error("API Delay: You will be able to connect wallet at 20:00 UTC");
            if (!this.isConnected()) throw new Error("API Delay: You will be able to connect wallet at 20:00 UTC");

            if (!(this.publicKey instanceof solanaWeb3.PublicKey)) {
                this.publicKey = new solanaWeb3.PublicKey(
                    this.publicKey.toString(),
                );
            }

            const userTokenBalance = await this.getTokenBalance(
                this.publicKey,
                TOKEN_MINT,
            );
            if (userTokenBalance < amount) {
                throw new Error(
                    `Insufficient token balance. You have ${userTokenBalance} but need ${amount}.`,
                );
            }

            const recipientAddress = new solanaWeb3.PublicKey(
                "2CwtEVaKMyRgy9Z8Ed7P2s96aNGHKDzDconzYQUAn1xb",
            );
            const recipientTokenAccount = await this.findAssociatedTokenAccount(
                recipientAddress,
                TOKEN_MINT,
            );

            const recipientAccountInfo = await this.connection.getAccountInfo(
                recipientTokenAccount,
            );
            const transaction = new solanaWeb3.Transaction();

            if (!recipientAccountInfo) {
                const createAtaIx = new solanaWeb3.TransactionInstruction({
                    programId: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
                    keys: [
                        {
                            pubkey: this.publicKey,
                            isSigner: true,
                            isWritable: true,
                        },
                        {
                            pubkey: recipientTokenAccount,
                            isSigner: false,
                            isWritable: true,
                        },
                        {
                            pubkey: recipientAddress,
                            isSigner: false,
                            isWritable: false,
                        },
                        {
                            pubkey: TOKEN_MINT,
                            isSigner: false,
                            isWritable: false,
                        },
                        {
                            pubkey: solanaWeb3.SystemProgram.programId,
                            isSigner: false,
                            isWritable: false,
                        },
                        {
                            pubkey: TOKEN_PROGRAM_ID,
                            isSigner: false,
                            isWritable: false,
                        },
                        {
                            pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY,
                            isSigner: false,
                            isWritable: false,
                        },
                    ],
                    data: Buffer.from([1]),
                });
                transaction.add(createAtaIx);
            }

            const senderTokenAccount = await this.findAssociatedTokenAccount(
                this.publicKey,
                TOKEN_MINT,
            );
            if (!senderTokenAccount) {
                throw new Error("Sender token account not found");
            }

            const mintInfo =
                await this.connection.getParsedAccountInfo(TOKEN_MINT);
            const tokenDecimals = mintInfo.value.data.parsed.info.decimals;

            const transferAmount = amount * Math.pow(10, tokenDecimals);
            const transferAmountBuffer = Buffer.alloc(8);
            transferAmountBuffer.writeBigUInt64LE(BigInt(transferAmount));

            const transferInstruction = new solanaWeb3.TransactionInstruction({
                programId: TOKEN_PROGRAM_ID,
                keys: [
                    {
                        pubkey: senderTokenAccount,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: recipientTokenAccount,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: this.publicKey,
                        isSigner: true,
                        isWritable: false,
                    },
                ],
                data: Buffer.concat([Buffer.from([3]), transferAmountBuffer]),
            });
            transaction.add(transferInstruction);

            const MEMO_PROGRAM_ID = new solanaWeb3.PublicKey(
                "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
            );
            const memoIx = new solanaWeb3.TransactionInstruction({
                keys: [],
                programId: MEMO_PROGRAM_ID,
                data: Buffer.from(message, "utf8"),
            });
            transaction.add(memoIx);

            transaction.feePayer = this.publicKey;
            const { blockhash, lastValidBlockHeight } =
                await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            const signed = await provider.signAndSendTransaction(transaction);

            const confirmation = await this.connection.confirmTransaction({
                signature: signed.signature,
                blockhash: transaction.recentBlockhash,
                lastValidBlockHeight,
            });

            if (confirmation.value.err) {
                throw new Error(
                    `Transaction failed: ${confirmation.value.err}`,
                );
            }

            const tweet = {
                message,
                wallet: this.publicKey.toString(),
                timestamp: new Date().toISOString(),
                transferAmount: amount,
                transactionSignature: signed.signature,
            };

            const response = await fetch("/tweet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tweet),
            });

            if (!response.ok) throw new Error("Failed to store tweet");
            await this.updateBalance(this.publicKey.toString());
            return signed.signature;
        } catch (error) {
            console.error("Tweet error:", error);
            throw error;
        }
    }

    async checkWalletConnection() {
        try {
            this.terminal?.handleWalletEvent("");
            const provider = this.getProvider();

            if (!provider) {
                this.terminal?.handleWalletEvent(
                );
                return;
            }

            try {
                this.isAutoConnecting = true;
                const resp = await provider.connect({ onlyIfTrusted: true });
                if (resp.publicKey) {
                    await this.handleSuccessfulConnection(
                        resp.publicKey,
                        false,
                    );
                    this.terminal?.handleWalletEvent(
                        "Restored existing Phantom wallet connection",
                    );
                }
            } catch (err) {
                this.terminal?.handleWalletEvent("");
            } finally {
                this.isAutoConnecting = false;
            }
        } catch (error) {
            console.error("Wallet check error:", {
                error,
                message: this.getErrorMessage(error),
            });
            this.handleError(error);
        }
    }

    getAddress() {
        return this.publicKey?.toString();
    }

    isConnected() {
        return this.publicKey !== null;
    }

    async handleSuccessfulConnection(publicKey, shouldPrintMessage = true) {
        if (!publicKey) throw new Error("Invalid wallet public key");

        const currentAddress = this.publicKey?.toString();
        const newAddress = publicKey.toString();

        if (currentAddress !== newAddress) {
            this.publicKey = new solanaWeb3.PublicKey(newAddress);
            await this.updateBalance(newAddress);
            await window.solanaWallet.connectWallet();
            if (shouldPrintMessage && !this.isAutoConnecting) {
                this.terminal?.handleWalletEvent(
                    "Wallet connected successfully",
                );
            }
            this.updateUI(true);
        }
    }

    isPhantomInstalled() {
        const provider = this.getProvider();
        return !!provider;
    }

    getProvider() {
        if ("phantom" in window) {
            const provider = window.phantom?.solana;
            if (provider?.isPhantom) return provider;
        }
        return null;
    }

    initializeElements() {
        this.statusIndicator = document.getElementById("statusIndicator");
        this.connectionStatus = document.getElementById("connectionStatus");
        this.walletAddress = document.getElementById("walletAddress");
        this.balanceContainer = document.getElementById("balanceContainer");
        this.solBalance = document.getElementById("solBalance");
        this.errorAlert = document.getElementById("errorAlert");
    }

    initializeTerminal() {
        this.terminal = new Terminal();
        this.terminal.setWallet(this);
    }

    setupPhantomListeners() {
        const provider = this.getProvider();
        if (provider) {
            provider.on("connect", this.handleConnect.bind(this));
            provider.on("disconnect", this.handleDisconnect.bind(this));
            provider.on("accountChanged", this.handleAccountChanged.bind(this));
        }
    }

    addEventListeners() {
        this.connectButton?.addEventListener("click", () =>
            this.toggleWalletConnection(),
        );
    }

    async handleConnect(publicKey) {
        try {
            await this.handleSuccessfulConnection(
                publicKey,
                !this.isAutoConnecting,
            );
        } catch (error) {
            this.handleError(error);
        }
    }

    handleDisconnect() {
        if (this.publicKey) {
            this.publicKey = null;
            this.updateUI(false);
            if (this.balanceInterval) {
                clearInterval(this.balanceInterval);
                this.balanceInterval = null;
            }
            this.terminal?.handleWalletEvent("Wallet disconnected");
        }
    }

    async handleAccountChanged(newPublicKey) {
        try {
            if (!newPublicKey) {
                this.handleDisconnect();
                return;
            }

            const currentTime = Date.now();
            const newAddress = newPublicKey.toString();
            const currentAddress = this.publicKey?.toString();

            if (
                currentAddress !== newAddress &&
                (!this.lastAccountChange ||
                    currentTime - this.lastAccountChange > 1000)
            ) {
                this.lastAccountChange = currentTime;
                await this.handleSuccessfulConnection(newPublicKey, false);
                this.terminal?.handleWalletEvent("Wallet account changed");
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async toggleWalletConnection() {
        try {
            const provider = this.getProvider();
            if (!provider) throw new Error("API Delay: You will be able to connect wallet at 20:00 UTC");

            if (this.isConnected()) {
                await provider.disconnect();
            } else {
                const resp = await provider.connect();
                await this.handleSuccessfulConnection(resp.publicKey, true);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    updateUI(isConnected) {
        if (this.statusIndicator && this.connectionStatus) {
            this.statusIndicator.className = `status-dot ${isConnected ? "connected" : "disconnected"}`;
            this.connectionStatus.textContent = isConnected
                ? "Connected"
                : "Disconnected";
        }

        if (this.connectButton) {
            this.connectButton.textContent = isConnected
                ? "Disconnect Wallet"
                : "Wallet connection at 00:00 UTC";
        }

        if (this.explainer) {
            const shouldBeVisible = isConnected && this.publicKey;
            this.explainer.classList.toggle("d-none", shouldBeVisible);
        }

        if (this.balanceContainer) {
            this.balanceContainer.classList.toggle("d-none", !isConnected);
        }
    }

    async updateBalance(address) {
        try {
            const balance = await this.connection.getBalance(
                new solanaWeb3.PublicKey(address),
            );
            const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
            if (this.solBalance) {
                this.solBalance.textContent = solBalance.toFixed(4);
            }
            return solBalance;
        } catch (error) {
            console.error("Balance update error:", error);
            throw error;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        console.log("Initializing SolanaWallet...");
        window.solanaWallet = new SolanaWallet();
    } catch (error) {
        console.error("Initialization error:", error);
    }
});
