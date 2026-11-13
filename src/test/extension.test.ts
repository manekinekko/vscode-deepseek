import * as assert from 'assert';

import * as vscode from 'vscode';

suite('Chat participant retirement', () => {
	function getExtension() {
		const extension = vscode.extensions.getExtension('wassimdev.wassimdev-vscode-deepseek');
		assert.ok(extension, 'The retained extension should be installed');
		return extension;
	}

	test('does not contribute a chat participant', () => {
		assert.strictEqual(getExtension().packageJSON.contributes?.chatParticipants, undefined);
	});

	test('does not contribute the retired settings', () => {
		const configuration = getExtension().packageJSON.contributes?.configuration;
		const sections = Array.isArray(configuration) ? configuration : [configuration];
		for (const section of sections) {
			assert.strictEqual(section?.properties?.['deepseek.model.name'], undefined);
			assert.strictEqual(section?.properties?.['deepseek.ollama.host'], undefined);
		}
	});

	test('activates the retained extension without Ollama', async () => {
		const extension = getExtension();
		await extension.activate();
		assert.strictEqual(extension.isActive, true);
	});
});
