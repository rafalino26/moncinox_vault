import { getPemasukanHistory } from "@/app/actions/transactionActions";
import DeletePemasukanButton from "./components/DeletePemasukanButton"; // <-- Impor komponen baru

export default async function PemasukanPage() {
    const history = await getPemasukanHistory();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#5c2799]">Riwayat Pemasukan</h1>
                <p className="text-slate-600">Daftar semua uang saku yang pernah ditambahkan.</p>
            </div>

            <div className="space-y-3">
                {history.length > 0 ? (
                    history.map(item => (
                        <div key={item.id} className="bg-white/30 backdrop-blur-lg p-4 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">
                                    Pemasukan untuk <span className="text-blue-600">{item.sumber === 'Saya' ? 'Rafa' : 'Monik'}</span>
                                </p>
                                <p className="text-sm text-slate-600">
                                    {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-bold text-md text-green-600">+Rp{item.jumlah.toLocaleString('id-ID')}</p>
                                {/* Gunakan komponen yang sudah diimpor */}
                                <DeletePemasukanButton id={item.id} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white/30 backdrop-blur-lg text-center p-8 rounded-xl shadow-lg">
                        <p className="text-slate-500">Belum ada riwayat pemasukan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}