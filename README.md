# Invoice Management Tool

An AI-powered Invoice Management application with QuickBooks Online integration, built using Next.js and the Vercel AI SDK.

## Features

### 🤖 AI-Powered Invoice Management
- Natural language interface for invoice operations
- Intelligent invoice search and filtering
- Automated invoice creation and updates
- Smart analytics and reporting

### 📊 QuickBooks Integration
- Full OAuth 2.0 integration with QuickBooks Online
- Real-time invoice synchronization
- Complete CRUD operations (Create, Read, Update, Delete)
- Customer and item management
- PDF invoice generation and email delivery

### 🎨 Modern UI/UX
- Dual-panel interface (Invoice Data + AI Chat)
- Responsive design with Tailwind CSS
- Real-time streaming AI responses
- Beautiful and intuitive user experience

### 🔧 Technical Features
- Built with Next.js 14 and TypeScript
- Vercel AI SDK for AI tool integration
- Streaming responses for real-time interaction
- Comprehensive error handling
- Multi-step AI workflows

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Vercel AI SDK  │    │  QuickBooks API │
│  (Dual Panel)   │◄──►│   (Tools &      │◄──►│   (OAuth 2.0)   │
│                 │    │   Streaming)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Invoice Panel   │    │   AI Tools      │    │ Invoice CRUD    │
│ • List View     │    │ • getInvoice    │    │ • Create        │
│ • Filter/Search │    │ • listInvoices  │    │ • Read          │
│ • Details View  │    │ • createInvoice │    │ • Update        │
└─────────────────┘    │ • updateInvoice │    │ • Delete        │
                       │ • voidInvoice   │    │ • Email PDF     │
┌─────────────────┐    │ • emailInvoice  │    └─────────────────┘
│   Chat Panel    │    │ • getStats      │
│ • AI Assistant  │    │ • getCustomers  │
│ • Streaming     │    │ • getItems      │
│ • Tool Results  │    └─────────────────┘
└─────────────────┘
```

## Prerequisites

- Node.js 18+ and npm/yarn
- QuickBooks Online Developer Account
- OpenAI API Key

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd InvoiceManagement
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# QuickBooks Configuration
QUICKBOOKS_CLIENT_ID=ABRZKV0y73YEqiuQNZYwZm7ycQspsMJwlO8TWwD3XDj8D3zqhY
QUICKBOOKS_CLIENT_SECRET=MS1VHy2IWJWwYvCCoVHoHLgaCbD5ghCktrL9xcTn
QUICKBOOKS_SANDBOX_BASE_URL=https://sandbox-quickbooks.api.intuit.com
QUICKBOOKS_DISCOVERY_DOCUMENT=https://developer.intuit.com/.well-known/connect_from_oauth2

# OpenAI Configuration
OPENAI_API_KEY=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

# App Configuration
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 4. QuickBooks Setup

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
2. Create a new app
3. Get your Client ID and Client Secret
4. Set redirect URI to: `http://localhost:3000/api/auth/quickbooks/callback`

### 5. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Available AI Tools

The application includes comprehensive AI tools for invoice management:

### Invoice Operations
- **getInvoice**: Get details of a specific invoice by ID
- **listInvoices**: Search and filter invoices with various criteria
- **createInvoice**: Generate new invoices for customers
- **updateInvoice**: Modify existing invoices (due dates, line items, etc.)
- **voidInvoice**: Cancel or void existing invoices
- **deleteInvoice**: Permanently remove invoices
- **emailInvoice**: Send invoice PDFs via email

### Analytics & Reporting
- **getInvoiceStats**: Generate revenue reports and invoice analytics for any time period

### Data Management
- **getCustomers**: List all customers from QuickBooks
- **getItems**: List all products/services from QuickBooks

## Usage Examples

### Natural Language Queries

```
"Show me all unpaid invoices from last month"
"Create an invoice for John Doe for $500"
"What's my total revenue this quarter?"
"Send invoice INV-001 to customer@email.com"
"Void invoice INV-123"
"How many overdue invoices do I have?"
```

### AI Assistant Capabilities

- **Smart Filtering**: "Show me invoices over $1000 that are overdue"
- **Automated Creation**: "Create an invoice for ABC Corp with 5 hours of consulting at $150/hour"
- **Analytics**: "What's my average invoice amount this year?"
- **Bulk Operations**: "Show me all invoices for customer XYZ"
- **Status Updates**: "Mark invoice INV-456 as sent"

## API Endpoints

### Authentication
- `GET /api/auth/quickbooks` - Initiate QuickBooks OAuth
- `GET /api/auth/quickbooks/callback` - Handle OAuth callback

### AI Chat
- `POST /api/chat` - Streaming AI chat with tool execution

## Development

### Project Structure
```
InvoiceManagement/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── ChatPanel.tsx     # AI chat interface
│   ├── InvoicePanel.tsx  # Invoice data display
│   └── Header.tsx        # App header
├── lib/                  # Utility libraries
│   ├── ai-tools.ts       # AI SDK tools definition
│   ├── quickbooks.ts     # QuickBooks integration
│   └── utils.ts          # Helper functions
└── package.json          # Dependencies
```

### Adding New AI Tools

1. Define the tool in `lib/ai-tools.ts`:
```typescript
newTool: tool({
  description: 'Description of what the tool does',
  parameters: z.object({
    param: z.string().describe('Parameter description'),
  }),
  execute: async ({ param }) => {
    // Tool implementation
    return { success: true, data: result };
  },
}),
```

2. The tool will automatically be available to the AI assistant.

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Environment Variables for Production
Ensure all environment variables are set in your deployment platform:
- `QUICKBOOKS_CLIENT_ID`
- `QUICKBOOKS_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)

## Security Considerations

- All QuickBooks operations use OAuth 2.0
- Environment variables for sensitive data
- Input validation with Zod schemas
- Error handling for API failures
- Rate limiting considerations for AI calls

## Troubleshooting

### Common Issues

1. **QuickBooks Connection Failed**
   - Verify Client ID/Secret are correct
   - Check redirect URI matches exactly
   - Ensure sandbox/production environment is correct

2. **AI Tools Not Working**
   - Verify OpenAI API key is valid
   - Check tool parameter validation
   - Review error logs in development console

3. **Invoice Data Not Loading**
   - Confirm QuickBooks connection is active
   - Check API permissions and scopes
   - Verify company has invoice data

### Development Tips

- Use QuickBooks Sandbox for development
- Monitor API rate limits
- Test with small datasets first
- Use browser dev tools for debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review QuickBooks API documentation
- Check Vercel AI SDK documentation
- Create an issue in the repository 