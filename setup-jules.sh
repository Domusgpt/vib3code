#!/bin/bash
# Jules Environment Setup Script for Paul Phillips Projects
# Bash script for macOS/Linux setup

set -e

echo "🚀 Setting up Jules' development environment for Paul Phillips projects..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    print_info "Detected macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    print_info "Detected Linux"
else
    print_error "Unsupported OS: $OSTYPE"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Homebrew on macOS
if [[ "$OS" == "mac" ]] && ! command_exists brew; then
    print_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    export PATH="/opt/homebrew/bin:$PATH"
fi

# Update package managers
print_header "📦 Updating package managers..."
if [[ "$OS" == "mac" ]]; then
    brew update
elif [[ "$OS" == "linux" ]]; then
    if command_exists apt; then
        sudo apt update
    elif command_exists yum; then
        sudo yum update -y
    elif command_exists pacman; then
        sudo pacman -Sy
    fi
fi

# Install core development tools
print_header "🔧 Installing core development tools..."

# Git
if ! command_exists git; then
    print_info "Installing Git..."
    if [[ "$OS" == "mac" ]]; then
        brew install git
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y git
        elif command_exists yum; then
            sudo yum install -y git
        elif command_exists pacman; then
            sudo pacman -S git --noconfirm
        fi
    fi
    print_status "Git installed"
else
    print_status "Git already installed"
fi

# GitHub CLI
if ! command_exists gh; then
    print_info "Installing GitHub CLI..."
    if [[ "$OS" == "mac" ]]; then
        brew install gh
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            type -p curl >/dev/null || sudo apt install curl -y
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh -y
        elif command_exists yum; then
            sudo dnf install 'dnf-command(config-manager)' -y
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            sudo dnf install gh -y
        fi
    fi
    print_status "GitHub CLI installed"
else
    print_status "GitHub CLI already installed"
fi

# Node.js and npm (version 20 LTS for compatibility)
if ! command_exists node; then
    print_info "Installing Node.js 20 LTS..."
    if [[ "$OS" == "mac" ]]; then
        brew install node@20
        brew link node@20 --force
    elif [[ "$OS" == "linux" ]]; then
        # Install Node.js 20 LTS via NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        if command_exists apt; then
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs npm
        fi
    fi
    print_status "Node.js 20 LTS installed"
