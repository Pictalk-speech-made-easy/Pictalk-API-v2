import * as JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { extname, basename, join } from 'path';

// ─── V1 input types ───────────────────────────────────────────────────────────
export type V1Entity = {
  id: number;
  meaning: Record<string, string>;
  speech: Record<string, string>;
  image: string | null;
  color: string | null;
  pictohubId: number | null;
  pictos?: V1Entity[];
  collections?: V1Entity[];
};
export type V1UserDetails = {
  id: number;
  username: string;
  displayLanguage: string;
  root: number;
  sider?: number;
};
export type ObzExportOptions = {
  language?: string;
  gridColumns?: number;
  gridRows?: number;
  filesBasePath?: string; // defaults to '/files'
  imageMode?: 'base64' | 'url';
};

// ─── OBF structural types (subset, kept local to avoid circular imports) ──────
type OBFButton = {
  id: string;
  label?: string;
  vocalization?: string;
  border_color?: string;
  background_color?: string;
  image_id?: string;
  load_board?: { path: string };
};
type OBFImage = {
  id: string;
  url?: string;
  data_url?: string;
  content_type?: string;
};
type OBFBoard = {
  format: string;
  id: string;
  locale: string;
  name: string;
  buttons: OBFButton[];
  images: OBFImage[];
  sounds: unknown[];
  grid: { rows: number; columns: number; order: (string | null)[][] };
  ext_coughdrop_image_url?: string;
};
type OBFManifest = {
  format: string;
  root: string;
  paths: { boards: Record<string, string> };
};

// ─── Constants ────────────────────────────────────────────────────────────────
const PICTALK_CDN = 'https://api.pictalk.org/image/pictalk';
const ASSETS_API = 'https://assets-api.pictalk.org';

const DEFAULT_FILES_PATH = join(process.cwd(), 'files');
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parse_locale_map(value: Record<string, string> | string | null | undefined): Record<string, string> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return value;
}
function pick_locale(user: V1UserDetails, options: ObzExportOptions): string {
  return options.language ?? user.displayLanguage ?? 'fr';
}
function is_valid(entity: V1Entity): boolean {
  return Object.keys(parse_locale_map(entity.meaning)).length > 0 || entity.image !== null;
}
function get_label(entity: V1Entity, locale: string): string {
  const m = parse_locale_map(entity.meaning);
  return m[locale] ?? Object.values(m)[0] ?? '';
}
function get_speech(entity: V1Entity, locale: string): string {
  const s = parse_locale_map(entity.speech);
  return s[locale] ?? Object.values(s)[0] ?? '';
}
function auto_grid(count: number, options: ObzExportOptions): { rows: number; cols: number } {
  const cols = options.gridColumns ?? Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = options.gridRows ?? Math.max(1, Math.ceil(count / cols));
  return { rows, cols };
}

/**
 * Reads the image file from disk and returns a base64 data URL.
 * Falls back to the Pictalk CDN URL (strip extension → .avif) if the file
 * cannot be read (e.g. user-avatar images that may not be images pictos).
 */
async function resolve_image(
  image: string,
  files_base: string,
  image_mode: 'base64' | 'url' = 'base64',
): Promise<OBFImage | null> {
  const ext = extname(image).toLowerCase();
  const content_type = CONTENT_TYPES[ext] ?? 'image/jpeg';

  if (image_mode === 'url') {
    const cdn_url = `${PICTALK_CDN}/${image}`;
    return {
      id: `img_${image}`,
      url: `${ASSETS_API}/proxy/image?url=${cdn_url}`,
      content_type,
    };
  }

  const full_path = join(files_base, image);
  try {
    const buffer = await readFile(full_path);
    return {
      id: `img_${image}`,
      data_url: `data:${content_type};base64,${buffer.toString('base64')}`,
      content_type,
    };
  } catch (e) {
    console.warn(`[obz] Could not read image: ${full_path}`, e.message);
    return null;
  }
}

