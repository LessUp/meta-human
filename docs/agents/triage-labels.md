# Triage Labels

The `triage` skill uses these labels to track issue state:

| Role            | Label             | Meaning                              |
| --------------- | ----------------- | ------------------------------------ |
| needs-triage    | `needs-triage`    | Maintainer needs to evaluate         |
| needs-info      | `needs-info`      | Waiting on reporter for more details |
| ready-for-agent | `ready-for-agent` | Fully specified, AFK-ready           |
| ready-for-human | `ready-for-human` | Needs human implementation           |
| wontfix         | `wontfix`         | Will not be actioned                 |

## State Machine

```
[New Issue] → needs-triage
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   needs-info  ready-for   wontfix
        │       agent/human      │
        │           │            │
        └───────────┴────────────┘
                    │
                    ▼
               [Closed]
```

## Creating Labels

If these labels don't exist in your GitHub repo, create them:

```bash
gh label create "needs-triage" --description "Needs maintainer evaluation" --color "FBCA04"
gh label create "needs-info" --description "Waiting on reporter for more details" --color "0E8A16"
gh label create "ready-for-agent" --description "Fully specified, AFK-ready" --color "1D76DB"
gh label create "ready-for-human" --description "Needs human implementation" --color "5319E7"
gh label create "wontfix" --description "Will not be actioned" --color "B60205"
```