else
    # Check if current Node.js version is compatible
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 20 ]; then
        print_warning "Node.js version $node_version detected. Upgrading to Node.js 20 LTS..."
        if [[ "$OS" == "mac" ]]; then
            brew install node@20
            brew link node@20 --force
        elif [[ "$OS" == "linux" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            if command_exists apt; then
                sudo apt-get install -y nodejs
            fi
        fi
        print_status "Node.js upgraded to 20 LTS"
    else
        print_status "Node.js already installed (compatible version)"
    fi
fi

# Python 3
if ! command_exists python3; then
    print_info "Installing Python 3..."
    if [[ "$OS" == "mac" ]]; then
        brew install python@3.11
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y python3 python3-pip python3-venv
        elif command_exists yum; then
            sudo yum install -y python3 python3-pip
        elif command_exists pacman; then
            sudo pacman -S python python-pip --noconfirm
        fi
    fi
    print_status "Python 3 installed"
else
    print_status "Python 3 already installed"
fi

# VS Code
if ! command_exists code; then
    print_info "Installing Visual Studio Code..."
    if [[ "$OS" == "mac" ]]; then
        brew install --cask visual-studio-code
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
            sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
            sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
            sudo apt update
            sudo apt install code -y
        elif command_exists yum; then
            sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
            sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
            sudo dnf check-update
            sudo dnf install code -y
        fi
    fi
    print_status "VS Code installed"
else
    print_status "VS Code already installed"
fi

# ImageMagick
if ! command_exists magick && ! command_exists convert; then
    print_info "Installing ImageMagick..."
    if [[ "$OS" == "mac" ]]; then
        brew install imagemagick
    elif [[ "$OS" == "linux" ]]; then
        if command_exists apt; then
            sudo apt install -y imagemagick
        elif command_exists yum; then
            sudo yum install -y ImageMagick
        elif command_exists pacman; then
            sudo pacman -S imagemagick --noconfirm
        fi
    fi
    print_status "ImageMagick installed"
else
    print_status "ImageMagick already installed"
fi

# Configure npm for user-level global packages (avoid permission issues)
print_header "📦 Configuring npm and installing global packages..."

# Set npm to use user directory for global packages
npm config set prefix "$HOME/.npm-global"

# Add npm global bin to PATH for current session
export PATH="$HOME/.npm-global/bin:$PATH"

# Install essential global packages (excluding Angular CLI - not needed for VIB3CODE)
print_info "Installing Firebase CLI and serve..."
npm install -g firebase-tools serve --force

# Verify installations
if command_exists firebase; then
    print_status "Firebase CLI installed successfully"
else
    print_warning "Firebase CLI installation may have failed"
fi

if command_exists serve; then
    print_status "Serve package installed successfully"
else
    print_warning "Serve package installation may have failed"
fi

# Install Python packages
print_header "🐍 Installing Python packages..."
pip3 install --user markdown beautifulsoup4 pillow requests pyyaml flask fastapi

# Configure Git
print_header "⚙️ Configuring Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.autocrlf input
print_status "Git configured with Paul Phillips project standards"

# Create projects directory
PROJECTS_DIR="$HOME/paul-phillips-projects"
if [ ! -d "$PROJECTS_DIR" ]; then
    mkdir -p "$PROJECTS_DIR"
    print_status "Created projects directory: $PROJECTS_DIR"
else
    print_status "Projects directory already exists: $PROJECTS_DIR"
fi

# Install VS Code extensions
print_header "🔌 Installing VS Code extensions..."
extensions=(
    "ms-vscode.vscode-github-pullrequest"
    "github.vscode-pull-request-github"
    "ms-python.python"
    "bradlc.vscode-tailwindcss"
    "esbenp.prettier-vscode"
    "ms-vscode.vscode-json"
    "redhat.vscode-yaml"
    "ms-vscode.live-server"
    "ms-vscode.hexeditor"
    "ms-toolsai.jupyter"
)

for ext in "${extensions[@]}"; do
    code --install-extension "$ext" --force
done
print_status "VS Code extensions installed"

# Create shell aliases and functions
print_header "🔧 Creating helpful aliases..."

# Detect shell
if [[ $SHELL == *"zsh"* ]]; then
    SHELL_RC="$HOME/.zshrc"
elif [[ $SHELL == *"bash"* ]]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Add aliases to shell config
cat >> "$SHELL_RC" << 'EOF'

# NPM Global Packages PATH
export PATH="$HOME/.npm-global/bin:$PATH"

# Paul Phillips Project Aliases
alias vib3='cd ~/paul-phillips-projects/vib3code && python3 -m http.server 8000'
alias vib3-deploy='cd ~/paul-phillips-projects/vib3code && gh run list --limit 5'
alias vib3-debug='cd ~/paul-phillips-projects/vib3code && gh run view --log'
alias pp-projects='cd ~/paul-phillips-projects'

# VIB3CODE status function
vib3-status() {
    cd ~/paul-phillips-projects/vib3code
    echo "Local index.html: $(wc -c < index.html) bytes"
    echo "Deployed: $(curl -s https://domusgpt.github.io/vib3code/ | wc -c) bytes"
}

# VIB3CODE deployment force function
vib3-force() {
    cd ~/paul-phillips-projects/vib3code
    git commit --allow-empty -m "Force deployment $(date)"
    git push origin main
    echo "Deployment triggered. Check status with: vib3-deploy"
}

# Quick clone function
clone-vib3() {
    cd ~/paul-phillips-projects
    if [ ! -d "vib3code" ]; then
        git clone https://github.com/Domusgpt/vib3code.git
        cd vib3code
        echo "VIB3CODE cloned and ready!"
    else
        echo "VIB3CODE already exists. Use: vib3"
    fi
}
EOF

print_status "Shell aliases added to $SHELL_RC"

# Create quick start script
cat > "$PROJECTS_DIR/quick-start.sh" << 'EOF'
#!/bin/bash
# Quick Start Script for Jules - Paul Phillips Projects

echo "🚀 Starting VIB3CODE development environment..."

# Navigate to project
cd ~/paul-phillips-projects

# Clone if not exists
if [ ! -d "vib3code" ]; then
    echo "📦 Cloning VIB3CODE repository..."
    git clone https://github.com/Domusgpt/vib3code.git
fi

cd vib3code

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Start development server
echo "🌐 Starting development server on http://localhost:8000"
python3 -m http.server 8000 &
SERVER_PID=$!

# Open in VS Code
echo "💻 Opening in VS Code..."
code .

# Show deployment status
echo "📊 Current deployment status:"
gh run list --limit 3

echo ""
echo "✅ VIB3CODE development environment ready!"
echo "🌐 Local server: http://localhost:8000"
echo "🔧 Stop server: kill $SERVER_PID"
echo ""
echo "Useful commands:"
echo "vib3-status   - Compare local vs deployed"
echo "vib3-deploy   - Check deployment status"  
echo "vib3-force    - Force new deployment"
echo "vib3-debug    - View deployment logs"
EOF

chmod +x "$PROJECTS_DIR/quick-start.sh"
print_status "Quick start script created: $PROJECTS_DIR/quick-start.sh"

# Create development utilities
cat > "$PROJECTS_DIR/vib3-tools.sh" << 'EOF'
#!/bin/bash
# VIB3CODE Development Tools for Jules

# Function to check deployment health
check_deployment() {
    echo "🔍 VIB3CODE Deployment Health Check"
    echo "=================================="
    
    local_size=$(wc -c < ~/paul-phillips-projects/vib3code/index.html)
    deployed_size=$(curl -s https://domusgpt.github.io/vib3code/ | wc -c)
    
    echo "Local index.html: $local_size bytes"
    echo "Deployed size: $deployed_size bytes"
    
    if [ "$local_size" -eq "$deployed_size" ]; then
        echo "✅ Deployment appears healthy"
    else
        echo "❌ Deployment size mismatch - may need force push"
    fi
    
    # Check for embedded integration
    if curl -s https://domusgpt.github.io/vib3code/ | grep -q "EMBEDDED HYPERAV"; then
        echo "✅ Embedded HyperAV integration detected"
    else
        echo "❌ Missing embedded HyperAV integration"
    fi
}

# Function to fix common deployment issues
fix_deployment() {
    echo "🔧 Attempting deployment fixes..."
    cd ~/paul-phillips-projects/vib3code
    
    # Force workflow trigger
    git commit --allow-empty -m "Fix deployment $(date)"
    git push origin main
    
    echo "✅ Deployment fix triggered"
    echo "Monitor status with: gh run list"
}

# Function to backup project
backup_project() {
    echo "💾 Creating VIB3CODE backup..."
    cd ~/paul-phillips-projects
    tar -czf "vib3code-backup-$(date +%Y%m%d-%H%M%S).tar.gz" vib3code/
    echo "✅ Backup created"
}

# Main menu
case "$1" in
    check)
        check_deployment
        ;;
    fix)
        fix_deployment
        ;;
    backup)
        backup_project
        ;;
    *)
        echo "VIB3CODE Development Tools"
        echo "Usage: $0 {check|fix|backup}"
        echo ""
        echo "Commands:"
        echo "  check  - Check deployment health"
        echo "  fix    - Attempt to fix deployment issues"
        echo "  backup - Create project backup"
        ;;
