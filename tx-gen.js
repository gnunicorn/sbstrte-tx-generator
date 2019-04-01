const { ApiPromise } = require('@polkadot/api');
const TestKeyring = require('@polkadot/keyring/testingPairs').default;
const { Keyring } = require('@polkadot/keyring');
const { randomAsU8a } = require('@polkadot/util-crypto');
const sleep = (millis) => new Promise(_ => setTimeout(_, millis));

async function main () {
    const keyring = new Keyring();
    const api = await ApiPromise.create();
    const testKeyring = TestKeyring();

    let nonce = await api.query.system.accountNonce(testKeyring.alice.address());
    console.log(nonce)
    let amount = 501;
    for (let j = 0; j < 100000; j++) {
        for (let i = 0; i < 11; i++) {
            const hash = await api.tx.balances
                .transfer(keyring.encodeAddress(randomAsU8a()), amount)
                .signAndSend(testKeyring.alice, { nonce });
           // if (i === 0) console.log(`sent ${hash} with nonce ${nonce}`);
            nonce = nonce.addn(1);
        }
        let [accountNonce, blockPeriod, validators] = await Promise.all([
            api.query.system.accountNonce(testKeyring.alice.address()),
            api.query.timestamp.blockPeriod(),
            api.query.session.validators()
        ]);

        await sleep(280);
        if (validators && validators.length > 0 ) {
            const validatorBalances = await Promise.all(
                validators.map(authorityId =>
                    api.query.balances.freeBalance(authorityId)
                )
            );
            console.log(`balance: ${validatorBalances[0].toString()}`);
            console.log(`accountNonce(${testKeyring.alice.address()}) ${accountNonce} - nonce: ${nonce} - diff: ${nonce - accountNonce}`);
            //console.log(`blockPeriod ${blockPeriod.toNumber()} seconds`);
            if (nonce.words[0] > accountNonce.words[0] + 220) {
                while (nonce > accountNonce.words[0]) {
                    console.log("Sleeping to allow tx catch up....");
                    await sleep(100);
                    accountNonce = await api.query.system.accountNonce(testKeyring.alice.address());
                }
                nonce = await api.query.system.accountNonce(testKeyring.alice.address());
                console.log('Reset account nonce to:' + nonce);
            }
        }
    }
}
main().catch(console.error).finally(() => process.exit());