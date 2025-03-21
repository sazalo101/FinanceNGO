// Financial Inclusion Toolkit for NGOs on Stellar Testnet
// This implementation includes:
// 1. Aid Distribution System
// 2. Offline Transaction Management
// 3. Conditional Transfers via Smart Contracts
// 4. Analytics Dashboard Integration

const StellarSdk = require('stellar-sdk');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

// Configure Stellar testnet
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

// Initialize our application
const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// ------------------------------------------
// 1. AID DISTRIBUTION SYSTEM
// ------------------------------------------

/**
 * Create a new NGO account on the Stellar testnet
 * @returns {Object} Object containing the public and secret keys
 */
async function createNGOAccount() {
    // Generate a new keypair
    const pair = StellarSdk.Keypair.random();
    
    try {
        // Fund the account using Friendbot (testnet only)
        await fetch(
            `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`
        );
        
        return {
            publicKey: pair.publicKey(),
            secretKey: pair.secret()
        };
    } catch (error) {
        console.error('Error creating NGO account:', error);
        throw error;
    }
}

/**
 * Create a new beneficiary account
 * @param {string} ngoSecretKey - Secret key of the NGO funding the account
 * @param {string} initialBalance - Initial XLM amount for the beneficiary
 * @returns {Object} The new beneficiary account details
 */
async function createBeneficiaryAccount(ngoSecretKey, initialBalance = '5') {
    const ngoKeypair = StellarSdk.Keypair.fromSecret(ngoSecretKey);
    const beneficiaryKeypair = StellarSdk.Keypair.random();
    
    try {
        // Load NGO account
        const ngoAccount = await server.loadAccount(ngoKeypair.publicKey());
        
        // Create transaction to create beneficiary account
        const transaction = new StellarSdk.TransactionBuilder(ngoAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase
        })
        .addOperation(StellarSdk.Operation.createAccount({
            destination: beneficiaryKeypair.publicKey(),
            startingBalance: initialBalance
        }))
        .setTimeout(30)
        .build();
        
        // Sign the transaction
        transaction.sign(ngoKeypair);
        
        // Submit the transaction
        await server.submitTransaction(transaction);
        
        return {
            publicKey: beneficiaryKeypair.publicKey(),
            secretKey: beneficiaryKeypair.secret()
        };
    } catch (error) {
        console.error('Error creating beneficiary account:', error);
        throw error;
    }
}

/**
 * Distribute tokens to multiple beneficiaries
 * @param {string} ngoSecretKey - Secret key of the distributing NGO
 * @param {Array} beneficiaries - Array of objects containing beneficiary publicKey and amount
 * @param {string} assetCode - Code of the asset to distribute (use "XLM" for native token)
 * @returns {Object} Result of the distribution transaction
 */
async function distributeFunds(ngoSecretKey, beneficiaries, assetCode = "XLM") {
    const ngoKeypair = StellarSdk.Keypair.fromSecret(ngoSecretKey);
    
    try {
        // Load NGO account
        const ngoAccount = await server.loadAccount(ngoKeypair.publicKey());
        
        // Create a transaction builder
        const transactionBuilder = new StellarSdk.TransactionBuilder(ngoAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase
        });
        
        // Add payment operations for each beneficiary
        for (const beneficiary of beneficiaries) {
            if (assetCode === "XLM") {
                transactionBuilder.addOperation(StellarSdk.Operation.payment({
                    destination: beneficiary.publicKey,
                    asset: StellarSdk.Asset.native(),
                    amount: beneficiary.amount.toString()
                }));
            } else {
                // For custom assets (not implemented in this example)
                // Would need to create and issue the asset first
                console.log("Custom asset distribution not implemented in this example");
            }
        }
        
        // Build and sign the transaction
        const transaction = transactionBuilder
            .setTimeout(100)
            .build();
        
        transaction.sign(ngoKeypair);
        
        // Submit the transaction
        const result = await server.submitTransaction(transaction);
        return result;
    } catch (error) {
        console.error('Error distributing funds:', error);
        throw error;
    }
}

// ------------------------------------------
// 2. OFFLINE TRANSACTION CAPABILITY
// ------------------------------------------

/**
 * Generate offline transaction that can be submitted later
 * @param {string} senderSecretKey - Secret key of the sender
 * @param {string} recipientPublicKey - Public key of the recipient
 * @param {string} amount - Amount to send
 * @returns {Object} The signed transaction and transaction XDR
 */