esac
EOF

chmod +x "$PROJECTS_DIR/vib3-tools.sh"
print_status "Development tools created: $PROJECTS_DIR/vib3-tools.sh"

# Verification tests
print_header "🧪 Running verification tests..."

# Test installations
tests=(
    "git --version:Git"
    "gh --version:GitHub CLI"
    "node --version:Node.js"
    "python3 --version:Python 3"
    "code --version:VS Code"
    "npm --version:NPM"
)

for test in "${tests[@]}"; do
    cmd="${test%%:*}"
    name="${test##*:}"
    if $cmd >/dev/null 2>&1; then
        version=$($cmd | head -n1)
        print_status "$name: $version"
    else
        print_error "$name: Not installed or not in PATH"
    fi
done

# Create environment verification script
cat > "$PROJECTS_DIR/verify-setup.sh" << 'EOF'
#!/bin/bash
# Environment Verification for Jules

# Add npm global bin to PATH for verification
export PATH="$HOME/.npm-global/bin:$PATH"

echo "🧪 Paul Phillips Development Environment Verification"
echo "=================================================="

# Check core tools
echo "Core Tools:"
git --version 2>/dev/null && echo "✅ Git" || echo "❌ Git"
gh --version 2>/dev/null && echo "✅ GitHub CLI" || echo "❌ GitHub CLI"
node --version 2>/dev/null && echo "✅ Node.js" || echo "❌ Node.js"
python3 --version 2>/dev/null && echo "✅ Python 3" || echo "❌ Python 3"
code --version 2>/dev/null && echo "✅ VS Code" || echo "❌ VS Code"

