import * as assert from 'assert';
import { mock } from 'node:test';

import * as vscode from 'vscode';
import { activate } from '../extension';

suite('Deprecation notification', () => {
	let state: Map<string, unknown>;
	let context: Pick<vscode.ExtensionContext, 'globalState' | 'subscriptions'>;

	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension('wassimdev.wassimdev-vscode-deepseek');
		assert.ok(extension);
		await extension.activate();
	});

	setup(() => {
		state = new Map();
		const globalState = {
			keys: () => [...state.keys()],
			get<T>(key: string, defaultValue?: T): T {
				return (state.has(key) ? state.get(key) : defaultValue) as T;
			},
			async update(key: string, value: unknown) {
				state.set(key, value);
			},
			setKeysForSync() {},
		};
		context = { globalState, subscriptions: [] };
		mock.method(vscode.commands, 'registerCommand', () => new vscode.Disposable(() => {}));
	});

	teardown(() => mock.restoreAll());

	const settleNotification = () => new Promise<void>((resolve) => setImmediate(resolve));

	test('shows the deprecation warning once and remembers dismissal', async () => {
		const warning = mock.method(vscode.window, 'showWarningMessage', async () => undefined);
		const openExternal = mock.method(vscode.env, 'openExternal', async () => true);

		activate(context);
		await settleNotification();
		assert.strictEqual(warning.mock.callCount(), 1);
		const message = warning.mock.calls[0].arguments[0];
		assert.ok(message);
		assert.match(message, /deprecated/);
		assert.match(message, /can be uninstalled/);
		assert.match(message, /not a direct replacement/);
		assert.deepStrictEqual(warning.mock.calls[0].arguments[1], { modal: true });
		assert.strictEqual(warning.mock.calls[0].arguments[2], 'Read more');
		assert.strictEqual(openExternal.mock.callCount(), 0);
		assert.strictEqual(state.get('deprecationNoticeAcknowledged'), true);

		const warningsShown = warning.mock.callCount();
		activate(context);
		await settleNotification();
		assert.strictEqual(warning.mock.callCount(), warningsShown);
	});

	test('opens the migration guide when Read more is selected', async () => {
		mock.method(vscode.window, 'showWarningMessage', async () => 'Read more');
		const openExternal = mock.method(vscode.env, 'openExternal', async () => true);

		activate(context);
		await settleNotification();
		assert.strictEqual(openExternal.mock.callCount(), 1);
		const uri = openExternal.mock.calls[0].arguments[0];
		assert.ok(uri);
		assert.strictEqual(
			uri.toString(),
			'https://code.visualstudio.com/docs/agents/run/move-to-copilot',
		);
	});

	test('reports a failure to open the migration guide', async () => {
		mock.method(vscode.window, 'showWarningMessage', async () => 'Read more');
		mock.method(vscode.env, 'openExternal', async () => false);
		const error = mock.method(vscode.window, 'showErrorMessage', async () => undefined);

		activate(context);
		await settleNotification();
		assert.strictEqual(error.mock.callCount(), 1);
		const message = error.mock.calls[0].arguments[0];
		assert.ok(message);
		assert.match(message, /Could not open/);
		assert.strictEqual(state.has('deprecationNoticeAcknowledged'), false);
	});

	test('waits for the notification interaction before remembering it', async () => {
		let dismiss: ((value: undefined) => void) | undefined;
		mock.method(vscode.window, 'showWarningMessage', () => new Promise<undefined>((resolve) => {
			dismiss = resolve;
		}));

		activate(context);
		await settleNotification();
		assert.strictEqual(state.has('deprecationNoticeAcknowledged'), false);
		assert.ok(dismiss);
		dismiss(undefined);
		await settleNotification();
		assert.strictEqual(state.get('deprecationNoticeAcknowledged'), true);
	});

	test('retries the startup notice if displaying it fails', async () => {
		const warning = mock.method(vscode.window, 'showWarningMessage', async () => {
			throw new Error('Notification unavailable');
		});
		const error = mock.method(vscode.window, 'showErrorMessage', async () => undefined);

		activate(context);
		await settleNotification();
		assert.strictEqual(state.has('deprecationNoticeAcknowledged'), false);
		assert.strictEqual(error.mock.callCount(), 1);

		warning.mock.mockImplementation(async () => undefined);
		activate(context);
		await settleNotification();
		assert.strictEqual(warning.mock.callCount(), 2);
		assert.strictEqual(state.get('deprecationNoticeAcknowledged'), true);
	});

	test('reopens the notice through the command after the startup notice was dismissed', async () => {
		state.set('deprecationNoticeAcknowledged', true);
		const warning = mock.method(vscode.window, 'showWarningMessage', async () => undefined);
		const openExternal = mock.method(vscode.env, 'openExternal', async () => true);

		activate(context);
		await settleNotification();
		assert.strictEqual(warning.mock.callCount(), 0);

		await vscode.commands.executeCommand('deepseek.showDeprecationInformation');
		await vscode.commands.executeCommand('deepseek.showDeprecationInformation');
		assert.strictEqual(warning.mock.callCount(), 2);
		assert.strictEqual(openExternal.mock.callCount(), 0);
	});

	test('shows the dialog even if the earlier notification was marked as shown', async () => {
		state.set('deprecationNoticeShown', true);
		const warning = mock.method(vscode.window, 'showWarningMessage', async () => undefined);

		activate(context);
		await settleNotification();
		assert.strictEqual(warning.mock.callCount(), 1);
		assert.deepStrictEqual(warning.mock.calls[0].arguments[1], { modal: true });
		assert.strictEqual(state.get('deprecationNoticeAcknowledged'), true);
	});
});

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
