# OpenAI Setup Guide

This guide walks you through setting up OpenAI for the brain dump feature.

## Prerequisites

- An OpenAI account
- Node.js 18+ installed

## Steps to Obtain Your API Key

1. **Create or sign in to your OpenAI account**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Click "Sign In" or "Sign up" to create an account

2. **Navigate to API Keys**
   - Click on your profile picture in the top-right corner
   - Select "API keys" from the dropdown menu

3. **Create a new API key**
   - Click the "Create new secret key" button
   - Give your key a descriptive name (e.g., "chatter-dev")
   - Select an appropriate permission scope (for development, "All permissions" is fine)
   - Click "Create secret key"

4. **Copy and save your API key**
   - Copy the generated API key immediately (it will only be shown once)
   - Store it securely (never commit it to version control)

## Configure Environment Variable

Add the API key to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

For Vercel deployment, add the same variable in your project settings under "Environment Variables".

## Verify the Setup

After configuring the API key:

1. Restart your development server
2. Test the brain dump feature by entering some text and submitting

## Usage Limits and Billing

- OpenAI uses a pay-as-you-go model
- gpt-4o-mini is cost-effective for typical usage
- Monitor your usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- Set up usage limits in your account to prevent unexpected charges

## Troubleshooting

**"API key not found" error:**
- Verify OPENAI_API_KEY is set in your `.env` file
- Restart the development server after adding the variable

**Rate limiting errors:**
- Check your OpenAI account usage limits
- Consider upgrading your plan if you need higher limits

**Authentication errors:**
- Verify the API key is correct and active
- Check that the key hasn't been revoked in your OpenAI dashboard
