# Knowledge Base Structure

This document outlines the structure, organization, and metadata of the knowledge base (KB) used by the ESI Help Desk backend.

---

## Overview

The knowledge base (KB) is a collection of Markdown files stored in the `backend/app/kb` directory. These files contain structured information to assist the AI Help Desk in resolving user queries, troubleshooting issues, and enforcing policies. The KB is processed into vector embeddings for semantic search and retrieval.

---

## Directory Structure

The KB is organized as follows:

```
backend/
└── app/
    └── kb/
        ├── 00-platform-overview.md
        ├── 01-access-and-authentication-v2.1.md
        ├── 02-authentication-policy-2023.md
        ├── 03-authentication-policy-2024.md
        ├── 04-virtual-lab-operations-and-recovery.md
        ├── 05-environment-mapping-and-routing.md
        ├── 06-container-runtime-troubleshooting.md
        ├── 07-dns-and-network-troubleshooting.md
        ├── 08-logging-monitoring-and-security-controls.md
        ├── 09-tiering-escalation-and-sla-policy.md
        └── 10-known-error-catalog.md
```

---

## File Naming Conventions

- Files are named with a numeric prefix to indicate their order or priority.
- Use **snake_case** for file names.
- File names should be descriptive and indicate the content of the file.
- Examples:
  - `00-platform-overview.md`: General overview of the CyberLab platform.
  - `01-access-and-authentication-v2.1.md`: Troubleshooting access and authentication issues.

---

## Metadata

Each KB document includes metadata at the top of the file in YAML format. This metadata is used for indexing, retrieval, and classification.

### Metadata Fields

- **id**: Unique identifier for the document.
- **title**: Title of the document.
- **version**: Version of the document.
- **last_updated**: Date the document was last updated.
- **tags**: Keywords associated with the document.

### Example Metadata

```yaml
id: kb-access-authentication
title: Access and Authentication Troubleshooting
version: 2.1
last_updated: 2024-04-10
tags: [authentication, sso, login, access]
```

---

## Content Categories

### 1. Platform Overview
- **Purpose**: Provide a high-level overview of the CyberLab platform, roles, and environment types.
- **File**: `00-platform-overview.md`

### 2. Authentication and Access
- **Purpose**: Troubleshoot authentication issues and define MFA policies.
- **Files**:
  - `01-access-and-authentication-v2.1.md`
  - `02-authentication-policy-2023.md` (Deprecated)
  - `03-authentication-policy-2024.md` (Current)

### 3. Virtual Labs and Containers
- **Purpose**: Handle issues related to virtual labs and container-based environments.
- **Files**:
  - `04-virtual-lab-operations-and-recovery.md`
  - `06-container-runtime-troubleshooting.md`

### 4. Environment Mapping and Routing
- **Purpose**: Address issues with environment assignments and routing.
- **File**: `05-environment-mapping-and-routing.md`

### 5. DNS and Network Troubleshooting
- **Purpose**: Resolve DNS and connectivity issues.
- **File**: `07-dns-and-network-troubleshooting.md`

### 6. Logging, Monitoring, and Security
- **Purpose**: Define logging policies and enforce security controls.
- **File**: `08-logging-monitoring-and-security-controls.md`

### 7. Tiering, Escalation, and SLA Policy
- **Purpose**: Define support tiers, escalation rules, and service expectations.
- **File**: `09-tiering-escalation-and-sla-policy.md`

### 8. Known Error Catalog
- **Purpose**: Document known issues for quick recognition and resolution.
- **File**: `10-known-error-catalog.md`

---

## Best Practices for KB Maintenance

1. **Keep Content Concise**:
   - Write clear and concise content to improve retrieval accuracy.
   - Avoid redundant or overly verbose explanations.

2. **Use Markdown Formatting**:
   - Use headings, lists, and code blocks for better readability.
   - Example:
     ```markdown
     ## Steps to Resolve
     1. Clear browser cookies.
     2. Restart the browser.
     ```

3. **Update Regularly**:
   - Review and update KB documents to ensure accuracy and relevance.
   - Use the `last_updated` field to track changes.

4. **Role-Specific Content**:
   - Tailor content to the needs of specific roles (e.g., Trainee, Support Engineer).
   - Clearly indicate role restrictions in the content.

5. **Deprecate Outdated Documents**:
   - Mark outdated documents as deprecated and reference the current version.
   - Example: `02-authentication-policy-2023.md` is marked as deprecated.

---

## Future Enhancements

- **Dynamic Updates**:
  - Develop a mechanism to dynamically update the KB without redeploying the backend.

- **Search Optimization**:
  - Use additional metadata fields to improve search relevance.

- **Versioning**:
  - Implement version control for KB documents to track changes over time.

---

This document provides a comprehensive guide to structuring and maintaining the knowledge base for the ESI Help Desk backend.