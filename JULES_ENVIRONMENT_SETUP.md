# 🛠️ JULES ENVIRONMENT SETUP - VIB3CODE DEVELOPMENT

## Overview
This guide sets up Jules' development environment for working with Paul Phillips on VIB3CODE, Parserator, and EMA Movement projects.

## Required Software & Tools

### 1. Git & GitHub
```bash
# Install Git (if not already installed)
# Windows:
winget install Git.Git

# Mac:
brew install git

# Configure Git with Paul's project standards
git config --global user.name "Jules [Last Name]"
git config --global user.email "jules@[email].com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

### 2. GitHub CLI
```bash
# Windows:
winget install GitHub.cli

# Mac:
brew install gh

# Login to GitHub
gh auth login
```

### 3. Node.js & NPM
```bash
# Install Node.js 18+ (LTS recommended)
# Windows:
winget install OpenJS.NodeJS

# Mac:
brew install node

# Verify installation
node --version  # Should be 18+
npm --version
```

### 4. Python (for content pipeline scripts)
```bash
# Windows:
winget install Python.Python.3.11

# Mac:
brew install python@3.11

# Verify installation
python --version  # Should be 3.11+
pip --version
```

### 5. Firebase CLI (for deployment)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### 6. Code Editor - VS Code
```bash
# Windows:
winget install Microsoft.VisualStudioCode

# Mac:
brew install --cask visual-studio-code
```

## VS Code Extensions Setup

Install these essential extensions:

```bash
# Install extensions via command line
code --install-extension ms-vscode.vscode-github-pullrequest
code --install-extension github.vscode-pull-request-github
code --install-extension ms-python.python
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-json
code --install-extension redhat.vscode-yaml
code --install-extension ms-vscode.live-server
```

### Recommended Extensions List:
- **GitHub Pull Requests and Issues** - Direct GitHub integration
- **GitHub Repositories** - Edit repos directly in VS Code
- **Python** - Python development support
- **Tailwind CSS IntelliSense** - CSS framework support
- **Prettier** - Code formatting
- **JSON** - JSON file support
- **YAML** - YAML file support
- **Live Server** - Local development server

## Repository Access Setup

### 1. Clone Main Repositories
```bash
# Create projects directory
mkdir ~/paul-phillips-projects
cd ~/paul-phillips-projects

# Clone VIB3CODE repository
git clone https://github.com/Domusgpt/vib3code.git
cd vib3code

# Clone Parserator repository (if access granted)
git clone https://github.com/[parserator-repo].git

# Set up SSH keys for easier access (optional but recommended)
ssh-keygen -t ed25519 -C "jules@[email].com"
# Add public key to GitHub account
```

### 2. Repository Permissions
Paul needs to grant Jules:
- **Write access** to VIB3CODE repository
- **Admin access** to GitHub Pages settings (for deployment troubleshooting)
- **Actions access** for workflow management

## VIB3CODE Specific Setup

### 1. Install Project Dependencies
```bash
cd ~/paul-phillips-projects/vib3code

# Install any Node.js dependencies (if package.json exists)
npm install

# Install Python dependencies for content pipeline
pip install -r requirements.txt  # If file exists

# Or install common content tools
pip install markdown beautifulsoup4 pillow requests pyyaml
```

### 2. Local Development Server
```bash
# Option 1: Python simple server
python -m http.server 8000

# Option 2: Node.js serve package
npm install -g serve
serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### 3. GitHub Pages Deployment Access
```bash
# Check current GitHub Pages status
gh api repos/Domusgpt/vib3code/pages

# View recent deployments
gh run list --repo Domusgpt/vib3code

# Trigger manual deployment
gh workflow run deploy.yml --repo Domusgpt/vib3code
```

## Content Pipeline Tools

### 1. Image Processing
```bash
# Install ImageMagick for image processing
# Windows:
winget install ImageMagick.ImageMagick

# Mac:
brew install imagemagick

# Verify installation
magick --version
```

### 2. Content Processing Scripts
```bash
# Make scripts executable (Linux/Mac)
chmod +x process_*.py
chmod +x suggest_*.py

# Test content processing
python process_markdown.py --help
```

