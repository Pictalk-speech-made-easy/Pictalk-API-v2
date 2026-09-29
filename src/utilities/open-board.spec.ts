import * as JSZip from 'jszip';
import { v1_to_obz, V1Entity } from './open-board';

const item = (id: number, priority: number, createdDate: string, extra: Partial<V1Entity> = {}): V1Entity => ({
  id, meaning: { en: `item${id}` }, speech: {}, image: null, color: null, pictohubId: null, priority, createdDate, ...extra,
});

describe('v1_to_obz ordering', () => {
  it('orders buttons by priority then creation date, pictos and collections mixed, sider last', async () => {
    const sub = item(2, 5, '2024-01-03', { pictos: [], collections: [] });
    const sider = item(9, 1, '2020-01-01', { pictos: [item(90, 10, '2024-01-01')], collections: [] });
    const root = item(1, 10, '2024-01-01', {
      pictos: [item(10, 10, '2024-01-05', { image: 'abc.png' }), item(11, 1, '2024-01-09'), item(12, 10, '2024-01-02')],
      collections: [sub],
    });

    const buf = await v1_to_obz([root, sub, sider], { id: 1, username: 'u', displayLanguage: 'en', root: 1, sider: 9 });
    const obf = JSON.parse(await (await JSZip.loadAsync(buf)).file('root.obf')!.async('string'));

    const expected = ['11', '2', '12', '10', '9'];
    expect(obf.buttons.map(b => b.id)).toEqual(expected);
    expect(obf.grid.order.flat().filter(Boolean)).toEqual(expected);
    // pictalk-api only imports image urls, so the default must be the assets-api proxy, not base64
    expect(obf.images).toEqual([{
      id: 'img_abc.png',
      url: 'https://assets-api.pictalk.org/proxy/image?url=https://api.pictalk.org/image/pictalk/abc.png',
      content_type: 'image/png',
    }]);
    expect(obf.buttons.find(b => b.id === '10').image_id).toBe('img_abc.png');
  });
});