async function generateOfflineTransaction(senderSecretKey, recipientPublicKey, amount) {
    const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
    
    try {
        // Load sender account
        const senderAccount = await server.loadAccount(senderKeypair.publicKey());
        
        // Create a transaction
        const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: recipientPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
        }))
        .setTimeout(0) // No timeout for offline transactions
        .build();
        
        // Sign the transaction
        transaction.sign(senderKeypair);
        
        // Convert to XDR format for storage
        const transactionXDR = transaction.toXDR();
        
        return {
            transaction: transaction,
            xdr: transactionXDR
        };
    } catch (error) {
        console.error('Error generating offline transaction:', error);
        throw error;
    }
}

/**
 * Submit a previously generated offline transaction
 * @param {string} transactionXDR - The XDR representation of the signed transaction
 * @returns {Object} Result of the transaction submission
 */
async function submitOfflineTransaction(transactionXDR) {
    try {
        // Convert XDR back to a transaction object
        const transaction = StellarSdk.TransactionBuilder.fromXDR(
            transactionXDR,
            networkPassphrase
        );
        
        // Submit the transaction
        const result = await server.submitTransaction(transaction);
        return result;
    } catch (error) {
        console.error('Error submitting offline transaction:', error);
        throw error;
    }
}

/**
 * Batch and store offline transactions for later submission
 * @param {Array} transactions - Array of transaction XDRs to store
 * @param {string} filename - Filename to store the transactions
 */
function storeOfflineTransactions(transactions, filename) {
    try {
        const data = JSON.stringify(transactions);
        fs.writeFileSync(filename, data);
        console.log(`Stored ${transactions.length} transactions in ${filename}`);
    } catch (error) {
        console.error('Error storing offline transactions:', error);
        throw error;
    }
}

/**
 * Load and submit stored offline transactions
 * @param {string} filename - Filename containing stored transactions
 * @returns {Array} Results of the transaction submissions
 */
async function submitStoredTransactions(filename) {
    try {
        const data = fs.readFileSync(filename);
        const transactions = JSON.parse(data);
        
        const results = [];
        for (const txXDR of transactions) {
            try {
                const result = await submitOfflineTransaction(txXDR);
                results.push({
                    success: true,
                    result: result
                });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error submitting stored transactions:', error);
        throw error;
    }
}

// ------------------------------------------
// 3. CONDITIONAL TRANSFERS (SMART CONTRACTS)
// ------------------------------------------

/**
 * Create a time-locked transaction that can only be redeemed after a certain time
 * @param {string} senderSecretKey - Secret key of the sender
 * @param {string} recipientPublicKey - Public key of the recipient
 * @param {string} amount - Amount to send
 * @param {Date} unlockDate - Date when the funds can be claimed
 * @returns {Object} The signed transaction and transaction XDR
 */
async function createTimeLockedTransfer(senderSecretKey, recipientPublicKey, amount, unlockDate) {
    const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
    
    try {
        // Load sender account
        const senderAccount = await server.loadAccount(senderKeypair.publicKey());
        
        // Calculate the UNIX timestamp for the unlock date
        const timeBounds = {
            minTime: Math.floor(unlockDate.getTime() / 1000).toString(),
            maxTime: 0 // 0 means no upper time bound
        };
        
        // Create a transaction with time bounds
        const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase,
            timebounds: timeBounds
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: recipientPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
        }))
        .build();
        
        // Sign the transaction
        transaction.sign(senderKeypair);
        
        // Convert to XDR format for storage
        const transactionXDR = transaction.toXDR();
        
        return {
            transaction: transaction,
            xdr: transactionXDR,
            unlockDate: unlockDate
        };
    } catch (error) {
        console.error('Error creating time-locked transfer:', error);
        throw error;
    }
}

/**
 * Create a multi-signature escrow account requiring approval from multiple parties
 * @param {string} ngoSecretKey - Secret key of the NGO
 * @param {string} beneficiaryPublicKey - Public key of the beneficiary
 * @param {string} thirdPartyPublicKey - Public key of the third party (e.g., local official)
 * @param {string} amount - Amount to place in escrow
 * @returns {Object} Details of the escrow account
 */
