#!/usr/bin/env python3

import subprocess
import re
import json
import os
from datetime import datetime

def normalize_username(text):
    """Convert text to a normalized form for comparison."""
    if not text:
        return ""
    # Remove spaces, convert to lowercase
    return re.sub(r'[^a-z0-9]', '', text.lower())

def extract_existing_contributors(content):
    """Extract existing contributors from the markdown file."""
    existing_contributors = set()
    
    # Use regex to find GitHub usernames in the content
    pattern = r'https://github\.com/([\w-]+)'
    matches = re.findall(pattern, content)
    
    for username in matches:
        existing_contributors.add(username.lower())
    
    print(f"Found {len(existing_contributors)} existing contributors: {existing_contributors}")
    return existing_contributors

def extract_username_from_email(email):
    """Extract a username from an email address."""
    if not email or '@' not in email:
        return ""
    
    # Get the part before the @ symbol
    username = email.split('@')[0].lower()
    # Remove special characters
    username = re.sub(r'[^a-z0-9]', '', username)
    return username

def main():
    # Get contributors from git log
    git_log = subprocess.check_output(
        ['git', 'log', '--format=%an|%ae|%ad', '--date=short'],
        text=True
    )
    
    # Read the current CONTRIBUTORS.md file
    with open('CONTRIBUTORS.md', 'r') as f:
        content = f.read()
    
    # Extract existing contributors
    existing_contributors = extract_existing_contributors(content)
    
    # Parse contributors
    contributors = {}
    for line in git_log.splitlines():
        if not line.strip():
            continue
        
        parts = line.split('|')
        if len(parts) < 2:
            continue
            
        name = parts[0].strip()
        email = parts[1].strip()
        date = parts[2].strip() if len(parts) > 2 else ''
        
        # Skip bots and GitHub actions
        if '[bot]' in name or '[bot]' in email or 'github-actions' in name.lower() or 'github-actions' in email.lower() or 'noreply@github.com' in email.lower():
            print(f"Skipping bot: {name} <{email}>")
            continue
        
        # Extract username from email
        username = extract_username_from_email(email)
        
        # Normalize name for comparison
        normalized_name = normalize_username(name)
        
        # Try to find a matching GitHub username
        if normalized_name in existing_contributors:
            # If normalized name matches an existing contributor, use that
            username = normalized_name
        elif username in existing_contributors:
            # If email username matches an existing contributor, use that
            pass
        else:
            # Use the first part of the email as username
            pass
        
        # Skip if this contributor is already in the file
        if username.lower() in existing_contributors:
            print(f"Skipping existing contributor: {name} ({username})")
            continue
        
        # Store the earliest contribution date
        if username not in contributors or (date and date < contributors[username].get('date', '9999-99-99')):
            contributors[username] = {
                'name': name,
                'email': email,
                'date': date,
                'username': username
            }
    
    # If no new contributors, exit early
    if not contributors:
        print("No new contributors found. Exiting.")
        return
    
    # Sort contributors by name
    sorted_contributors = sorted(
        contributors.items(),
        key=lambda x: x[1]['name'].lower()
    )
    
    # Find the section to replace
    start_marker = '<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->'
    end_marker = '<!-- ALL-CONTRIBUTORS-LIST:END -->'
    
    start_index = content.find(start_marker)
    end_index = content.find(end_marker)
    
    if start_index == -1 or end_index == -1:
        print("Could not find contributors section markers in CONTRIBUTORS.md")
        exit(1)
    
    # Extract the existing table content
    table_content = content[start_index + len(start_marker):end_index].strip()
    
    # Find the end of the table (before the closing comments)
    table_end = table_content.find('<!-- markdownlint-restore -->')
    if table_end == -1:
        # If not found, assume it's a new table
        table_rows = []
    else:
        # Extract just the table rows
        table_rows_content = table_content[:table_end].strip()
        # Split by newlines and filter out header rows
        rows = table_rows_content.split('\n')
        # Keep only the contributor rows (skip headers)
        table_rows = [row for row in rows if row.startswith('|') and not row.startswith('| :')]
        # Remove the header rows if they exist
        while table_rows and (not table_rows[0].startswith('| <a href') or '| Contributor |' in table_rows[0]):
            table_rows.pop(0)
    
    # Add new contributors to the table
    for username, data in sorted_contributors:
        name = data['name']
        github_username = data['username']
        # Use GitHub avatar API to get an avatar
        avatar_url = f"https://avatars.githubusercontent.com/{github_username}?s=100"
        new_row = f"| <a href=\"https://github.com/{github_username}\"><img src=\"{avatar_url}\" width=\"100px;\" alt=\"{name}\"/><br /><sub><b>{name}</b></sub></a> | 💻 Code |"
        table_rows.append(new_row)
    
    # Generate the new contributors table
    contributors_table = start_marker + '\n'
    contributors_table += '<!-- prettier-ignore-start -->\n'
    contributors_table += '<!-- markdownlint-disable -->\n\n'
    
    contributors_table += '| Contributor | Contributions |\n'
    contributors_table += '| :--- | :--- |\n'
    
    # Add all rows
    for row in table_rows:
        contributors_table += row + '\n'
    
    contributors_table += '\n<!-- markdownlint-restore -->\n'
    contributors_table += '<!-- prettier-ignore-end -->\n'
    contributors_table += end_marker
    
    # Replace the section in the content
    new_content = content[:start_index] + contributors_table + content[end_index + len(end_marker):]
    
    # Write the updated content back to the file
    with open('CONTRIBUTORS.md', 'w') as f:
        f.write(new_content)
    
    print(f"Updated CONTRIBUTORS.md with {len(sorted_contributors)} new contributors")

if __name__ == "__main__":
    main()
