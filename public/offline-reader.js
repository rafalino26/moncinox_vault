/* Read-only fallback. Text from financial records is never inserted as HTML. */
(async function () {
  const element = id => document.getElementById(id);
  const api = globalThis.MoncinoxOfflineStore;
  element('reconnect').addEventListener('click', () => location.reload());
  if (!api) { element('storage-status').textContent = 'Data offline belum siap. Buka aplikasi saat online terlebih dahulu.'; return; }
  const keys = ['wallets', 'transactions', 'income'];
  const stores = Object.fromEntries(keys.map(key => [key, api.createFinancePersistence(key)]));
  const results = await Promise.allSettled(keys.map(key => stores[key].read()));
  const records = Object.fromEntries(keys.map((key, index) => [key, results[index].status === 'fulfilled' ? results[index].value : undefined]));
  if (results.some(result => result.status === 'rejected')) element('storage-status').textContent = 'Sebagian penyimpanan offline tidak bisa dibaca. Buka aplikasi saat online untuk memuat data kembali.';
  let view = location.pathname.startsWith('/pemasukan') ? 'income' : location.pathname.startsWith('/pengeluaran') ? 'transactions' : 'summary';
  let limit = 50;
  const names = { Saya: 'Puskasw', Pacar_Saya: 'Miskasw' };
  const money = value => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
  const stamp = record => record ? `Data terakhir diperbarui ${new Date(record.updatedAt).toLocaleString('id-ID')}` : 'Belum tersimpan. Buka halaman ini saat online terlebih dahulu.';
  function node(tag, text, className) {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  }
  function renderWallets() {
    const container = element('wallets');
    container.replaceChildren();
    for (const [field, name] of [['rafaWallet', 'Puskasw'], ['monikWallet', 'Miskasw']]) {
      const wallet = records.wallets?.data[field];
      const card = node('div', undefined, 'wallet');
      card.append(node('p', name), node('strong', wallet ? money(wallet.balance) : 'Belum ada data'), node('span', stamp(records.wallets), 'stamp'));
      container.append(card);
    }
  }
  function render() {
    const key = view === 'income' ? 'income' : 'transactions';
    const record = records[key];
    const search = element('search').value.toLocaleLowerCase('id-ID').trim();
    const person = element('person').value;
    const rows = (record?.data || []).filter(row => (person === 'all' || row.sumber === person) &&
      `${row.keterangan || 'Uang saku'} ${names[row.sumber]} ${row.tipe || 'pemasukan'} ${row.jumlah}`.toLocaleLowerCase('id-ID').includes(search))
      .slice().sort((a, b) => new Date(b.tanggal || b.createdAt) - new Date(a.tanggal || a.createdAt));
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    element('wallets').hidden = view !== 'summary';
    element('history-title').textContent = view === 'income' ? 'Pemasukan tersimpan' : 'Pengeluaran & tabungan tersimpan';
    element('stamp').textContent = stamp(record);
    element('empty').textContent = !record ? 'Belum ada salinan di perangkat ini. Buka halaman terkait saat online untuk menyimpannya.' : rows.length ? `${rows.length} catatan tersimpan` : 'Tidak ada catatan yang cocok.';
    const list = element('rows');
    list.replaceChildren();
    for (const row of rows.slice(0, limit)) {
      const item = node('li');
      const description = node('div');
      description.append(node('b', row.keterangan || `Uang saku ${names[row.sumber]}`), node('small', `${names[row.sumber]} · ${row.tipe === 'tabungan' ? 'Tabungan · ' : ''}${new Date(row.tanggal || row.createdAt).toLocaleDateString('id-ID')}`));
      item.append(description, node('strong', money(row.jumlah)));
      list.append(item);
    }
    element('more').hidden = rows.length <= limit;
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; limit = 50; render(); }));
  for (const id of ['search', 'person']) element(id).addEventListener('input', () => { limit = 50; render(); });
  element('more').addEventListener('click', () => { limit += 50; render(); });
  const connection = () => { element('connection').textContent = navigator.onLine ? 'Tampilan data tersimpan · Coba hubungkan lagi untuk membuka aplikasi.' : 'Offline · hanya bisa dibaca.'; };
  window.addEventListener('online', connection);
  window.addEventListener('offline', connection);
  connection();
  element('clear').hidden = !keys.some(key => records[key]);
  element('clear').addEventListener('click', async () => {
    if (!confirm('Hapus salinan offline di perangkat ini? Data di server tetap ada.')) return;
    try {
      await Promise.all(keys.map(key => stores[key].clear()));
      keys.forEach(key => { records[key] = undefined; });
      renderWallets(); render(); element('clear').hidden = true;
      element('storage-status').textContent = 'Salinan offline sudah dihapus dari perangkat ini.';
    } catch { element('storage-status').textContent = 'Salinan belum berhasil dihapus. Coba lagi.'; }
  });
  renderWallets(); render(); element('reader').hidden = false;
})();
