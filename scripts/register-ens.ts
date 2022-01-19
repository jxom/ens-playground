import 'dotenv/config';
// @ts-ignore
import getRandomValues from 'get-random-values';
import { Contract, Wallet, providers, utils } from 'ethers';
// @ts-ignore
import { getENSContract } from '@ensdomains/ensjs';

import resolverAbi from '../abis/resolver.json';
import controllerAbi from '../abis/controller.json';

const SECONDS_IN_YEAR = 31536000;

registerENS();

async function registerENS() {
  const [_a, _b, name, owner, durationInYears] = process.argv;
  if (!name || !owner || !durationInYears) {
    console.log('yo dawg, you need to give me the correct args!')
    console.log('');
    console.log('usage: yarn register-ens [name] [owner address] [duration in years]')
    console.log('example: yarn register-ens gm.eth 0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b 5')
  }

  const duration = parseInt(durationInYears) * SECONDS_IN_YEAR;

  const provider = new providers.StaticJsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.WALLET_SECRET_KEY as string, provider);

  const ens = getENSContract({ provider: wallet, address: process.env.ENS_CONTRACT_ADDRESS });

  const ethNamespace = utils.namehash('eth');
  const ethResolverAddress = await ens.resolver(ethNamespace);
  const ethResolver = new Contract(ethResolverAddress, resolverAbi, wallet);
  const controllerAddress = await ethResolver.interfaceImplementer(ethNamespace, process.env.ENS_CONTROLLER_INTERFACE_ID);
  const controller = new Contract(controllerAddress, controllerAbi, wallet);

  const ensName = name.replace(/\.eth$/, '');
  const available = await controller.available(ensName);

  if (available) {
    // Generate a random value to mask our commitment
    const random = new Uint8Array(32);
    getRandomValues(random);
    const salt =
      '0x' +
      Array.from(random)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    // Submit our commitment to the smart contract
    const commitment = await controller.makeCommitment(ensName, owner, salt);
    await controller.commit(commitment);

    // Add 10% to account for price fluctuation; the difference is refunded.
    const price = (await controller.rentPrice(ensName, duration)) * 1.1;

    console.log(`ser, i am going to register ${ensName}.eth in T-minus 60 seconds...`);
    console.log(`register price: ${utils.formatEther(price.toString())}eth`);
    
    // Wait 60 seconds before registering
    setTimeout(async () => {
      // Submit our registration request
      await controller.register(ensName, owner, duration, salt, { value: price.toString() });
      // await controller.registerWithConfig(ensName, owner, duration, salt, ethResolverAddress, owner, { value: price.toString() });

      console.log('your ENS is registered fren');
    }, 60000);
  } else {
    console.log('this ENS not available fren');
  }
}
