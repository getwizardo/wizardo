#!/usr/bin/env bash

set -e

# Git Push and Auto-PR Script
# Creates a PR and optionally auto-merges it

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Defaults
AUTO_MERGE=false
REPO_OWNER=""
REPO_NAME=""
BRANCH_NAME=""
PR_TITLE=""
PR_BODY=""
GITHUB_TOKEN="${GITHUB_TOKEN:-${GITHUB_AUTH_TOKEN:-}}"

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -o, --owner OWNER      GitHub repository owner (required)"
  echo "  -r, --repo REPO        GitHub repository name (required)"
  echo "  -b, --branch BRANCH    Branch name to push (default: auto-generated)"
  echo "  -t, --title TITLE      PR title (default: 'Release build')"
  echo "  -d, --description DESC PR body/description"
  echo "  -m, --merge            Auto-merge the PR after creation"
  echo "  -h, --help             Show this help message"
  echo ""
  echo "Environment:"
  echo "  GITHUB_TOKEN           GitHub personal access token (required for PR)"
  echo ""
  echo "Example:"
  echo "  GITHUB_TOKEN=xxx $0 -o myuser -r myrepo -m"
  echo "  # Creates PR and auto-merges it"
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -o|--owner)
      REPO_OWNER="$2"
      shift 2
      ;;
    -r|--repo)
      REPO_NAME="$2"
      shift 2
      ;;
    -b|--branch)
      BRANCH_NAME="$2"
      shift 2
      ;;
    -t|--title)
      PR_TITLE="$2"
      shift 2
      ;;
    -d|--description)
      PR_BODY="$2"
      shift 2
      ;;
    -m|--merge)
      AUTO_MERGE=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Validate required parameters
if [[ -z "$REPO_OWNER" ]] || [[ -z "$REPO_NAME" ]]; then
  echo -e "${RED}Error: Repository owner and name are required${NC}" >&2
  usage
fi

if [[ -z "$GITHUB_TOKEN" ]]; then
  echo -e "${RED}Error: GITHUB_TOKEN is required${NC}" >&2
  echo "Get a token from: https://github.com/settings/tokens"
  exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
SEASON=${1:-release}

# Set defaults
if [[ -z "$BRANCH_NAME" ]]; then
  BRANCH_NAME="release/v${VERSION}-${SEASON}-$(date +%Y%m%d%H%M%S)"
fi

if [[ -z "$PR_TITLE" ]]; then
  PR_TITLE="Release build v${VERSION}-${SEASON}"
fi

if [[ -z "$PR_BODY" ]]; then
  PR_BODY="Automated release build from wizardo"
fi

echo -e "${GREEN}=== Git Push & Auto-PR Script ===${NC}"
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo "Branch: $BRANCH_NAME"
echo "PR Title: $PR_TITLE"
echo "Auto-merge: $AUTO_MERGE"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
  echo -e "${YELLOW}Warning: gh (GitHub CLI) not found. Using API directly.${NC}"
  
  # Use GitHub API directly
  create_pr_api() {
    local branch="$1"
    local title="$2"
    local body="$3"
    local base="${4:-main}"
    
    # Create PR using API
    local response=$(curl -s -X POST \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      -d "{\"title\":\"$title\",\"body\":\"$body\",\"head\":\"$branch\",\"base\":\"$base\"}" \
      "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls")
    
    echo "$response"
  }
  
  merge_pr_api() {
    local pr_number="$1"
    local method="${2:-merge}"  # merge, squash, rebase
    
    curl -s -X PUT \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      -d "{\"merge_method\":\"$method\"}" \
      "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls/$pr_number/merge"
  }
  
  PR_FUNC=create_pr_api
  MERGE_FUNC=merge_pr_api
else
  echo -e "${GREEN}Using GitHub CLI (gh)${NC}"
  
  # Set gh authentication
  echo "$GITHUB_TOKEN" | gh auth login --with-token 2>/dev/null || true
  
  PR_FUNC() {
    local branch="$1"
    local title="$2"
    local body="$3"
    
    gh pr create --repo "$REPO_OWNER/$REPO_NAME" --title "$title" --body "$body" --head "$branch" --base main 2>/dev/null
  }
  
  MERGE_FUNC() {
    local pr_number="$1"
    gh pr merge --repo "$REPO_OWNER/$REPO_NAME" --admin --auto 2>/dev/null || true
  }
fi

# Configure git
git config --global user.name "${GIT_USER_NAME:-lunalov2}"
git config --global user.email "${GIT_USER_EMAIL:-lunalov2@users.noreply.sr.ht}"

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Go to dist directory
cd dist

# Initialize git repo if needed
if [[ ! -d ".git" ]]; then
  echo "Initializing git repo..."
  git init
fi

# Create and push branch
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME"

# Configure remote if needed
if ! git remote get-url origin &>/dev/null; then
  # Try to detect if it's a GitHub repo
  if [[ "$REPO_OWNER" != "" ]]; then
    git remote add origin "https://github.com/$REPO_OWNER/$REPO_NAME.git" 2>/dev/null || true
  fi
fi

# Add files and commit
git add .
git commit -m "build: $BRANCH_NAME" || echo "Nothing to commit"

# Push to remote
echo -e "${YELLOW}Pushing to remote...${NC}"
git push -u origin "$BRANCH_NAME" 2>&1 || {
  echo -e "${RED}Failed to push. Make sure the remote is configured.${NC}"
  exit 1
}

# Create PR
echo -e "${YELLOW}Creating Pull Request...${NC}"
PR_OUTPUT=$($PR_FUNC "$BRANCH_NAME" "$PR_TITLE" "$PR_BODY")

if [[ "$PR_OUTPUT" == *"Not Found"* ]] || [[ "$PR_OUTPUT" == *"error"* ]]; then
  echo -e "${RED}Failed to create PR: $PR_OUTPUT${NC}"
  exit 1
fi

# Extract PR number
PR_NUMBER=$(echo "$PR_OUTPUT" | grep -oP '"number":\s*\K\d+' || echo "$PR_OUTPUT" | grep -oP '(?<=pull/)(\d+)' || echo "1")
echo -e "${GREEN}PR created successfully!${NC}"
echo "PR URL: https://github.com/$REPO_OWNER/$REPO_NAME/pull/$PR_NUMBER"

# Auto-merge if requested
if [[ "$AUTO_MERGE" == "true" ]]; then
  echo -e "${YELLOW}Auto-merging PR...${NC}"
  sleep 2  # Wait for PR to be ready
  
  MERGE_RESULT=$($MERGE_FUNC "$PR_NUMBER")
  
  if [[ "$MERGE_RESULT" == *"merged"* ]] || [[ "$MERGE_RESULT" == *"success"* ]]; then
    echo -e "${GREEN}PR merged successfully!${NC}"
  else
    echo -e "${YELLOW}PR merge may require manual review or approval${NC}"
    echo "Merge result: $MERGE_RESULT"
  fi
fi

echo -e "${GREEN}=== Done! ===${NC}"
