> **Deprecated:** DeepSeek for GitHub Copilot no longer provides chat functionality and can be uninstalled. The [Copilot migration guide](https://code.visualstudio.com/docs/agents/run/move-to-copilot) covers customization options, not a direct replacement for DeepSeek/Ollama chat.

<p align="center">
<h1 align="center">DeepSeek for GitHub Copilot (Deprecated)<img src="preview.png" width="80"/></h1>
</p>
<p align="center">
<img src="deepseek.png" alt="DeepSeek" width="200"/>
</p>

<h3 align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=wassimdev.wassimdev-vscode-deepseek" alt="Marketplace version">
        <img src="https://img.shields.io/visual-studio-marketplace/v/wassimdev.wassimdev-vscode-deepseek?label=VS%20Code%20Marketplace&style=flat-square" />
    </a>
    <img alt="GitHub License" src="https://img.shields.io/github/license/manekinekko/vscode-deepseek?style=flat-square"/>
    <img alt="Static Badge" src="https://img.shields.io/badge/version-preview-pink?style=flat-square"/>
</h3>

## Deprecation and migration

**This extension is deprecated.** It is no longer recommended for new installations, and existing users can uninstall it. Version 0.0.6 exists to communicate the deprecation; it does not provide a replacement chat experience.

The migration guide describes skills, custom agents, and MCP tools as customization options. It does not configure DeepSeek or Ollama for you or replace the removed `@deepseek` integration.

### Removed functionality

The `@deepseek` chat participant has been removed without a replacement. The extension is retained and can still be installed, but it no longer provides chat functionality, connects to Ollama, or downloads models.

This change prepares for the [Local harness removal scheduled for February 2027](https://code.visualstudio.com/docs/agents/run/move-to-copilot). Chat participants are not supported in the Copilot harness. See [issue #9](https://github.com/manekinekko/vscode-deepseek/issues/9) and the [chat participant migration guide](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#_replace-chat-participants) for background.

The `deepseek.model.name` and `deepseek.ollama.host` settings have also been removed. Existing values in `settings.json` are no longer used and can be deleted. Ollama is no longer required by this extension.

The extension is deprecated. It activates immediately when VS Code loads it after installation, without waiting for startup to finish, and shows a deprecation dialog that stays open until you dismiss it or select **Read more**, which opens the [Copilot migration guide](https://code.visualstudio.com/docs/agents/run/move-to-copilot). If VS Code requires a reload to load the installed extension, the dialog appears after that reload. Your acknowledgment is remembered locally, so the dialog is not shown again on subsequent startups or reinstalls. Earlier auto-hiding notifications do not count as acknowledgment.

You can reopen the notice at any time using **DeepSeek: Show Deprecation Information** in the Command Palette. If displaying the notice or opening the guide fails, the notice remains eligible to appear on the next activation.

Version **0.0.6** is a retirement release. Updating from 0.0.5 removes the original participant and its settings without a replacement integration.

## Uninstall

Open the Extensions view in VS Code, find **DeepSeek for GitHub Copilot**, and select **Uninstall**. You can also remove the unused `deepseek.model.name` and `deepseek.ollama.host` entries from `settings.json`. Uninstalling this extension does not uninstall Ollama or delete downloaded models.

## Build from source

Requires Node.js 22 or later and npm.

1. Clone this repository.
2. Run `npm ci`.
3. Run `npm test` to check the retained extension in VS Code.
4. Run `npm run package` to type-check, lint, and bundle the extension into `wassimdev-vscode-deepseek-0.0.6.vsix`.
5. In VS Code, run **Extensions: Install from VSIX...** and select that file.

## Publish to the VS Code Marketplace

The extension ID remains `wassimdev.wassimdev-vscode-deepseek`. Publishing requires access to the existing **wassimdev** publisher; do not create a new publisher or change the extension ID.

1. Review the breaking changes in [CHANGELOG.md](CHANGELOG.md), confirm that the version in `package.json` has not already been published, and follow the build steps above.
2. Inspect the package contents with `npx vsce ls`. Only the compiled extension, manifest, README, changelog, license, and listing images should be included.
3. Install and review the generated VSIX before publishing. Confirm that the deprecation warning appears, **Read more** opens the Copilot migration guide, **DeepSeek: Show Deprecation Information** reopens the notice, and there is no `@deepseek` participant or retired extension settings.
4. Sign in to the [Marketplace publisher management page](https://marketplace.visualstudio.com/manage), select **wassimdev**, and upload the generated VSIX as an update to the existing extension.
5. Verify the version and retirement notice on the [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=wassimdev.wassimdev-vscode-deepseek).

For authenticated CLI publishing, `npm run publish:marketplace` builds and publishes the version in `package.json`; it is not a dry run. For automation, prefer [GitHub Actions Trusted Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publish-with-github-actions-and-trusted-publishing) with `npm run publish:marketplace -- --oidc` in a configured GitHub Actions job with `id-token: write`. Never commit publishing credentials.

For subsequent releases, use `npm version patch --no-git-tag-version` to update both `package.json` and `package-lock.json`, then update the changelog before packaging.

