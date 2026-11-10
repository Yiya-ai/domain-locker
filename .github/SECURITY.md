
# Security Policy for Domain Locker

For issues specific to the Yiya-ai fork, use the private reporting option on the repository Security tab when available. Otherwise open an issue asking the maintainer for a private channel, and share technical details there. Keep credentials, real domains and ledger exports out of public issues. The upstream policy follows below.

本分叉的安全问题可使用仓库 Security 页的私密报告入口。如未显示该入口，可先发 issue 请求私下联系，仅在私密渠道提供技术细节。公开 issue 请勿附带真实域名、台账和密钥。以下为原项目的安全政策。

> [!IMPORTANT]
> Domain Locker (self-hosted) comes with no warranty. Use at your own risk. The security of your data is your responsibility.

## Security Overview
Domain Locker is designed with security in mind, but no software is immune to vulnerabilities. This document outlines our security policy, including how we handle vulnerabilities, supported versions, and how to report security issues.

### Managed Instance
For security policy for the managed instance (domain-locker.com), please refer to [Legal → Security](https://domain-locker.com/about/legal/security).

### Self-Hosted Instance
For self-hosted users, it is your responsibility to ensure the security of your instance. Implementing proper access controls, regular updates and following security best practices is crucial.

---

## Supported Versions
We only provide security updates for the latest major version of Domain Locker and its active minor releases. Users running older versions are strongly encouraged to upgrade.

---

## Reporting Security Issues
If you discover a security vulnerability in the Domain Locker application, please report it to us immediately.
We take security seriously and will work with you to resolve the issue promptly.

### How to Report
Send an email to `security@as93.net` with the subject line "Domain Locker Security Issue".

### What to Include
- A detailed description of the vulnerability.
- Steps to reproduce the issue.
- Any relevant screenshots or logs.
- Your contact information (optional, but helpful for follow-up).

### Response Time
We will acknowledge your report within 48 hours and aim to provide a fix or mitigation plan within 28 days, depending on the severity of the issue.

### Disclosure Policy
Please do not publicly disclose the vulnerability until we have had a chance to address it. We will coordinate with you on the timeline for public disclosure once the issue is resolved.

### Out of Scope Issues
- Issues that are not related to the Domain Locker application itself (e.g., server configuration, third-party services).
- Issues that require physical access to the server or user devices.
- Issues that are already publicly known or documented.
- Issues that are not reproducible or lack sufficient detail for investigation.
- Issues solely due to known vulnerable third-party packages (such as npm dependencies), unless they lead to an actual exploit within Domain Locker.
