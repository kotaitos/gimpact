# gimpact

A visualization tool for Git-based developer activity.

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/kotaitos/gimpact@main/docs/public/screenshot.png">
</div>


## Usage

### npx

```bash
npx gimpact@latest [options]
```

### bunx

```bash
bunx gimpact@latest [options]
```

## Options

- `-V, --version`: Output the version number
- `-d, --days <number>`: Number of days to analyze (default: 30)
- `-s, --since <date>`: Start date (YYYY-MM-DD)
- `-u, --until <date>`: End date (YYYY-MM-DD)
- `-m, --mode <type>`: Analysis mode: `aggregate`, `periodic`, `ownership` (default: `aggregate`)
- `-p, --period-unit <type>`: Period unit for periodic mode: `daily`, `weekly`, `monthly` (default: `daily`)
- `-a, --authors <names...>`: Filter by specific author names (can specify multiple). Enables deep-dive stability analysis
- `-b, --branch <name>`: Analyze specific branch (default: current branch)
- `-c, --min-commits <number>`: Minimum number of commits to include an author (default: 1)
- `-h, --help`: Display help for command

## Commands

- `summary`: Show aggregate report with all analyses (default)
- `daily`: Show daily periodic report
- `weekly`: Show weekly periodic report
- `monthly`: Show monthly periodic report
- `ownership`: Show code ownership analysis (files, directories, authors)
