# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | Yes                |
| 1.x.x   | No                 |

## Reporting a Vulnerability

We take security seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email details to the repository maintainers
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in the fix announcement (if desired)

### Scope

Security issues we are interested in:

- Authentication/authorization bypasses
- Data exposure vulnerabilities
- Injection vulnerabilities
- Dependency vulnerabilities

### Out of Scope

- Issues in third-party APIs we integrate with
- Social engineering attacks
- Physical security issues

## Security Best Practices for Users

### API Key Management

- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate keys periodically
- Use keys with minimum required permissions

### Environment Configuration

```bash
# Use .env files (never commit these)
cp .env.example .env

# Ensure .gitignore includes:
# .env
# .env.local
# .env.*.local
```

### Network Security

- Use HTTPS for all API communications
- Implement proper firewall rules in production
- Use VPNs for sensitive legal research

## Acknowledgments

We thank the security researchers who have helped improve Super-Legal's security.
