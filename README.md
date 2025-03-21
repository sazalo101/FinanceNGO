# Financial Inclusion Toolkit for NGOs on Stellar

![Project Banner](https://via.placeholder.com/1200x300?text=Financial+Inclusion+Toolkit+for+NGOs)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-orange.svg)](https://www.stellar.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)

A comprehensive blockchain-based solution that enables humanitarian organizations and NGOs to distribute aid efficiently, transparently, and securely on the Stellar network, even in regions with limited connectivity.

## 🌟 Features

### 💸 Aid Distribution System
- Easy account creation for NGOs and beneficiaries
- Bulk fund distribution to multiple recipients
- Support for both native XLM and custom asset transfers
- Simple API endpoints for integration with existing systems

### 📵 Offline Transaction Capabilities
- Generate transactions that can be stored and submitted later
- Batch transaction processing for areas with intermittent connectivity
- Secure transaction signing without an active network connection
- Support for collecting transactions in the field and processing them when online

### 📝 Smart Contract-Managed Conditional Transfers
- Time-locked transfers that release funds at predetermined dates
- Multi-signature escrow accounts requiring approval from multiple parties
- Milestone-based payment system with customizable conditions
- Programmable conditional transfers based on verifiable completion criteria

### 📊 Analytics Dashboard
- Comprehensive reporting on fund distribution
- Metrics for tracking impact and ensuring accountability
- Timeline analysis of distribution activities
- Cost-effectiveness metrics for donor reporting

## 🛠️ Technologies

- **[Stellar Blockchain](https://www.stellar.org/)**: For secure, low-cost financial transactions
- **[Node.js](https://nodejs.org/)**: Server-side JavaScript runtime
- **[Express](https://expressjs.com/)**: Web framework for API endpoints
- **[Stellar SDK](https://github.com/stellar/js-stellar-sdk)**: For interacting with the Stellar network

## 📋 Prerequisites

- Node.js v16 or higher
- npm or yarn
- Internet connection (for initial setup and syncing)
- Basic understanding of blockchain concepts
- Stellar testnet account (for testing)

## 🚀 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/financial-inclusion-innovators/stellar-ngo-toolkit.git
   cd stellar-ngo-toolkit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Access the API at http://localhost:3000

## 💻 Usage Examples

### Creating an NGO Account

```javascript
const { createNGOAccount } = require('./src/aidDistribution');

async function setup() {
  try {
    const account = await createNGOAccount();
    console.log('NGO account created:', account);
    // Store these keys securely!
  } catch (error) {
    console.error('Error creating account:', error);
  }
}

setup();
```

### Distributing Funds to Beneficiaries

```javascript
const { distributeFunds } = require('./src/aidDistribution');

async function sendAid() {
  try {
    const ngoSecretKey = 'S...'; // Your NGO account secret key
    const beneficiaries = [
      { publicKey: 'G...', amount: '10.5' },
      { publicKey: 'G...', amount: '15.75' }
    ];
    
    const result = await distributeFunds(ngoSecretKey, beneficiaries);
    console.log('Funds distributed successfully:', result);
  } catch (error) {
    console.error('Error distributing funds:', error);
  }
}

sendAid();
```

### Creating Time-Locked Transfers

```javascript
const { createTimeLockedTransfer } = require('./src/conditionalTransfers');

async function schedulePayment() {
  try {
    const ngoSecretKey = 'S...'; // Your NGO account secret key
    const beneficiaryPublicKey = 'G...'; // Beneficiary public key
    const amount = '50'; // Amount in XLM
    const unlockDate = new Date('2023-12-31'); // Date when funds become available
    
    const result = await createTimeLockedTransfer(
      ngoSecretKey, 
      beneficiaryPublicKey,
      amount,
      unlockDate
    );
    
    console.log('Time-locked transfer created:', result);
  } catch (error) {
    console.error('Error creating time-locked transfer:', error);
  }
}

schedulePayment();
```

## 📱 API Endpoints

### NGO Management
- `POST /api/ngo/create` - Create a new NGO account
- `POST /api/beneficiary/create` - Create a new beneficiary account
- `POST /api/funds/distribute` - Distribute funds to multiple beneficiaries

### Offline Transactions
- `POST /api/transaction/offline/generate` - Generate an offline transaction
- `POST /api/transaction/offline/submit` - Submit a previously generated transaction

### Conditional Transfers
- `POST /api/milestone/create` - Create milestone-based payments
- `POST /api/escrow/create` - Create a multi-signature escrow account

### Analytics
- `POST /api/analytics/report` - Generate impact report

Full API documentation is available in the [API.md](./docs/API.md) file.

## 🧪 Testing on Stellar Testnet

This toolkit is configured to work with the Stellar testnet by default. To get testnet XLM for testing:

1. Generate a new Stellar keypair
2. Visit the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
3. Enter your public key and click "Create Account"

Alternatively, you can use the Friendbot directly:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

## 🚧 Roadmap

- [ ] Mobile application for beneficiaries
- [ ] Integration with biometric identification systems
- [ ] Support for more complex conditional transfers
- [ ] Enhanced reporting tools
- [ ] Integration with traditional banking systems
- [ ] Multi-language support
- [ ] Offline QR code generation for transactions

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guidelines](./CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🌍 Impact

This toolkit addresses several critical challenges in humanitarian aid:

- **Financial Inclusion**: Provides banking-like services to unbanked populations
- **Transparency**: All transactions are recorded on Stellar's public ledger
- **Accountability**: Conditional transfers ensure aid is used as intended
- **Efficiency**: Reduces administrative costs and transfer fees
- **Resilience**: Works in areas with limited connectivity

## 👥 Team

- **Sarah Chen** - Lead Developer
- **Amir Hassan** - Financial Inclusion Specialist
- **Miguel Rodriguez** - UX/UI Designer
- **Priya Sharma** - Project Manager

Contact us at: team@financialinclusioninnovators.org

## 🙏 Acknowledgments

- Stellar Development Foundation for creating an accessible blockchain
- Our NGO partners for valuable feedback and real-world testing
- The open-source community for their continuous support and contributions

---

<p align="center">Made with ❤️ for humanitarian organizations worldwide</p>