# Check global packages
echo ""
echo "Global Packages:"
firebase --version 2>/dev/null && echo "✅ Firebase CLI" || echo "❌ Firebase CLI"
serve --version 2>/dev/null && echo "✅ Serve" || echo "❌ Serve"

# Check npm configuration
echo ""
echo "NPM Configuration:"
npm config get prefix | grep -q "$HOME/.npm-global" && echo "✅ NPM user-level config" || echo "❌ NPM user-level config"

# Check project setup
echo ""
echo "Project Setup:"
[ -d ~/paul-phillips-projects ] && echo "✅ Projects directory" || echo "❌ Projects directory"
[ -d ~/paul-phillips-projects/vib3code ] && echo "✅ VIB3CODE repository" || echo "❌ VIB3CODE repository"

# Check authentication
echo ""
echo "Authentication Status:"
gh auth status 2>/dev/null && echo "✅ GitHub authenticated" || echo "❌ GitHub not authenticated"

echo ""
echo "Next steps if any items show ❌:"
echo "1. Restart terminal to load new PATH"
echo "2. Re-run setup script if needed"
echo "3. Run authentication commands: gh auth login, firebase login"
EOF

chmod +x "$PROJECTS_DIR/verify-setup.sh"

print_header "🎯 SETUP COMPLETE!"
echo ""
print_info "Jules' development environment is ready for Paul Phillips projects!"
echo ""
print_warning "Manual steps required:"
echo "1. RESTART your terminal/shell (required for PATH changes)"
echo "2. Run authentication:"
echo "   gh auth login"
echo "   firebase login"
echo "3. Configure Git user:"
echo "   git config --global user.name 'Jules [LastName]'"
echo "   git config --global user.email 'jules@[email].com'"
echo ""
print_info "If Firebase/Serve commands aren't found after restart:"
echo "• Run: export PATH=\"\$HOME/.npm-global/bin:\$PATH\""
echo "• Or re-run this setup script"
echo ""
print_info "Quick start commands:"
echo "• $PROJECTS_DIR/quick-start.sh     - Start VIB3CODE development"
echo "• $PROJECTS_DIR/verify-setup.sh    - Verify installation"
echo "• $PROJECTS_DIR/vib3-tools.sh      - Development utilities"
echo ""
print_info "Shell aliases available after restart:"
echo "• vib3          - Start VIB3CODE development server"
echo "• vib3-status   - Compare local vs deployed file sizes"
echo "• vib3-deploy   - Check deployment status"
echo "• vib3-force    - Force new deployment"
echo "• vib3-debug    - View deployment logs"
echo "• clone-vib3    - Clone VIB3CODE repository"
echo ""
print_header "📋 Read JULES_ENVIRONMENT_SETUP.md for complete documentation"