async function createMultiSigEscrow(ngoSecretKey, beneficiaryPublicKey, thirdPartyPublicKey, amount) {
    const ngoKeypair = StellarSdk.Keypair.fromSecret(ngoSecretKey);
    const escrowKeypair = StellarSdk.Keypair.random();
    
    try {
        // Load NGO account
        const ngoAccount = await server.loadAccount(ngoKeypair.publicKey());
        
        // Step 1: Create the escrow account
        const createAccountTx = new StellarSdk.TransactionBuilder(ngoAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase
        })
        .addOperation(StellarSdk.Operation.createAccount({
            destination: escrowKeypair.publicKey(),
            startingBalance: (parseFloat(amount) + 5).toString() // Extra XLM for account minimum + fees
        }))
        .setTimeout(30)
        .build();
        
        createAccountTx.sign(ngoKeypair);
        await server.submitTransaction(createAccountTx);
        
        // Step 2: Set up multi-signature requirements
        const escrowAccount = await server.loadAccount(escrowKeypair.publicKey());
        
        const multiSigTx = new StellarSdk.TransactionBuilder(escrowAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase
        })
        .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 0, // Remove ability for the master key to sign transactions
            lowThreshold: 2,
            medThreshold: 2,
            highThreshold: 2,
            signer: {
                ed25519PublicKey: ngoKeypair.publicKey(),
                weight: 1
            }
        }))
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {
                ed25519PublicKey: beneficiaryPublicKey,
                weight: 1
            }
        }))
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {
                ed25519PublicKey: thirdPartyPublicKey,
                weight: 1
            }
        }))
        .setTimeout(30)
        .build();
        
        multiSigTx.sign(escrowKeypair);
        await server.submitTransaction(multiSigTx);
        
        return {
            escrowPublicKey: escrowKeypair.publicKey(),
            escrowSecretKey: escrowKeypair.secret(), // Normally you would secure this or discard it
            requiredSigners: [ngoKeypair.publicKey(), beneficiaryPublicKey, thirdPartyPublicKey],
            requiredSignatures: 2
        };
    } catch (error) {
        console.error('Error creating multi-signature escrow:', error);
        throw error;
    }
}

/**
 * Create a transaction to release funds from an escrow account
 * @param {string} escrowPublicKey - Public key of the escrow account
 * @param {string} beneficiaryPublicKey - Public key of the beneficiary
 * @param {string} amount - Amount to release
 * @returns {Object} The unsigned transaction for multi-signature
 */
async function createEscrowReleaseTransaction(escrowPublicKey, beneficiaryPublicKey, amount) {
    try {
        // Load escrow account
        const escrowAccount = await server.loadAccount(escrowPublicKey);
        
        // Create a transaction to release funds
        const transaction = new StellarSdk.TransactionBuilder(escrowAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: networkPassphrase
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: beneficiaryPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
        }))
        .setTimeout(30)
        .build();
        
        // Convert to XDR for passing around to be signed
        const transactionXDR = transaction.toXDR();
        
        return {
            transaction: transaction,
            xdr: transactionXDR
        };
    } catch (error) {
        console.error('Error creating escrow release transaction:', error);
        throw error;
    }
}

/**
 * Sign a transaction with a given secret key
 * @param {string} transactionXDR - XDR representation of the transaction
 * @param {string} signerSecretKey - Secret key of a signer
 * @returns {string} The XDR of the signed transaction
 */
function signTransaction(transactionXDR, signerSecretKey) {
    try {
        const signerKeypair = StellarSdk.Keypair.fromSecret(signerSecretKey);
        
        // Convert XDR to transaction object
        const transaction = StellarSdk.TransactionBuilder.fromXDR(
            transactionXDR,
            networkPassphrase
        );
        
        // Sign the transaction
        transaction.sign(signerKeypair);
        
        // Return the new XDR
        return transaction.toXDR();
    } catch (error) {
        console.error('Error signing transaction:', error);
        throw error;
    }
}

/**
 * Create a milestone-based conditional payment
 * @param {string} ngoSecretKey - Secret key of the NGO
 * @param {Array} milestones - Array of objects containing milestone details
 * @returns {Object} Details of the milestone payments
 */
async function createMilestonePayments(ngoSecretKey, milestones) {
    const ngoKeypair = StellarSdk.Keypair.fromSecret(ngoSecretKey);
    const results = [];
    
    try {
        for (const milestone of milestones) {
            // Based on milestone type, create appropriate conditional transfer
            if (milestone.type === 'time') {
                // Time-based milestone
                const unlockDate = new Date(milestone.unlockDate);
                const result = await createTimeLockedTransfer(
                    ngoSecretKey,
                    milestone.beneficiaryPublicKey,
                    milestone.amount,
                    unlockDate
                );
                
                results.push({
                    milestoneId: milestone.id,
                    milestoneName: milestone.name,
                    type: 'time',
                    transactionXDR: result.xdr,
                    unlockDate: unlockDate
                });
            } else if (milestone.type === 'approval') {
                // Approval-based milestone requiring multiple signatures
                const result = await createMultiSigEscrow(
                    ngoSecretKey,
                    milestone.beneficiaryPublicKey,
                    milestone.approverPublicKey,
                    milestone.amount
                );
                
                results.push({
                    milestoneId: milestone.id,
                    milestoneName: milestone.name,
                    type: 'approval',
                    escrowAccount: result.escrowPublicKey,
                    requiredSigners: result.requiredSigners,
                    requiredSignatures: result.requiredSignatures
                });
            }
        }
        
        return results;
    } catch (error) {
        console.error('Error creating milestone payments:', error);
        throw error;
    }
}

