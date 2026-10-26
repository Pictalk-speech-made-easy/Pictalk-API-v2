import * as JSZip from 'jszip';
import { v1_to_obz, V1Entity } from './open-board';

const item = (id: number, priority: number, createdDate: string, extra: Partial<V1Entity> = {}): V1Entity => ({
  id, meaning: { en: `item${id}` }, speech: {}, image: null, color: null, pictohubId: null, priority, createdDate, ...extra,
});

describe('v1_to_obz ordering', () => {
  it('orders buttons by priority then creation date, pictos and collections mixed', async () => {
    const sub = item(2, 5, '2024-01-03', { pictos: [], collections: [] });
    const sider = item(9, 1, '2020-01-01', { pictos: [item(90, 10, '2024-01-01')], collections: [] });
    const root = item(1, 10, '2024-01-01', {
      pictos: [item(10, 10, '2024-01-05', { image: 'abc.png' }), item(11, 1, '2024-01-09'), item(12, 10, '2024-01-02')],
      collections: [sub],
    });

    const buf = await v1_to_obz([root, sub, sider], { id: 1, username: 'u', displayLanguage: 'en', root: 1, sider: 9 });
    const obf = JSON.parse(await (await JSZip.loadAsync(buf)).file('root.obf')!.async('string'));

    const expected = ['11', '2', '12', '10'];
    expect(obf.buttons.map(b => b.id)).toEqual(expected);
    expect(obf.grid.order.flat().filter(Boolean)).toEqual(expected);
    expect([obf.grid.rows, obf.grid.columns]).toEqual([4, 6]);
    expect(obf.grid.order).toHaveLength(4);
    expect(obf.grid.order.every(r => r.length === 6)).toBe(true);
    // pictalk-api only imports image urls, so the default must be the assets-api proxy, not base64
    expect(obf.images).toEqual([{
      id: 'img_abc.png',
      url: 'https://assets-api.pictalk.org/proxy/image?url=https://api.pictalk.org/image/pictalk/abc.png',
      content_type: 'image/png',
    }]);
    expect(obf.buttons.find(b => b.id === '10').image_id).toBe('img_abc.png');
  });

  it('grows rows past 4 when a page has more than 24 items, keeping 6 columns', async () => {
    const root = item(1, 10, '2024-01-01', {
      pictos: Array.from({ length: 25 }, (_, i) => item(100 + i, 10, '2024-01-01')), collections: [],
    });
    const buf = await v1_to_obz([root], { id: 1, username: 'u', displayLanguage: 'en', root: 1 });
    const obf = JSON.parse(await (await JSZip.loadAsync(buf)).file('root.obf')!.async('string'));
    expect([obf.grid.rows, obf.grid.columns]).toEqual([5, 6]);
    expect(obf.grid.order.flat().filter(Boolean)).toHaveLength(25);
  });

  it('exports the "shared with me" folder as a root button, labelled when it has no meaning', async () => {
    const own_child = item(30, 10, '2024-01-01', { pictos: [item(300, 10, '2024-01-01')], collections: [] });
    const shared = item(3, 10, '2020-01-01', { meaning: {}, pictos: [], collections: [own_child] });
    const sider = item(9, 10, '2020-01-01', { pictos: [item(90, 10, '2024-01-01')], collections: [] });
    const root = item(1, 10, '2024-01-01', { pictos: [item(10, 10, '2024-01-01')], collections: [] });

    const buf = await v1_to_obz([root, shared, own_child, sider], { id: 1, username: 'u', displayLanguage: 'it', root: 1, sider: 9, shared: 3 });
    const zip = await JSZip.loadAsync(buf);
    const obf = JSON.parse(await zip.file('root.obf')!.async('string'));
    expect(obf.buttons.map(b => b.id)).toEqual(['10', '3']);
    expect(obf.buttons.find(b => b.id === '3')).toMatchObject({ label: 'Condivisi con me', load_board: { path: 'boards/3.obf' } });
    expect(zip.file('boards/30.obf')).not.toBeNull();
  });

  it('leaves an empty "shared with me" folder out', async () => {
    const root = item(1, 10, '2024-01-01', { pictos: [item(10, 10, '2024-01-01')], collections: [] });
    const shared = item(3, 10, '2020-01-01', { meaning: {}, pictos: [], collections: [] });
    const buf = await v1_to_obz([root, shared], { id: 1, username: 'u', displayLanguage: 'en', root: 1, shared: 3 });
    const zip = await JSZip.loadAsync(buf);
    expect(JSON.parse(await zip.file('root.obf')!.async('string')).buttons.map(b => b.id)).toEqual(['10']);
    expect(zip.file('boards/3.obf')).toBeNull();
  });
});

describe('v1_to_obz sidebar', () => {
  const food = item(3, 10, '2024-01-01', { meaning: { fr: 'manger' }, pictos: [item(30, 10, '2024-01-01')], collections: [] });
  const root = item(1, 10, '2024-01-01', { pictos: [item(10, 10, '2024-01-01')], collections: [food] });
  const user = { id: 1, username: 'u', displayLanguage: 'fr', root: 1, sider: 9 };

  it('exports a sidebar with content as its own one-column board, named on the root and opened by no button', async () => {
    const sider = item(9, 10, '2020-01-01', { meaning: {}, pictos: [item(90, 1, '2024-01-01'), item(91, 2, '2024-01-01')], collections: [food] });
    const zip = await JSZip.loadAsync(await v1_to_obz([root, food, sider], user));
    const read = async (path: string) => JSON.parse(await zip.file(path)!.async('string'));
    const root_obf = await read('root.obf');
    const manifest = await read('manifest.json');

    expect(root_obf.ext_buddy_sidebar_page).toBe('boards/9.obf');
    expect(root_obf.buttons.map(b => b.id)).toEqual(['10', '3']);
    expect(manifest.paths.boards['boards/9.obf']).toBe('boards/9.obf');
    const side = await read('boards/9.obf');
    expect(side.name).toBe('Barre latérale');
    expect(side.grid.columns).toBe(1);
    expect(side.grid.order.flat().filter(Boolean)).toEqual(['90', '91', '3']);
    // Its folders open the same boards as the root's.
    expect(side.buttons.find(b => b.id === '3').load_board).toEqual({ path: 'boards/3.obf' });
  });

  it('exports nothing for an empty sidebar', async () => {
    const sider = item(9, 10, '2020-01-01', { meaning: {}, pictos: [], collections: [] });
    const zip = await JSZip.loadAsync(await v1_to_obz([root, food, sider], user));
    const root_obf = JSON.parse(await zip.file('root.obf')!.async('string'));

    expect(root_obf.ext_buddy_sidebar_page).toBeUndefined();
    expect(zip.file('boards/9.obf')).toBeNull();
  });
});
