# Deploying to Walrus Sites

A simple guide to deploy your dashboard to Walrus Sites.

## Prerequisites

- `walrus` CLI tool installed
- `site-builder` CLI tool installed
- Sui wallet configured on mainnet
- SUI tokens for gas fees (~0.5 SUI)
- A SuiNS name (get one at [suins.io](https://suins.io))

## Step 1: Switch to Mainnet

Make sure your Sui CLI is on mainnet:

```bash
sui client switch --env mainnet
```

Verify:

```bash
sui client active-env
```

## Step 2: Build Your App

```bash
bun run build
```

This creates the production build in the `dist/` folder.

## Step 3: Test Your Build Locally (Recommended)

Before deploying to Walrus, test your build locally to catch any issues:

```bash
bun run preview
```

This starts a local server (usually at `http://localhost:4173`) that serves your production build—the exact same files that will be deployed to Walrus.

**What to check:**

- ✅ Page loads without errors
- ✅ No JavaScript syntax errors in browser console
- ✅ All SVG icons and assets load correctly
- ✅ Wallet connection works
- ✅ Navigation works as expected

**Press Ctrl+C to stop the preview server when done testing.**

## Step 4: Deploy to Walrus Sites

```bash
site-builder publish --epochs 1 dist
```

This command will:

- Parse your `dist/` directory
- Upload all files to Walrus
- Create a site object on Sui
- Output a **Site Object ID** (save this!)

Example output:

```
New site object ID: 0x72ebe740a8f9f1c92ea0e4d166386b88d69d9668d802928b6ef55707371efbc3
```

## Step 5: Link Your SuiNS Name

1. Go to https://suins.io/account/my-names/
2. Find your SuiNS name (e.g., `deepmargindashbord`)
3. Click **Edit** on the SuiNS card
4. Click **Link Walrus Site**
5. Paste the new **Site Object ID** from Step 3
6. Save the changes

## Step 6: Access Your Site

Your site will be live at:

```
https://[your-suins-name].wal.app/
```

For example: https://deepmargindashbord.wal.app/

**Note:** It may take a few minutes for the link to propagate.

## Updating Your Site

To deploy updates:

1. Make your code changes
2. Run `bun run build`
3. Run `site-builder publish --epochs 1 dist`
4. Get the new Site Object ID
5. Update the link in SuiNS (repeat Step 4)

## Storage Duration

The `--epochs 1` flag stores your site for 1 epoch (~24 hours on mainnet).

For longer storage:

- Use `--epochs 10` for ~10 days
- Maximum: `--epochs 53` (~53 days)

## Troubleshooting

### "Client older than 30 days" warning

Update your tools:

```bash
# Download latest walrus
cd /tmp
curl -fLO https://storage.googleapis.com/mysten-walrus-binaries/walrus-mainnet-latest-ubuntu-x86_64
chmod +x walrus-mainnet-latest-ubuntu-x86_64
mv walrus-mainnet-latest-ubuntu-x86_64 ~/.local/bin/walrus

# Download latest site-builder
curl -fLO https://storage.googleapis.com/mysten-walrus-binaries/site-builder-mainnet-latest-ubuntu-x86_64
chmod +x site-builder-mainnet-latest-ubuntu-x86_64
mv site-builder-mainnet-latest-ubuntu-x86_64 ~/.cargo/bin/site-builder
```

### "blobs can only be stored for up to X epochs"

Reduce the `--epochs` number in your publish command.

### Site not loading

- Wait a few minutes after updating SuiNS
- Clear your browser cache
- Check that the Site Object ID in SuiNS matches your latest deployment

## Quick Reference

```bash
# 1. Build
bun run build

# 2. Test locally (optional but recommended)
bun run preview
# Visit http://localhost:4173 and verify everything works
# Press Ctrl+C when done

# 3. Deploy
site-builder publish --epochs 1 dist

# 4. Copy the Site Object ID

# 5. Update SuiNS at https://suins.io/account/my-names/

# 6. Visit https://deepmargindashbord.wal.app/
```

---

**That's it!** Your dashboard is now decentralized on Walrus. 🎉
