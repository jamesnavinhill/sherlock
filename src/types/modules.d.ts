declare module 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js' {
  import { Base } from 'wa-sqlite/src/VFS.js';

  export class IDBBatchAtomicVFS extends Base {
    constructor(name: string);
    name: string;
  }
}