// ------------------------------------------
// 4. ANALYTICS DASHBOARD INTEGRATION
// ------------------------------------------

/**
 * Track transaction for analytics
 * @param {Object} transaction - Transaction details to track
 * @returns {Object} The stored transaction record
 */
function trackTransaction(transaction) {
    // In a real implementation, this would store to a database
    const record = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...transaction,
    };
    
    // For this example, we'll just console.log the record
    console.log('Transaction tracked:', record);
    
    return record;
}

/**
 * Generate impact report based on tracked transactions
 * @param {string} ngoPublicKey - Public key of the NGO
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Object} The impact report
 */
async function generateImpactReport(ngoPublicKey, startDate, endDate) {
    try {
        // In a real implementation, this would query from a database
        // For this example, we'll use the Stellar operations history
        
        // Convert dates to timestamps
        const startTimestamp = startDate.toISOString();
        const endTimestamp = endDate.toISOString();
        
        // Get payment operations from the NGO account
        const operations = await server.operations()
            .forAccount(ngoPublicKey)
            .includeFailed(false)
            .cursor('now')
            .limit(200)
            .call();
        
        // Filter operations by type and date
        const payments = operations.records
            .filter(op => 
                op.type === 'payment' && 
                op.created_at >= startTimestamp && 
                op.created_at <= endTimestamp
            );
        
        // Aggregate data
        let totalDistributed = 0;
        const beneficiaries = new Set();
        const distributionByDate = {};
        
        payments.forEach(payment => {
            if (payment.asset_type === 'native') {
                totalDistributed += parseFloat(payment.amount);
                beneficiaries.add(payment.to);
                
                // Group by date
                const date = payment.created_at.split('T')[0];
                if (!distributionByDate[date]) {
                    distributionByDate[date] = 0;
                }
                distributionByDate[date] += parseFloat(payment.amount);
            }
        });
        
        // Create the report
        return {
            organizationId: ngoPublicKey,
            reportPeriod: {
                start: startDate,
                end: endDate
            },
            summary: {
                totalDistributed: totalDistributed,
                totalBeneficiaries: beneficiaries.size,
                averagePerBeneficiary: totalDistributed / (beneficiaries.size || 1)
            },
            distributionTimeline: Object.entries(distributionByDate).map(([date, amount]) => ({
                date,
                amount
            })),
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('Error generating impact report:', error);
        throw error;
    }
}

// ------------------------------------------
// API ENDPOINTS
// ------------------------------------------

// Create NGO account
app.post('/api/ngo/create', async (req, res) => {
    try {
        const account = await createNGOAccount();
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create beneficiary account
app.post('/api/beneficiary/create', async (req, res) => {
    try {
        const { ngoSecretKey, initialBalance } = req.body;
        const account = await createBeneficiaryAccount(ngoSecretKey, initialBalance);
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Distribute funds
app.post('/api/funds/distribute', async (req, res) => {
    try {
        const { ngoSecretKey, beneficiaries, assetCode } = req.body;
        const result = await distributeFunds(ngoSecretKey, beneficiaries, assetCode);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate offline transaction
app.post('/api/transaction/offline/generate', async (req, res) => {
    try {
        const { senderSecretKey, recipientPublicKey, amount } = req.body;
        const transaction = await generateOfflineTransaction(senderSecretKey, recipientPublicKey, amount);
        res.json({ xdr: transaction.xdr });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit offline transaction
app.post('/api/transaction/offline/submit', async (req, res) => {
    try {
        const { xdr } = req.body;
        const result = await submitOfflineTransaction(xdr);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create milestone payments
app.post('/api/milestone/create', async (req, res) => {
    try {
        const { ngoSecretKey, milestones } = req.body;
        const results = await createMilestonePayments(ngoSecretKey, milestones);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate impact report
app.post('/api/analytics/report', async (req, res) => {
    try {
        const { ngoPublicKey, startDate, endDate } = req.body;
        const report = await generateImpactReport(
            ngoPublicKey,
            new Date(startDate),
            new Date(endDate)
        );
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Financial Inclusion Toolkit server running on port ${PORT}`);
});

// Export the functions for usage in other modules
module.exports = {
    createNGOAccount,
    createBeneficiaryAccount,
    distributeFunds,
    generateOfflineTransaction,
    submitOfflineTransaction,
    storeOfflineTransactions,
    submitStoredTransactions,
    createTimeLockedTransfer,
    createMultiSigEscrow,
    createEscrowReleaseTransaction,
    signTransaction,
    createMilestonePayments,
    trackTransaction,
    generateImpactReport
};