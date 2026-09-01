const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Playbook = require('./models/Playbook');
const Batch = require('./models/Batch');
const Case = require('./models/Case');
const AuditLog = require('./models/AuditLog');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic health route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'RazorRecover Backend' });
});

// Register Routes
app.use('/api/batches', require('./routes/batchRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/playbooks', require('./routes/playbookRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Seed function for beautiful initial visual demo
const seedDatabase = async () => {
  try {
    // Check playbook
    const playbookCount = await Playbook.countDocuments();
    if (playbookCount === 0) {
      await Playbook.create({
        name: 'Default Recovery Playbook',
        tone: 'hinglish',
        stopping_rules: ['opt-out', 'stop', 'remove', 'dnd'],
        retry_sequence: [60, 180, 1440]
      });
      console.log('Seeded default playbook');
    }

    // Check cases/batches
    const caseCount = await Case.countDocuments();
    if (caseCount === 0) {
      console.log('Database empty. Seeding dashboard sample data...');

      // Batch 1: August Recoveries
      const batch1 = await Batch.create({
        name: 'Aug Failure Recv Batch A',
        status: 'completed',
        total_cases: 5,
        recovered_cases: 3,
        total_amount: 17500,
        recovered_amount: 11000
      });

      // Ingest cases for Batch 1
      const casesBatch1 = [
        {
          batch_id: batch1._id,
          case_type: 'payment_failure',
          amount: 3500,
          customer: { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+919876543210' },
          status: 'recovered',
          root_cause: 'Dynamic Authentication Failed (OTP Timeout)',
          history: [
            { action: 'Ingestion', description: 'Case ingested with Dynamic Auth error code' },
            { action: 'AI Diagnosis', description: 'OTP timeout diagnosed. Recommended retry sequencer trigger.' },
            { action: 'Agent Outreach', description: 'Sent Hinglish recovery link via SMS & email' },
            { action: 'Payment Recovered', description: 'Payment successfully completed via Razorpay link.' }
          ],
          conversations: [
            { sender: 'agent', message: 'Aarav ji, your payment of Rs. 3500 failed due to OTP delay. Aap niche diye gaye link se retry kar sakte hain. Thank you!', channel: 'email' },
            { sender: 'customer', message: 'Thank you, paid now.', channel: 'email' }
          ]
        },
        {
          batch_id: batch1._id,
          case_type: 'subscription_failed',
          amount: 5000,
          customer: { name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+919999888777' },
          status: 'recovered',
          root_cause: 'Insufficient Funds',
          history: [
            { action: 'Ingestion', description: 'Subscription renewal failed' },
            { action: 'AI Diagnosis', description: 'Insufficient funds detected. Retry scheduled on salary day (1st of month).' },
            { action: 'Agent Outreach', description: 'Sent polite friendly reminder text message' },
            { action: 'Payment Recovered', description: 'Autopay retry completed successfully.' }
          ],
          conversations: [
            { sender: 'agent', message: 'Hi Priya! Your renewal payment of Rs. 5000 failed due to limit/funds. Can we retry on 1st of the month or do you want to change card?', channel: 'whatsapp' },
            { sender: 'customer', message: 'Yes, please retry after 1st when I get paid.', channel: 'whatsapp' }
          ],
          promise_to_pay_date: new Date('2026-09-01')
        },
        {
          batch_id: batch1._id,
          case_type: 'checkout_abandonment',
          amount: 2500,
          customer: { name: 'Rohan Verma', email: 'rohan.verma@example.com', phone: '+918888777666' },
          status: 'recovered',
          root_cause: 'Cart Abandoned - Payment Page Drop-off',
          history: [
            { action: 'Ingestion', description: 'Customer abandoned checkout at final step' },
            { action: 'AI Diagnosis', description: 'Incentive-based recovery recommended: 5% discount code sent.' },
            { action: 'Agent Outreach', description: 'Outreach email containing discount link sent' },
            { action: 'Payment Recovered', description: 'Completed checkout using coupon code.' }
          ],
          conversations: [
            { sender: 'agent', message: 'Hey Rohan! We noticed you left items worth Rs. 2500 in your cart. Here is a 5% discount link to complete it now!', channel: 'email' }
          ]
        },
        {
          batch_id: batch1._id,
          case_type: 'overdue_invoice',
          amount: 4000,
          customer: { name: 'Meera Nair', email: 'meera.nair@example.com', phone: '+917777666555' },
          status: 'failed',
          root_cause: 'Account Blocked by Issuer Bank',
          history: [
            { action: 'Ingestion', description: 'B2B invoice overdue by 15 days' },
            { action: 'AI Diagnosis', description: 'Hard failure. Automated invoice chaser sequence initiated.' },
            { action: 'Agent Outreach', description: 'Outreach Stage 1 and 2 sent.' }
          ],
          conversations: [
            { sender: 'agent', message: 'Dear Meera, invoice #INV-4029 of Rs. 4000 is overdue. Requesting you to settle it.', channel: 'email' },
            { sender: 'customer', message: 'My business bank account is frozen due to compliance issues. I cannot pay now.', channel: 'email' }
          ]
        },
        {
          batch_id: batch1._id,
          case_type: 'payment_failure',
          amount: 2500,
          customer: { name: 'Karan Malhotra', email: 'karan.m@example.com', phone: '+919898989898' },
          status: 'in_recovery',
          root_cause: 'Dynamic Authentication Failed',
          history: [
            { action: 'Ingestion', description: 'Payment failed at gateway' },
            { action: 'AI Diagnosis', description: 'Auth error. Recommended dynamic OTP support sequence.' }
          ]
        }
      ];

      for (const c of casesBatch1) {
        const createdCase = await Case.create(c);
        await AuditLog.create({
          case_id: createdCase._id,
          batch_id: batch1._id,
          action: 'Sample Ingestion',
          details: `Seeded sample case: ${createdCase.customer.name} - ${createdCase.amount} INR`
        });
      }

      // Batch 2: Active Recovery
      const batch2 = await Batch.create({
        name: 'Weekly Checkout Drop-offs',
        status: 'completed',
        total_cases: 3,
        recovered_cases: 0,
        total_amount: 15500,
        recovered_amount: 0
      });

      const casesBatch2 = [
        {
          batch_id: batch2._id,
          case_type: 'checkout_abandonment',
          amount: 7500,
          customer: { name: 'Aditya Sen', email: 'aditya.sen@example.com', phone: '+919000000001' },
          status: 'in_recovery',
          root_cause: 'Payment Method Unavailable',
          history: [
            { action: 'Ingestion', description: 'Checkout drop-off recorded' },
            { action: 'AI Diagnosis', description: 'Customer card rejected. Initiating UPI payment option sequence.' }
          ]
        },
        {
          batch_id: batch2._id,
          case_type: 'subscription_failed',
          amount: 3000,
          customer: { name: 'Sneha Rao', email: 'sneha.rao@example.com', phone: '+919000000002' },
          status: 'paused',
          root_cause: 'Manual Halt Request',
          history: [
            { action: 'Ingestion', description: 'Subscription failed renewal' },
            { action: 'AI Diagnosis', description: 'Initiating friendly check-in tone' },
            { action: 'Agent Outreach', description: 'Sent renew check-in message' },
            { action: 'Compliance Triggered', description: 'Customer requested DND. Status set to paused.' }
          ],
          conversations: [
            { sender: 'agent', message: 'Hi Sneha, your Rs. 3000 monthly subscription failed. Let us know if you want to update payment details.', channel: 'whatsapp' },
            { sender: 'customer', message: 'Stop messaging me, I want to cancel subscription.', channel: 'whatsapp' },
            { sender: 'agent', message: 'Humne aapse contact karna band kar diya hai. Subscription has been flagged for cancel. Sorry for the trouble.', channel: 'whatsapp' }
          ]
        },
        {
          batch_id: batch2._id,
          case_type: 'payment_failure',
          amount: 5000,
          customer: { name: 'Kabir Mehta', email: 'kabir.mehta@example.com', phone: '+919000000003' },
          status: 'in_recovery',
          root_cause: 'Insufficient Funds',
          history: [
            { action: 'Ingestion', description: 'Card payment failed at checkout' },
            { action: 'AI Diagnosis', description: 'Insufficient funds. Setting up Promise-to-Pay tracker sequence.' }
          ]
        }
      ];

      for (const c of casesBatch2) {
        const createdCase = await Case.create(c);
        await AuditLog.create({
          case_id: createdCase._id,
          batch_id: batch2._id,
          action: 'Sample Ingestion',
          details: `Seeded active case: ${createdCase.customer.name} - ${createdCase.amount} INR`
        });
      }

      console.log('Demo database seeding completed successfully!');
    }
  } catch (err) {
    console.error(`Seeding error: ${err.message}`);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  await seedDatabase();
});
