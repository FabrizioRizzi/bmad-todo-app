# Docker Secrets Setup

This folder is for local Docker secret files used by `docker-compose.yml`.

## Required Files

Create these files before running `docker compose up`:

- `secrets/postgres_user.txt`
- `secrets/postgres_password.txt`

## Example

```sh
mkdir -p secrets
printf '%s' 'postgres' > secrets/postgres_user.txt
printf '%s' 'change-me' > secrets/postgres_password.txt
```

## Important

- Keep real secret values out of git.
- Only this `README.md` is tracked; other files in this folder are ignored.
