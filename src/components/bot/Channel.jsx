import React, { useEffect, useState } from 'react';
import { FeedItems } from '../../func/FeedItem';
import { PostKomen } from '../../func/PostKomen';
import { LikePostingan } from '../../func/putLikePostingan'; // Tambahkan import ini
import katanyaData from "../../WorldList/Kata-Kata Follow Indonesia.json";
import { Follows } from '../../func/putFollow';

function Channel({ profileStates, bearer }) {
    const tokens = bearer.split('\n').filter(token => token.trim() !== '');
    const [PilihProfile, setPilihProfile] = useState(null);
    const [AlamatChhanel, setAlamatChhanel] = useState("");
    const [indexKeberapa, setindexKeberapa] = useState("");
    const TokenIndex = tokens[indexKeberapa - 1];
    const [SeluruhDatanya, setSeluruhDatanya] = useState([]);
    const [IsiKomen, setIsiKomen] = useState("");
    const [KomentarHashes, setKomentarHashes] = useState(new Set());
    const [LoadingButton, setLoadingButton] = useState(false);
    const [ProsesSelesai, setProsesSelesai] = useState(false);
    const [isFeedLoaded, setIsFeedLoaded] = useState(false);

    useEffect(() => {
        const storedHashes = localStorage.getItem('KomentarHashes');
        if (storedHashes) {
            setKomentarHashes(new Set(JSON.parse(storedHashes)));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('KomentarHashes', JSON.stringify([...KomentarHashes]));
    }, [KomentarHashes]);

    useEffect(() => {
        if (ProsesSelesai) {
            otomatisasi();
        }
    }, [ProsesSelesai]);

    function extractAirdropfid(url) {
        const pattern = /\/channel\/([^\/]+)/;
        const match = AlamatChhanel.match(pattern);
        return match ? match[1] : null;
    }
    const airdropfid = extractAirdropfid(AlamatChhanel);

    async function FeeditemButton() {
        console.log('Feed'); // Menampilkan pesan log untuk menandai awal proses feed
    
        setLoadingButton(true);
        setIsFeedLoaded(false);
        setProsesSelesai(true);
    
        try {
            const Datanya = await FeedItems(TokenIndex, airdropfid, null, null, KomentarHashes);
            console.log('Data feed pertama berhasil dimuat:', Datanya); // Menampilkan data feed pertama yang berhasil dimuat
    
            const Hash = Datanya?.items?.map((item) => ({
                hash: item?.cast?.hash,
                fid: item?.cast?.author?.fid,
                excludeItemIdPrefixes: item?.cast?.hash.slice(2, 10),
            }));
    
            const excludeItemIdPrefixes = Hash.map(item => item.excludeItemIdPrefixes);
            const data2 = await FeedItems(TokenIndex, airdropfid, Datanya.latestMainCastTimestamp, excludeItemIdPrefixes, KomentarHashes);
            console.log('Data feed kedua berhasil dimuat:', data2); // Menampilkan data feed kedua yang berhasil dimuat
    
            const Hash2 = data2?.items?.map((item) => ({
                hash: item?.cast?.hash,
                fid: item?.cast?.author?.fid,
                excludeItemIdPrefixes: item?.cast?.hash.slice(2, 10),
            }));
    
            const SatuanSeluruhnya = [...Hash, ...Hash2];
    
            // Filter data yang sudah ada di KomentarHashes
            const filteredData = SatuanSeluruhnya.filter(item => !KomentarHashes.has(item.hash));
    
            setSeluruhDatanya([filteredData]);
            setLoadingButton(false);
            setIsFeedLoaded(true);
    
            console.log('Proses feed selesai.'); // Menampilkan pesan log untuk menandai akhir proses feed
        } catch (error) {
            console.error('Error saat memuat feed:', error); // Menampilkan pesan error jika terjadi kesalahan saat memuat feed
        }
    }
    

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function komen() {
        const items = SeluruhDatanya?.[0] || [];

        try {
            for (let i = 0; i < items.length; i++) {
                const { hash, fid } = items[i];
                if (KomentarHashes.has(hash)) {
                    console.log(`Hash ${hash} sudah dikomentari, melewati.`);
                    continue;
                }

                const komenText = katanyaData[i % katanyaData.length];
                console.log(`Following fid: ${fid} and posting comment "${komenText}" for hash: ${hash}`);

                try {
                    const followResponse = await Follows(TokenIndex, fid);
                    console.log('Follow response:', followResponse);
                } catch (followError) {
                    console.error(`Failed to follow fid: ${fid}`, followError);
                }

                try {
                    const commentResponse = await PostKomen(TokenIndex, komenText, hash);
                    console.log('Comment response:', commentResponse);
                    // Tambahkan auto like setelah komentar berhasil diposting
                    await LikePostingan(TokenIndex, hash, 'LinkConfersession');
                    setKomentarHashes(prevHashes => {
                        const newHashes = new Set(prevHashes);
                        newHashes.add(hash);
                        return newHashes;
                    });
                } catch (commentError) {
                    console.error(`Failed to post comment for hash: ${hash}`, commentError);
                }
                setIsiKomen(`Posting follow dan komen "${komenText}"`);

                await delay(120000); // 300000 ms = 5 menit
            }
            setProsesSelesai(true);
        } catch (error) {
            console.error("Failed to process items:", error);
        }
    }

    async function otomatisasi() {
        await FeeditemButton();
        await komen();
        setProsesSelesai(false); // Reset status proses selesai
    }

    return (
        <div className=' '>
            <div className='mt-2 text-center '>
                <label className='font-bold text-teal-400'>Pilih Akun Dahulu</label>
            </div>
            <div className='flex justify-center'>
                <select onChange={(e) => { setindexKeberapa(e.target.selectedIndex); setPilihProfile(e.target.value) }} className='w-11/12 border border-gray-300 rounded-md text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-gray-400 focus:outline-none appearance-none'>
                    <option>Pilih Akun</option>
                    {profileStates && profileStates.map((item, index) => (
                        <option key={item.user.fid} value={item.user.fid}>{index + 1}. {item.user.username}</option>
                    ))}
                </select>
            </div>
            {PilihProfile != null && (
                <>
                    <div className='mt-2 text-center'>
                        <label className='font-bold text-teal-400'>Masukkan Link Channel</label>
                    </div>
                    <div className='flex justify-center'>
                        <input onChange={(e) => setAlamatChhanel(e.target.value)} placeholder='https://warpcast.com/~/channel/airdropfind' className='text-sm w-[15rem] border border-gray-300 rounded-md text-gray-600 h-10 pl-2 pr-2 bg-white hover:border-gray-400 focus:outline-none appearance-none' type='text' />
                        <button disabled={LoadingButton} onClick={FeeditemButton} className='ml-3 bg-teal-400 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:text-white'>
                            {LoadingButton ? "Loading..." : "Search"}
                        </button>
                    </div>
                </>
            )}
            {PilihProfile != null && SeluruhDatanya != null && !LoadingButton && isFeedLoaded && (
                <>
                    <div className='flex flex-col text-center items-center justify-center '>
                        <div className='mt-2 '>
                            <button onClick={komen} className='w-[20rem] h-[2.2rem] mt-2 bg-red-400 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:text-white'>Gas Bang</button>
                        </div>
                        <div className='mt-4 text-green-400'>
                            {IsiKomen}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Channel;