## Development Workflow

### 1. Daily Workflow
```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/description

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push and create PR
git push origin feature/description
gh pr create --title "Feature: Description" --body "Details"
```

### 2. Deployment Workflow
```bash
# Check deployment status
gh run list --limit 5

# View deployment logs
gh run view [run-id]

# Force deployment trigger
git commit --allow-empty -m "Force deployment"
git push origin main
```

## Troubleshooting Common Issues

### 1. GitHub Pages Not Updating
```bash
# Check Pages settings
gh api repos/Domusgpt/vib3code/pages

# Check workflow status
gh run list --limit 3

# Manual cache clear
curl -X POST https://api.github.com/repos/Domusgpt/vib3code/pages/builds \
  -H "Authorization: token $GITHUB_TOKEN"
```

### 2. File Size Debugging
```bash
# Compare local vs deployed
echo "Local index.html: $(wc -c < index.html) bytes"
echo "Deployed: $(curl -s https://domusgpt.github.io/vib3code/ | wc -c) bytes"

# Check for missing files
curl -s https://domusgpt.github.io/vib3code/js/hyperav-loader.js | head -5
```

### 3. Workflow Debugging
```bash
# View workflow file
cat .github/workflows/deploy.yml

# Check workflow runs
gh run list --workflow=deploy.yml

# Download workflow logs
gh run download [run-id]
```

## Emergency Procedures

### 1. Deployment Failure Recovery
```bash
# Reset to last working commit
git log --oneline -10
git reset --hard [working-commit-hash]
git push --force origin main

# Alternative: Create new deployment
git checkout -b emergency-deploy
git push origin emergency-deploy
# Change GitHub Pages source to emergency-deploy branch
```

### 2. Repository Backup
```bash
# Create complete backup
git clone --mirror https://github.com/Domusgpt/vib3code.git vib3code-backup.git

# Backup to local folder
git archive --format=zip --output=vib3code-backup.zip main
```

## Paul Phillips Project Standards

### 1. Commit Message Format
```
🎨 Type: Description

✨ WHAT THIS DOES:
- Bullet point of changes
- Another change

🎯 EXPECTED RESULT:
- What should happen

🔧 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 2. Code Quality Standards
- **Production-ready code only** - No simplified demos
- **Complete implementations** - No TODO placeholders
- **Real integrations** - Connect with actual systems
- **Comprehensive error handling** - Include proper validation
- **EMA compliance** - Follow Exoditical Moral Architecture principles

### 3. Documentation Requirements
- **Technical accuracy** - All claims must be verifiable
- **Step-by-step guides** - Include specific commands
- **Troubleshooting sections** - Cover common issues
- **Success criteria** - Define clear outcomes

## Contact & Support

### 1. Communication Channels
- **Primary**: Direct communication with Paul Phillips
- **Repository**: GitHub issues and discussions
- **Documentation**: All procedures documented in repository

### 2. Escalation Procedures
- **Deployment issues**: Create GitHub issue with full error logs
- **Access problems**: Contact Paul Phillips directly
- **Emergency fixes**: Use emergency deployment procedures above

### 3. Knowledge Base
- **Project documentation**: README files in each repository
- **Technical guides**: Markdown files in docs/ folders
- **Troubleshooting**: *_CRISIS.md files for urgent issues

## Success Verification

After setup, Jules should be able to:
- [ ] Clone and modify VIB3CODE repository
- [ ] Run local development server
- [ ] Trigger GitHub Pages deployments
- [ ] Debug deployment issues
- [ ] Process content pipeline files
- [ ] Create and merge pull requests
- [ ] Access Firebase hosting controls
- [ ] Execute emergency recovery procedures

## Quick Start Commands

```bash
# Complete setup in one go (after installing base tools)
cd ~/paul-phillips-projects
git clone https://github.com/Domusgpt/vib3code.git
cd vib3code
python -m http.server 8000 &
code .
gh run list --limit 5
echo "Setup complete - VIB3CODE running on http://localhost:8000"
```

**This environment setup ensures Jules can immediately contribute to Paul Phillips' projects with full deployment and troubleshooting capabilities.**