// ─── Core board builder ───────────────────────────────────────────────────────
async function collection_to_obf(
  collection: V1Entity,
  locale: string,
  options: ObzExportOptions,
  files_base: string,
  image_mode: 'base64' | 'url',
): Promise<OBFBoard> {
  // Pictos first, then sub-collections — both filtered for validity
  const children: V1Entity[] = [
    ...(collection.pictos ?? []),
    ...(collection.collections ?? []),
  ].filter(is_valid);
  const sub_collection_ids = new Set((collection.collections ?? []).map(c => c.id));
  const { rows, cols } = auto_grid(children.length, options);
  const order: (string | null)[][] = Array.from({ length: rows }, () => Array<null>(cols).fill(null));
  const buttons: OBFButton[] = [];
  const images: OBFImage[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const btn_id = String(child.id);
    const label = get_label(child, locale);
    const speech = get_speech(child, locale);
    const button: OBFButton = {
      id: btn_id,
      label,
      ...(speech && speech !== label ? { vocalization: speech } : {}),
      ...(child.color ? { background_color: child.color } : {}),
    };
    if (child.image) {
      const obf_image = await resolve_image(child.image, files_base, image_mode);
      if (obf_image) {
        button.image_id = obf_image.id;
        images.push(obf_image);
      }
    }
    if (sub_collection_ids.has(child.id)) {
      button.load_board = { path: `boards/${child.id}.obf` };
    }
    buttons.push(button);
    const row = Math.floor(i / cols);
    const col = i % cols;
    if (row < rows) order[row]![col] = btn_id;
  }
  return {
    format: 'open-board-0.1',
    id: String(collection.id),
    locale,
    name: get_label(collection, locale),
    buttons,
    images,
    sounds: [],
    grid: { rows, columns: cols, order },
  };
}

// ─── Public export ────────────────────────────────────────────────────────────
/**
 * Converts a flat V1 collection array + user details into an OBZ buffer.
 *
 * @param flat_collections - Full flat array returned by get_collections()
 * @param user             - User details (provides root id + display language)
 * @param options          - Optional overrides for locale, grid size, files path
 */
export async function v1_to_obz(
  flat_collections: V1Entity[],
  user: V1UserDetails,
  options: ObzExportOptions = {},
): Promise<Buffer> {
  const locale = pick_locale(user, options);
  const files_base = options.filesBasePath ?? DEFAULT_FILES_PATH;
  const image_mode = options.imageMode ?? 'base64';
  // Index the flat array so sub-collections resolve to their fully-populated entry
  const by_id = new Map<number, V1Entity>(flat_collections.map(c => [c.id, c]));
  const root = by_id.get(user.root);
  if (!root) throw new Error(`Root collection ${user.root} not found in flat_collections`);
  const sider = user.sider ? by_id.get(user.sider) : undefined;
  const augmented_root: V1Entity = sider
    ? {
      ...root,
      collections: [
        ...(root.collections ?? []),
        {
          ...sider,
          // Provide a fallback label if the sider has no meaning
          meaning: sider.meaning && Object.keys(sider.meaning).length > 0
            ? sider.meaning
            : { fr: 'Barre latérale', en: 'Sidebar', de: 'Seitenleiste', nl: 'Zijbalk', es: 'Barra lateral', it: 'Barra laterale' },
        },
      ],
    }
    : root;
  const zip = new JSZip();
  const board_paths: Record<string, string> = {};
  // BFS — each collection becomes one .obf file
  const queue: { entity: V1Entity; filename: string }[] = [
    { entity: augmented_root, filename: 'root.obf' },
  ];
  const visited = new Set<number>([user.root]);
  while (queue.length > 0) {
    const { entity, filename } = queue.shift()!;
    const obf = await collection_to_obf(entity, locale, options, files_base, image_mode);
    if (filename === 'root.obf') {
      obf.ext_coughdrop_image_url = 'https://buddy.pictalk.org/legacy_logo.png';
    }
    zip.file(filename, JSON.stringify(obf, null, 2));
    board_paths[filename] = filename;
    for (const sub of entity.collections ?? []) {
      if (!is_valid(sub) || visited.has(sub.id)) continue;
      visited.add(sub.id);
      // Prefer the fully-populated flat entry over the shallow nested snapshot
      const full = by_id.get(sub.id) ?? sub;
      queue.push({ entity: full, filename: `boards/${sub.id}.obf` });
    }
  }
  const manifest: OBFManifest = {
    format: 'open-board-0.1',
    root: 'root.obf',
    paths: { boards: board_paths },
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/zip' });
}