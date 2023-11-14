import { Button } from 'antd';
import { BaseLayout, Left, Right } from 'components/BaseLayout';
import PostItems from 'components/PostItems';
import { dbQuery } from 'core/db';
import { DbEvent } from 'core/db/schema';
import { useCallWorker } from 'hooks/useWorker';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { HomeMsgFilter, homeMsgFilters } from 'pages/home/filter';
import { useEffect, useState } from 'react';

const Perf = () => {
  const relayUrls = [
    'wss://nostr.rocks/',
    'wss://relay.snort.social/',
    'wss://relay.damus.io/',
    'wss://relay.nostr.bg/',
    'wss://relay.nostr.info/',
    'wss://nostr.orangepill.dev/',
    'wss://nostr-pub.wellorder.net/',
    'wss://universe.nostrich.land/',
    'wss://relay.nostr.band/',
  ];
  const authors = [
    '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
    '9fec72d579baaa772af9e71e638b529215721ace6e0f8320725ecbf9f77f85b1',
    '840f9d415fe27e55b98913ac5e3b106d68447c84a86b5b0b91deb8aebaa35bb8',
    '47b3b0bd7af5af00783033e4bbcf0e59378b4b1fd13df0065d9101259a7877c7',
    '9989500413fb756d8437912cc32be0730dbe1bfc6b5d2eef759e1456c239f905',
    'd543c820050efd6d2c1536b0990111ac293a4431e6a12929432366e0aa8001e7',
    'ec8f72ff2937c197cb0d032dae27bae073ae6a4e1bd2a8e2ef1578636b3595cb',
    'cfa3df9203c440a5b94b1f863094e683412ce9d422a7f99c5346e43fe2001d92',
    '649eefe468ddb107c05eba6d0511d2a5298540fe4d5f0072b00636008fc72f92',
    'fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52',
    '7b3818d088a886b801e1bba962d35001a07d3d8e3f1e89d15bd7ba1613cafd96',
    'c04330adadd9508c1ad1c6ede0aed5d922a3657021937e2055a80c1b2865ccf7',
    '3335d373e6c1b5bc669b4b1220c08728ea8ce622e5a7cfeeb4c0001d91ded1de',
    '4d0068338af5ee79c06513deaaf02492247bbf7abd29f116e6e50c158ab6a677',
    'e8c1ca03a46d97184bfcd9125a5c9674a867bd1beaebe47c77d4eaec6c5ee874',
    '428107e3b4b05df1e13c42b3bacb3fddf54c7ed12630e91870d5d8d0b4a091de',
    'f0c864cf573de171053bef4df3b31c6593337a097fbbd9f20d78506e490c6b64',
    '37867c446392c146110b9f041d2ddb47a210a29f3c792b8730264dfcbb9ffd4a',
    '3fcf32612554edf8d94957a05da0b522b19cccbb4ad12289a1294670dba8b293',
    '31a212844758def35377351ce2f13099b705ce0d4ee28eaa08a3d403d7407a1e',
    '8888888890493e0c6a6e4a24ae3319a0d7fc595ca3d8e5cae19954e1139008d3',
    '22aa81510ee63fe2b16cae16e0921f78e9ba9882e2868e7e63ad6d08ae9b5954',
    '123456785ee7815751c28004e6cef4398e1256f94a93bf51f90018e28accbfb4',
    '2edbcea694d164629854a52583458fd6d965b161e3c48b57d3aff01940558884',
    '3acf7ffdbab8f2d07029a8d7e2a4439f2c131d41450faefe3f5972e0937abb7b',
    '7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194',
    '3f7d1a20c17a3d9e3865e65aa4ede110eb0238e93664a3f7cdf4b32bbb856f90',
    'c5f89617eafa35b0bfe08b610832b2e5398e33887d4348dc9da1978ada02cca4',
    'eaf1a13a032ce649bc60f290a000531c4d525f6a7a28f74326972c4438682f56',
    '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
    '3b4aa866bf843362d560c5718f9544cd80e7d5492142cd7b00d731801f48b82c',
    '29320975df855fe34a7b45ada2421e2c741c37c0136901fe477133a91eb18b07',
    'de7ecd1e2976a6adb2ffa5f4db81a7d812c8bb6698aa00dcf1e76adb55efd645',
    'ae4046e025b60c90c35ce8353983b54c0a7af6ef2009baf1bce69d7dc87dfc5c',
    '4657dfe8965be8980a93072bcfb5e59a65124406db0f819215ee78ba47934b3e',
    '70b70b0bbfc91d117d33cac1ac7ef17e3ba3d260ccf95296a42ea85ff1a9da5c',
    '8f5eb343bf1df9c636162e1ccef0478407e9d29482bd20485ef075c8f560fe6e',
    '4379e76bfa76a80b8db9ea759211d90bb3e67b2202f8880cc4f5ffe2065061ad',
    '671bc8262de6ce1090ce20a2025fe4e74b95f7a04fe5c6e4698194220020b005',
    'db004d573bf8ee973d0957de45f3a22cdf2331b3a70d2cae8721b2ca1d69ab22',
    '6b9da920c4b6ecbf2c12018a7a2d143b4dfdf9878c3beac69e39bb597841cc6e',
    'b2dd40097e4d04b1a56fb3b65fc1d1aaf2929ad30fd842c74d68b9908744495b',
    'f8a42a0f95d83b2f5c6f9d4fd555509158e21ee4d2f47b1bbd76c1c7c1f08344',
    '1cc821cc2d47191b15fcfc0f73afed39a86ac6fb34fbfa7993ee3e0f0186ef7c',
    '4523be58d395b1b196a9b8c82b038b6895cb02b683d0c253a955068dba1facd0',
    'da93192957495fb59f6ef1ce19e74947b0792b6eaa1b134a015c0326e4097d1a',
    '49632ffc6cb35667aa8ea52559b92ddb181d87a24b6819e26821e6e770733d11',
    '29e0f527adb91b1f92d4de7806b100065201208842cd0b04e97f71f24f489935',
    '8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168',
    '84dee6e676e5bb67b4ad4e042cf70cbd8681155db535942fcc6a0533858a7240',
    '726a1e261cc6474674e8285e3951b3bb139be9a773d1acf49dc868db861a1c11',
    '9f376635bfcc2021daa2ddf5b93420e0a8a468ba35ccf613587948697bc42976',
    '634bd19e5c87db216555c814bf88e66ace175805291a6be90b15ac3b2247da9b',
    'b7049e8e2ffe31f083cfa973fe3e0fdfe6afba48fa892811e2049f68cc0c4b26',
    '2d5b6404df532de082d9e77f7f4257a6f43fb79bb9de8dd3ac7df5e6d4b500b0',
    '0ff4ba1519d213c7dc9454685bf1297a0f8911b46bc0bf8a2fd551394367dd6e',
    'b6cbc8c8c8933ff5778a29fc118f802fe518e102368b3dbf59fce0f85f6c0c6c',
    'c473cd8beff54253f37654f4aedb9199b4a1fbf78ffc076589d9d07053254abb',
    'cc8d072efdcc676fcbac14f6cd6825edc3576e55eb786a2a975ee034a6a026cb',
    '09ac853baa8a86ec8ed1fdc5d881fdd8f45c7646acadebed2be8dee7c3009be4',
    '63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed',
    '9be0be0e64d38a29a9cec9a5c8ef5d873c2bfa5362a4b558da5ff69bc3cbb81e',
    '75bf23531ae9f98c62995ba07191e488ead475975371d63d7dfd46bde1bfa895',
    '76c71aae3a491f1d9eec47cba17e229cda4113a0bbb6e6ae1776d7643e29cafa',
    '35d26e4690cbe1a898af61cc3515661eb5fa763b57bd0b42e45099c8b32fd50f',
    'fcf70a45cfa817eaa813b9ba8a375d713d3169f4a27f3dcac3d49112df67d37e',
    '97795b1252d88548c1c41ce43d15bbfdeb987dddb56e56207a1e1fd279a450d7',
    'ee11a5dff40c19a555f41fe42b48f00e618c91225622ae37b6c2bb67b76c4e49',
    '9c163c7351f8832b08b56cbb2e095960d1c5060dd6b0e461e813f0f07459119e',
    '5c750a73f845bc1c9890e9a3ce0f198994117385a880b372f98edf452e58e604',
    '597b42de56a9e0c19ee2d0cde5797dd58d48ce8dd25c732b4c873af11161f9fd',
    'b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525',
    '4864d464bc97a097430ea6d10181cbd34c459896b97f6220ed43844f93da6961',
    '55f04590674f3648f4cdc9dc8ce32da2a282074cd0b020596ee033d12d385185',
    '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
    '3356de61b39647931ce8b2140b2bab837e0810c0ef515bbe92de0248040b8bdd',
    '97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322',
    'a4c8b64e1a32be588f210ac1482e73884c53966e33e94f2579cb5be256989c56',
    'a0cad48fedb89dc7c0fa6b740d9359386dd28773c014531b1bc3da341cadc006',
    '126103bfddc8df256b6e0abfd7f3797c80dcc4ea88f7c2f87dd4104220b4d65f',
    '1bc70a0148b3f316da33fe3c89f23e3e71ac4ff998027ec712b905cd24f6a411',
    '53a8392e971b46326e3d0f8967db17c4f7cca4d42be979b1664124c8f69af528',
    '7cf68b47a2b243d06322bfdb6a1c2422fb8b3a18d18a5c90c27b59e8f612553e',
    'ff27d01cb1e56fb58580306c7ba76bb037bf211c5b573c56e4e70ca858755af0',
    '102b4361094fab14f495ab497b6150f397012f1a70322ff311291284319134d5',
    'a9e5bff17ded4a4a3bf4de3ff7be295ca85678ac4f9dc647a1c3829f52e65299',
    '0a722ca20e1ccff0adfdc8c2abb097957f0e0bf32db18c4281f031756d50eb8d',
    '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
    '9be0b1f46bafbdbca0dcb5983cacbe72bc6c0bb867aae065a0a30c3b97c9f2a8',
    '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
    '0c98c195d9d44a99eac12f4134d47ced21c764fb6b12440de8ca3adbf0c373a7',
    'aba7339fe76595d4ad5bff333f1ba1e9198907588a49df4519a3ade60cc1f998',
    '0497384b57b43c107a778870462901bf68e0e8583b32e2816563543c059784a4',
    'c5cfda98d01f152b3493d995eed4cdb4d9e55a973925f6f9ea24769a5a21e778',
    '6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93',
    '768652d2b4c1b3dd0bdac9e6c148d326e4bacc706b7ed8c7bfdaf7e38bc91169',
    '3cbb4f4d9b7bf2bb8b8d80f1093dd1d968e35fc57e01bb640fb905832d0762b2',
    '69dfcf1cf5be81090d9d95314ffb81e0230b9f569d350cb2babe608d4faaf3b0',
    'a6f6fc70f8c3d5b646268bbcde1ede9571a1ff212c0c4f5716ab73194100bfc8',
    '59b96df8d8b5e66b3b95a3e1ba159750a6edd69bcbba1857aeb652a5b208bd59',
    '9a576bd96047d9884a93abb2bb0446092b9a1bc773a452143e7f465e538775f4',
    '0c4dfa654789b44342f77009f6904edc2e2702e60d8b1cbdebf8459fc04ba2f7',
    'b4b83249c73ac041037cd539a5bc19536bc3c785c31c837e0322fbbab5b2b6fd',
    '87fff6b566564cabee1b2940acddc52a022eca0779be9572a7563598662b6df1',
    '83bb3f6274403cc167c09e0ddd75857b933510a59cc345d16d67e6fae3f870d7',
    '7b3f7803750746f455413a221f80965eecb69ef308f2ead1da89cc2c8912e968',
    '2824434e9d79add8aae9007340877d165e8654351086ebbd12e881a5e53f37cc',
    'cb92d81fded72024a68ff0e693a9e6b35687c56040a8780fd739ac6228f9fde5',
    '36e8d5095a5b9a6c828efab190c7724122e11576ad1f60ab84203eccbf0c6a1e',
    '3fc5f8553abd753ac47967c4c468cfd08e8cb9dee71b79e12d5adab205bc04d3',
    '460c25e682fda7832b52d1f22d3d22b3176d972f60dcdc3212ed8c92ef85065c',
    '9a823b55a34de9e7af1e0099fc77b10ce4a4f1be672b285c9b4862e3c0cacb02',
    '645681b9d067b1a362c4bee8ddff987d2466d49905c26cb8fec5e6fb73af5c84',
    '390187d5b7ed725503cb10bff9ac39120711ca97f974394b9b364c29eb77757b',
    '1cb14ab335876fc9efc37d838ba287cf17e5adcccb20bf6d49f9da9695d52462',
    'f76e2a9bb1bb2cc65ef572382102d309c3efd2641081888a91e029138e8044de',
    'efc37e97fa4fad679e464b7a6184009b7cc7605aceb0c5f56b464d2b986a60f0',
    '1f601e6ba82d9387164278c55168b103b60cd206d49b7bf19670a8221c644096',
    '2733d5345d836c373d39a20efa7d519a7db57cd6260a558e4ed5f9dd69a83bf6',
    'd91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075',
    '7cc328a08ddb2afdf9f9be77beff4c83489ff979721827d628a542f32a247c0e',
    'e9eac471d33e709418c268e9d6e9989384b319fbe789010dcf674071e9d4d6bb',
    '27797bd4e5ee52db0a197668c92b9a3e7e237e1f9fa73a10c38d731c294cfc9a',
    'c6f7077f1699d50cf92a9652bfebffac05fc6842b9ee391089d959b8ad5d48fd',
    'd61f3bc5b3eb4400efdae6169a5c17cabf3246b514361de939ce4a1a0da6ef4a',
    'f0eab82c761167393a15e0a6194b0f1f278b175ed2ac642d7677e9a7b86773e6',
    'c060b31fe2bbb0be4d393bc7c40a80848a25b8f0e0f382cb5b49c37bf7476cb4',
    '7adb520c3ac7cb6dc8253508df0ce1d975da49fefda9b5c956744a049d230ace',
  ];
  const [selectNumber, setSelectNumber] = useState<number>(0);
  const [msg, setMsg] = useState<DbEvent[]>([]);
  const [queryTime, setQueryTime] = useState<number>(0);
  const { worker } = useCallWorker();

  const query = async (msgFilter: HomeMsgFilter) => {
    setQueryTime(0);
    setMsg([]);
    const start = performance.now();
    const filter = msgFilter.filter;
    filter.authors = authors;
    const events = await dbQuery.matchFilterRelay(
      filter,
      relayUrls,
      msgFilter.isValidEvent,
    );
    const diff = performance.now() - start;
    console.log('total query time: ', diff);
    setQueryTime(diff);
    setMsg(events);
  };

  useEffect(() => {
    const msgFilter = homeMsgFilters[selectNumber];
    query(msgFilter);
  }, [selectNumber]);

  return (
    <BaseLayout>
      <Left>
        <div>
          {homeMsgFilters.map((item, index) => (
            <Button key={index} onClick={() => setSelectNumber(index)}>
              {item.label}
            </Button>
          ))}
          <hr />
          selected {homeMsgFilters[selectNumber].label}, time:{' '}
          {queryTime.toLocaleString()} ms
          <hr />
          <PostItems msgList={msg} relays={relayUrls} worker={worker!} />
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default Perf;

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});
