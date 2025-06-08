# GitLab CI/CD Configuration

This directory contains the GitLab CI/CD configuration files for the Quillium project.

## Directory Structure

- `ci/`: Contains individual CI/CD pipeline configurations
  - `renovate.gitlab-ci.yml`: Configuration for Renovate bot dependency updates
  - `contributors.gitlab-ci.yml`: Configuration for automatic contributors list updates
  - `schedules.yml`: Configuration for CI/CD schedules

- `issue_templates/`: Issue templates
  - `bug_report.md`: Template for bug reports
  - `feature_request.md`: Template for feature requests

- `merge_request_templates/`: Merge request templates
  - `default.md`: Default template for merge requests

## Renovate Bot

The project uses [Renovate Bot](https://docs.renovatebot.com/) for automated dependency updates. The configuration is in the root directory's `renovate.json` file.

Renovate will:
- Run on a monthly schedule (first day of each month)
- Update Go dependencies in the backend
- Update pnpm dependencies in the frontend
- Create merge requests for updates

## CI/CD Pipelines

The main pipeline is defined in the root `.gitlab-ci.yml` file, which includes the specific configurations from this directory.

### Stages

1. **test**: Runs tests for both backend (Go) and frontend (React/Next.js)
2. **build**: Builds Docker images
3. **deploy**: Handles deployment tasks

### Schedules

Automated tasks are scheduled as follows:
- **Renovate**: Monthly on the 1st at 2:00 AM
- **Contributors Update**: Daily at 12:00 PM UTC
