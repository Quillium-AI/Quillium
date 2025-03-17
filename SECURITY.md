# Security Policy

## Supported Versions

The following versions of Quillium are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Quillium seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email us at [security@quillium.ai]** with details about the vulnerability
3. Include the following information in your report:
   - Type of issue
   - Full paths of source file(s) related to the issue
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Any special configuration required to reproduce the issue
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit the issue

## Response Process

After you submit a vulnerability report, the following process will be followed:

1. We will acknowledge receipt of your vulnerability report within 48 hours
2. We will assign a primary handler to investigate the issue
3. We will keep you informed of the progress towards a fix and full announcement
4. We may ask for additional information or guidance

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all supported versions
4. Release fixes as soon as possible

## Security Considerations for Quillium

### API Keys and Secrets

- Never commit API keys, passwords, or other secrets to the repository
- Use environment variables for all sensitive configuration
- The `.env.example` file provides a template for required environment variables, but never contains actual secrets

### Data Privacy

- Quillium processes user queries and may store them for improving the service
- No personally identifiable information should be collected unless explicitly required for functionality
- All data storage should comply with relevant data protection regulations

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request.
