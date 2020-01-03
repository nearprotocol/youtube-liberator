const pug = require('pug');
const IPFS = require('ipfs');
const ipfsClient = require('ipfs-http-client');

const renderVideoPage = pug.compileFile('web/index.pug');

function generateVideoPage(title, videoHash, thumbnailHash) {
    return renderVideoPage({ title, videoHash, thumbnailHash });
}

const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

(async () => {
    const ipfs = await IPFS.create();
    // await ipfs.swarm.connect("/dns4/ipfs.nearprotocol.com/tcp/4001/ipfs/QmSttCRFW3ibTPBkbimmrfuy1M622qAZ7D1W1s7Wp66mLz");
    await ipfs.swarm.connect("/dns4/ipfs.nearprotocol.com/tcp/4003/wss/ipfs/QmSttCRFW3ibTPBkbimmrfuy1M622qAZ7D1W1s7Wp66mLz");

    // const ipfsInfura = await ipfsClient({
    //     host: 'ipfs.infura.io',
    //     port: '5001',
    //     protocol: 'https'
    // });

    const dir = './scratch/lunch_learn';
    const files = await readdir(dir);

    async function printPeers() {
        const addrs = await ipfs.swarm.addrs();
        console.log('addrs', addrs.map(peerInfo => peerInfo.multiaddrs.toArray().map(a => a.toString())));
    }

    await printPeers();
    for (let f of files) {
        if (/.+\.mp4$/.exec(f)) {
            const videoFile = `${dir}/${f}`;
            const jsonFile = videoFile.replace(/\.mp4$/, '.info.json');
            const json = JSON.parse(await readFile(jsonFile));
            const thumbnailFile = videoFile.replace(/\.mp4$/, '.jpg');
            const [{ hash: videoHash }] = await ipfs.addFromFs(videoFile);
            const [{ hash: thumbnailHash }] = await ipfs.addFromFs(thumbnailFile);
            const html = generateVideoPage(json.title, videoHash, thumbnailHash);
            const [{ hash: htmlHash }] = await ipfs.add(Buffer.from(html));
            console.log(`${htmlHash} ${json.title}`);
            // await ipfsInfura.pin.add(htmlHash);
            // await ipfsInfura.pin.add(thumbnailHash);
            // await ipfsInfura.pin.add(videoHash);
        }
    }
    await printPeers();
})().catch(console.error);

