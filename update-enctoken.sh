#!/bin/bash
# Script to update ENCTOKEN safely
# Usage: ./update-enctoken.sh "your_new_enctoken_here"

set -e

ENCTOKEN_FILE=".env.enctoken"
BACKUP_DIR="enctoken_backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to validate enctoken format
validate_enctoken() {
    local token=$1
    if [ ${#token} -lt 50 ]; then
        echo "❌ ERROR: Enctoken looks too short (${#token} chars). Are you sure it's correct?"
        return 1
    fi

    if [[ ! $token =~ ^[A-Za-z0-9+/=]+$ ]]; then
        echo "❌ ERROR: Enctoken contains invalid characters"
        return 1
    fi

    return 0
}

# Check if enctoken was provided
if [ -z "$1" ]; then
    echo "❌ ERROR: No enctoken provided"
    echo ""
    echo "Usage: ./update-enctoken.sh \"your_enctoken_here\""
    echo ""
    echo "To get your enctoken:"
    echo "1. Login to https://kite.zerodha.com"
    echo "2. Open Browser DevTools (F12)"
    echo "3. Go to Application/Storage → Cookies"
    echo "4. Copy the 'enctoken' cookie value"
    exit 1
fi

NEW_ENCTOKEN="$1"

# Validate the new enctoken
if ! validate_enctoken "$NEW_ENCTOKEN"; then
    echo ""
    echo "Do you want to proceed anyway? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
fi

# Backup existing enctoken if it exists
if [ -f "$ENCTOKEN_FILE" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/enctoken_$TIMESTAMP.bak"
    cp "$ENCTOKEN_FILE" "$BACKUP_FILE"
    echo "✅ Backed up old enctoken to: $BACKUP_FILE"
fi

# Save new enctoken
echo "ENCTOKEN=\"$NEW_ENCTOKEN\"" > "$ENCTOKEN_FILE"
echo "✅ Saved new enctoken to: $ENCTOKEN_FILE"

# Set proper permissions (readable only by owner)
chmod 600 "$ENCTOKEN_FILE"
echo "✅ Set secure permissions (600)"

# Provide usage instructions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Enctoken updated successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To use it, run:"
echo "  source .env.enctoken"
echo "  export ENCTOKEN"
echo ""
echo "Or use with supervisor:"
echo "  source .env.enctoken && node supervisor.js --instrument 120395527 --tradingsymbol SILVERM25FEBFUT --paper"
echo ""
echo "⚠️  Remember: Enctoken expires daily at 3:30 AM IST"
echo "    You must update it every trading day!"
echo ""
