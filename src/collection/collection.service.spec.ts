import * as JSZip from 'jszip';
import { CollectionService } from './collection.service';
import { v1_to_obz } from 'src/utilities/open-board';

// In-memory stand-in for the two tables and join tables get_collections reads
const col = (id: number, userId: number, editors: string[] = []) =>
  ({ id, userId, editors, viewers: [], meaning: { fr: `c${id}` }, speech: {}, image: null, color: null, pictohubId: null, priority: 10 });
const collections = [col(547, 82), col(700, 61, ['pabloA@pictalk.org']), col(284085, 61, ['someone@else.org']), col(999, 61)];
const pictos = [6526820, 6527044, 7].map(id => ({ id, meaning: { fr: `p${id}` }, speech: {}, image: null, color: null, pictohubId: null, priority: 10 }));
const picto_links = [{ collectionId: 284085, pictoId: 6526820 }, { collectionId: 284085, pictoId: 6527044 }, { collectionId: 999, pictoId: 7 }];
const collection_links = [{ parent_id: 547, child_id: 700 }, { parent_id: 547, child_id: 284085 }, { parent_id: 284085, child_id: 999 }, { parent_id: 999, child_id: 547 }]; // cycle back to root

function query_builder(rows: any[]) {
  let found = rows;
  const qb = {
    where: (sql: string, p: any) => { found = found.filter(r => sql.includes('!=') ? r.userId !== p.userId : r.userId === p.userId); return qb; },
    andWhere: (_: string, p: any) => { found = found.filter(r => [...r.editors, ...r.viewers].includes(p.username)); return qb; },
    whereInIds: (ids: number[]) => { found = rows.filter(r => ids.includes(r.id)); return qb; },
    getMany: async () => found.map(r => ({ ...r })),
  };
  return qb;
}
const repository = {
  createQueryBuilder: () => query_builder(collections),
  manager: { getRepository: () => ({ createQueryBuilder: () => query_builder(pictos) }) },
  query: async (sql: string, [ids]: [number[]]) => sql.includes('collection_pictos_picto')
    ? picto_links.filter(l => ids.includes(l.collectionId))
    : collection_links.filter(l => ids.includes(l.parent_id)),
};
const service = Object.assign(Object.create(CollectionService.prototype), { collectionRepository: repository }) as CollectionService;
const user = { id: 82, username: 'pabloA@pictalk.org' } as any;

describe('get_collections', () => {
  it('leaves collections linked from someone else out by default (frontend /all payload unchanged)', async () => {
    const ids = (await service.get_collections(user)).map(c => c.id);
    expect(ids).toEqual([547, 700]);
  });

  it('follows linked collections for the export, so their boards are not empty', async () => {
    const result = await service.get_collections(user, true);
    expect(result.map(c => c.id)).toEqual([547, 700, 284085, 999]);
    expect(result.find(c => c.id === 284085).pictos.map(p => p.id)).toEqual([6526820, 6527044]);

    const buf = await v1_to_obz(result as any, { id: 82, username: 'pabloA', displayLanguage: 'fr', root: 547 });
    const zip = await JSZip.loadAsync(buf);
    const board = JSON.parse(await zip.file('boards/284085.obf')!.async('string'));
    expect(board.buttons.map(b => b.id)).toEqual(['6526820', '6527044', '999']);
    expect(zip.file('boards/999.obf')).not.toBeNull();
  });

  it('migration (include_shared=false): copies linked collections, leaves shared ones to sharing', async () => {
    const result = await service.get_collections(user, true, false);
    expect(result.map(c => c.id)).toEqual([547, 284085, 999]);
    expect(result.find(c => c.id === 547).collections.map(c => c.id)).toEqual([284085]);
    expect(result.find(c => c.id === 284085).pictos).toHaveLength(2);
  });
});
