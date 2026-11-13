<p align="center">
<h1 align="center">DeepSeek Agent for Github Copilot<img src="preview.png" width="80"/></h1>
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

## Chat participant removal

The `@deepseek` chat participant has been removed without a replacement. The extension is retained and can still be installed, but it no longer provides chat functionality, connects to Ollama, or downloads models.

This change prepares for the [Local harness removal scheduled for February 2027](https://code.visualstudio.com/docs/agents/run/move-to-copilot). Chat participants are not supported in the Copilot harness. See [issue #9](https://github.com/manekinekko/vscode-deepseek/issues/9) and the [chat participant migration guide](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#_replace-chat-participants) for background.

The `deepseek.model.name` and `deepseek.ollama.host` settings have also been removed. Existing values in `settings.json` are no longer used and can be deleted. Ollama is no longer required by this extension.

These changes apply to the source in this repository and its next release; Marketplace version 0.0.5 still contains the original participant until an updated version is published.

## Build from source

1. Clone this repository
2. Run `npm install`
3. Run `npm run package`
4. Install the generated `.vsix` file in Visual Studio Code

