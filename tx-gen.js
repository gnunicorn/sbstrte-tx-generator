const { ApiPromise } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { stringToU8a } = require('@polkadot/util');

const setupAccounts = () => {
	const accountNames = [
		"Alice",
		"Bob",
		"Charlie",
		"Dave",
		"Eve",
		"Ferdie",
	];

	const keyring = new Keyring();

	return accountNames.map(name => {
		const seed = name.padEnd(32, ' ');
		return keyring.addFromSeed(stringToU8a(seed));
	});
};

const random = n => Math.floor(Math.random() * Math.floor(n));

const main = async () => {
	const N_TXS = 1000;

	const api = await ApiPromise.create();
	const accounts = setupAccounts();
	const nonces = await Promise.all(accounts.map(async account => {
		let nonce = await api.query.system.accountNonce(account.address());
		return Number(nonce);
	}));

	for (let i = 0; i < N_TXS; i++) {
		const src = random(accounts.length);
		const dst = random(accounts.length);

		const srcAcc = accounts[src];
		const dstAddr = accounts[dst].address();

		const transfer = api.tx.balances.transfer(dstAddr, random(1000));

		try {
			const hash = await transfer.signAndSend(srcAcc, { nonce: nonces[src] });
			nonces[src] += 1;
			console.log('Transfer sent with hash', hash.toHex());
		} catch {
		}
	}
}

main().catch(console.error).finally(() => process.exit());
