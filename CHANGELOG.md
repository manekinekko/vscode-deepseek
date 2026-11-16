# Change Log

All notable changes to "DeepSeek for GitHub Copilot" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.6]

- Added a deprecation dialog that stays open until dismissed or **Read more** is selected, linking to the [Copilot migration guide](https://code.visualstudio.com/docs/agents/run/move-to-copilot). Earlier auto-hiding notifications do not suppress this dialog.
- Activate immediately when VS Code loads the installed extension instead of waiting for startup to finish, so the unacknowledged dialog appears as soon as possible after installation.
- Added **DeepSeek: Show Deprecation Information** to reopen the notice from the Command Palette.
- Only remember the startup notice after the interaction succeeds, allowing a retry after notification or browser-opening failures.
- Marked the display name, description, and README as deprecated, with uninstall instructions and clarification that the migration guide is not a direct DeepSeek/Ollama replacement.
- **Breaking:** Removed the `@deepseek` chat participant ahead of the Local harness removal in February 2027. The extension is retained without a replacement chat integration and no longer provides chat functionality.
- Removed the Ollama integration, automatic model downloads, and the unused `deepseek.model.name` and `deepseek.ollama.host` settings.
- Limited the extension package to the compiled extension, listing assets, license, and release documentation.

## [0.0.5]

- Initial release